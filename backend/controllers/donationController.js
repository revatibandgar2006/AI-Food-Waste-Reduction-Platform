const db = require('../config/db');
const { predictFoodFreshness } = require('../services/aiFreshnessService');
const { broadcastDonationAlert } = require('../services/socketService');

// Convert quantity strings like "20 kg", "15 plates", "5 pieces" into kg.
function parseQuantityKg(quantityStr, foodType) {
  if (typeof quantityStr === 'number') return quantityStr;

  const str = String(quantityStr || '').toLowerCase().trim();
  const numMatch = str.match(/([0-9]+(?:\.[0-9]+)?)/);
  const num = numMatch ? parseFloat(numMatch[1]) : 1.0;

  if (
    str.includes('plate') ||
    str.includes('meal') ||
    str.includes('person') ||
    str.includes('serving')
  ) {
    return Math.round(num * 0.4 * 10) / 10;
  }

  if (str.includes('gm') || str.includes('gram')) {
    return Math.round((num / 1000) * 10) / 10;
  }

  if (str.includes('piece') || str.includes('item')) {
    return Math.round(num * 0.2 * 10) / 10;
  }

  return num || 1.0;
}

// @desc Create a food donation with AI freshness analysis
// @route POST /api/donations
// @access Private (DONOR, ADMIN)
const createDonation = async (req, res, next) => {
  try {
    const {
      name,
      quantity,
      type,
      expiry,
      location,
      latitude,
      longitude,
      description,
      storageType = 'Room Temperature',
      dietaryType = 'Vegetarian',
      cookedAt = new Date(),
    } = req.body;

    if (!name || !quantity || !type || !expiry || !location) {
      return res.status(400).json({
        success: false,
        message:
          'Name, quantity, food type, expiry time, and location are required.',
      });
    }

    // Coordinates are optional, but latitude and longitude must be supplied together.
    const lat =
      latitude === undefined || latitude === null || latitude === ''
        ? null
        : Number(latitude);
    const lng =
      longitude === undefined || longitude === null || longitude === ''
        ? null
        : Number(longitude);

    if (
      (lat === null) !== (lng === null) ||
      (lat !== null &&
        (!Number.isFinite(lat) ||
          !Number.isFinite(lng) ||
          lat < -90 ||
          lat > 90 ||
          lng < -180 ||
          lng > 180))
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid latitude and longitude together.',
      });
    }

    const donorId = req.user.id;
    const quantityKg = parseQuantityKg(quantity, type);
    const estimatedServings = Math.max(1, Math.round(quantityKg * 2.5));
    const expiryDate = new Date(expiry);

    if (Number.isNaN(expiryDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid expiry time.',
      });
    }

    // AI freshness and shelf-life prediction
    const aiPrediction = predictFoodFreshness({
      foodType: type,
      cookedAt,
      storageType,
      quantityKg,
    });

    const insertRes = await db.query(
      `INSERT INTO food_donations (
        donor_id,
        food_name,
        food_type,
        quantity_display,
        quantity_kg,
        servings_estimate,
        storage_type,
        cooked_at,
        expiry_time,
        pickup_location,
        latitude,
        longitude,
        description,
        dietary_type,
        status,
        freshness_score,
        spoilage_risk,
        shelf_life_hours,
        ai_recommendation,
        urgency_level
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, 'AVAILABLE',
        $15, $16, $17, $18, $19
      )
      RETURNING *`,
      [
        donorId,
        name.trim(),
        type,
        quantity,
        quantityKg,
        estimatedServings,
        storageType,
        cookedAt,
        expiryDate,
        location.trim(),
        lat,
        lng,
        description || null,
        dietaryType,
        aiPrediction.freshnessScore,
        aiPrediction.spoilageRisk,
        aiPrediction.shelfLifeHours,
        aiPrediction.aiRecommendation,
        aiPrediction.urgencyLevel,
      ]
    );

    const donation = insertRes.rows[0];

    // Notify connected clients about the new donation.
    broadcastDonationAlert(donation);

    return res.status(201).json({
      success: true,
      message: 'Food donation published successfully! Volunteers notified.',
      donation,
      aiAnalysis: aiPrediction,
    });
  } catch (err) {
    next(err);
  }
};

// @desc Get food donation listings with optional filters
// @route GET /api/donations
// @access Public or Private
const getAllDonations = async (req, res, next) => {
  try {
    const { status, type, urgency } = req.query;

    let queryText = `
      SELECT
        fd.*,
        u.name AS donor_name,
        u.phone AS donor_phone,
        dp.organization_name
      FROM food_donations fd
      JOIN platform_users u ON fd.donor_id = u.id
      LEFT JOIN donor_profiles dp ON dp.user_id = u.id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      params.push(status.toUpperCase());
      queryText += ` AND fd.status = $${params.length}`;
    } else {
      queryText += ` AND fd.status IN ('AVAILABLE', 'REQUESTED', 'ASSIGNED')`;
    }

    if (type) {
      params.push(type);
      queryText += ` AND fd.food_type = $${params.length}`;
    }

    if (urgency) {
      params.push(urgency.toUpperCase());
      queryText += ` AND fd.urgency_level = $${params.length}`;
    }

    queryText += `
      ORDER BY
        CASE fd.urgency_level
          WHEN 'CRITICAL' THEN 1
          WHEN 'HIGH' THEN 2
          WHEN 'NORMAL' THEN 3
          WHEN 'LOW' THEN 4
          ELSE 5
        END ASC,
        fd.created_at DESC
    `;

    const result = await db.query(queryText, params);

    return res.json({
      success: true,
      count: result.rows.length,
      donations: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

// @desc Get donations listed by the logged-in donor
// @route GET /api/donations/my-listings
// @access Private (DONOR, ADMIN)
const getMyDonations = async (req, res, next) => {
  try {
    const donorId = req.user.id;

    const result = await db.query(
      `SELECT
         fd.*,
         (
           SELECT json_build_object(
             'id', vp.id,
             'volunteer_name', vu.name,
             'pickup_status', vp.pickup_status
           )
           FROM volunteer_pickups vp
           JOIN platform_users vu ON vp.volunteer_id = vu.id
           WHERE vp.donation_id = fd.id
           ORDER BY vp.id DESC
           LIMIT 1
         ) AS active_pickup
       FROM food_donations fd
       WHERE fd.donor_id = $1
       ORDER BY fd.created_at DESC`,
      [donorId]
    );

    return res.json({
      success: true,
      count: result.rows.length,
      donations: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

// @desc Get one donation by ID
// @route GET /api/donations/:id
// @access Public or Private
const getDonationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT
         fd.*,
         u.name AS donor_name,
         u.phone AS donor_phone,
         u.email AS donor_email,
         dp.organization_name,
         dp.fssai_license
       FROM food_donations fd
       JOIN platform_users u ON fd.donor_id = u.id
       LEFT JOIN donor_profiles dp ON dp.user_id = u.id
       WHERE fd.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Donation listing not found.',
      });
    }

    return res.json({
      success: true,
      donation: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

// @desc Recommend available food based on receiver preferences
// @route GET /api/donations/recommended
// @access Private (RECEIVER, ADMIN)
const getRecommendedDonations = async (req, res, next) => {
  try {
    const receiverId = req.user.id;

    const receiverResult = await db.query(
      `SELECT
         pu.id,
         rp.capacity_people,
         rp.dietary_preferences
       FROM platform_users pu
       JOIN receiver_profiles rp ON rp.user_id = pu.id
       WHERE pu.id = $1
         AND pu.role = 'RECEIVER'`,
      [receiverId]
    );

    if (receiverResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Receiver profile not found.',
      });
    }

    const receiver = receiverResult.rows[0];
    const capacity = Number(receiver.capacity_people) || 50;
    const preferences = String(
      receiver.dietary_preferences || 'ALL'
    ).trim().toUpperCase();

    const result = await db.query(
      `SELECT
         fd.*,
         pu.name AS donor_name,
         pu.city AS donor_city,
         dp.organization_name
       FROM food_donations fd
       JOIN platform_users pu ON pu.id = fd.donor_id
       LEFT JOIN donor_profiles dp ON dp.user_id = pu.id
       WHERE fd.status = 'AVAILABLE'
         AND fd.expiry_time > CURRENT_TIMESTAMP
         AND (
           $1 = 'ALL'
           OR UPPER(COALESCE(fd.dietary_type, '')) = $1
         )
       ORDER BY
         CASE fd.urgency_level
           WHEN 'CRITICAL' THEN 1
           WHEN 'HIGH' THEN 2
           WHEN 'NORMAL' THEN 3
           WHEN 'LOW' THEN 4
           ELSE 5
         END ASC,
         CASE
           WHEN COALESCE(fd.servings_estimate, 0) <= $2 THEN 0
           ELSE 1
         END ASC,
         fd.expiry_time ASC`,
      [preferences, capacity]
    );

    const recommendations = result.rows.map((donation) => {
      const servings = Number(donation.servings_estimate) || 0;
      let matchReason = 'Available food suitable for review';

      if (servings > 0 && servings <= capacity) {
        matchReason = 'Serving quantity fits receiver capacity';
      } else if (servings > capacity) {
        matchReason = 'Food quantity exceeds receiver capacity';
      }

      return {
        ...donation,
        match_reason: matchReason,
      };
    });

    return res.json({
      success: true,
      count: recommendations.length,
      receiver: {
        capacity_people: capacity,
        dietary_preferences: preferences,
      },
      recommendations,
    });
  } catch (err) {
    next(err);
  }
};

// @desc Cancel a food donation listing
// @route DELETE /api/donations/:id
// @access Private (DONOR, ADMIN)
const deleteDonation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const donorId = req.user.id;

    const findRes = await db.query(
      'SELECT * FROM food_donations WHERE id = $1',
      [id]
    );

    if (findRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found.',
      });
    }

    const item = findRes.rows[0];

    if (
      req.user.role !== 'ADMIN' &&
      String(item.donor_id) !== String(donorId)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this listing.',
      });
    }

    if (item.status === 'PICKED_UP' || item.status === 'DELIVERED') {
      return res.status(400).json({
        success: false,
        message:
          'Cannot cancel donation already picked up or delivered.',
      });
    }

    await db.query('DELETE FROM food_donations WHERE id = $1', [id]);

    return res.json({
      success: true,
      message: 'Donation listing removed successfully.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createDonation,
  getAllDonations,
  getMyDonations,
  getDonationById,
  getRecommendedDonations,
  deleteDonation,
};