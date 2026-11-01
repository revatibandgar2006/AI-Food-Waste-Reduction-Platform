const db = require('../config/db');
const { generateDeliveryOTP, verifyHandoffOTP } = require('../services/otpService');
const { notifyUser, broadcastPickupUpdate } = require('../services/socketService');

// @desc    Get all available pickups for volunteers
// @route   GET /api/volunteers/available-pickups
// @access  Private (VOLUNTEER, ADMIN)
const getAvailablePickups = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT fd.*, u.name AS donor_name, u.phone AS donor_phone, u.address AS donor_address,
          dp.organization_name, ru.name AS requested_by_name
       FROM food_donations fd
       JOIN platform_users u ON fd.donor_id = u.id
       LEFT JOIN donor_profiles dp ON dp.user_id = u.id
        LEFT JOIN platform_users ru ON ru.id = fd.requested_by
       WHERE fd.status IN ('AVAILABLE', 'REQUESTED')
       ORDER BY 
         CASE fd.urgency_level 
           WHEN 'CRITICAL' THEN 1 
           WHEN 'HIGH' THEN 2 
           WHEN 'NORMAL' THEN 3 
           ELSE 4 
         END,
         fd.created_at DESC`
    );

    res.json({
      success: true,
      count: result.rows.length,
      pickups: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Claim / Accept a food donation pickup
// @route   POST /api/volunteers/claim-pickup/:donationId
// @access  Private (VOLUNTEER)
const claimPickup = async (req, res, next) => {
  try {
    const { donationId } = req.params;
    const volunteerId = req.user.id;
    const { receiverId, deliveryAddress } = req.body;

    // Check donation availability
    const donationRes = await db.query(
      'SELECT * FROM food_donations WHERE id = $1',
      [donationId]
    );

    if (donationRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Donation not found.' });
    }

    const donation = donationRes.rows[0];
    if (donation.status !== 'AVAILABLE' && donation.status !== 'REQUESTED') {
      return res.status(400).json({
        success: false,
        message: `This donation is already ${donation.status.toLowerCase()}.`,
      });
    }

    // Select or default a receiver if not specified
    let targetReceiverId = receiverId || donation.requested_by;
    let targetAddress = deliveryAddress;

    if (donation.requested_by && receiverId && Number(receiverId) !== donation.requested_by) {
      return res.status(400).json({ success: false, message: 'This donation was requested by a different receiver.' });
    }

    if (!targetReceiverId) {
      // Find an active receiver/shelter in system
      const recRes = await db.query(
        `SELECT id, address FROM platform_users WHERE role = 'RECEIVER' ORDER BY id ASC LIMIT 1`
      );
      if (recRes.rows.length > 0) {
        targetReceiverId = recRes.rows[0].id;
        targetAddress = targetAddress || recRes.rows[0].address || 'Community Shelter, Camp Road';
      } else {
        return res.status(409).json({ success: false, message: 'No receiver is registered for this delivery.' });
      }
    }

    const receiverRes = await db.query(
      `SELECT id, address FROM platform_users WHERE id = $1 AND role = 'RECEIVER'`,
      [targetReceiverId]
    );
    if (receiverRes.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Select a valid registered receiver.' });
    }
    targetAddress = targetAddress || receiverRes.rows[0].address || 'Community Shelter';

    // 1. Mark donation as ASSIGNED
    const assignedRes = await db.query(
      `UPDATE food_donations SET status = 'ASSIGNED', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status IN ('AVAILABLE', 'REQUESTED')
       RETURNING id`,
      [donationId]
    );
    if (assignedRes.rows.length === 0) {
      return res.status(409).json({ success: false, message: 'Another volunteer has already accepted this donation.' });
    }

    // 2. Insert volunteer pickup record
    const pickupRes = await db.query(
      `INSERT INTO volunteer_pickups (donation_id, volunteer_id, pickup_status)
       VALUES ($1, $2, 'ACCEPTED')
       RETURNING *`,
      [donationId, volunteerId]
    );

    // 3. Create delivery record with initial secure OTP
    const crypto = require('crypto');
    const initialOtp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

    const deliveryRes = await db.query(
      `INSERT INTO food_deliveries (
        donation_id, volunteer_id, receiver_id, delivery_address,
        otp_code, otp_expires_at, estimated_delivery_at, status
             ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP + INTERVAL '45 minutes', 'DISPATCHED')
       RETURNING *`,
      [donationId, volunteerId, targetReceiverId, targetAddress, initialOtp, otpExpiry]
    );

    const delivery = deliveryRes.rows[0];

    // 4. Notify donor that volunteer claimed pickup
    await db.query(
      `INSERT INTO platform_notifications (user_id, title, message, type, related_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        donation.donor_id,
        '🚚 Volunteer Assigned for Pickup',
        `Volunteer ${req.user.name} has accepted pickup for ${donation.food_name}.`,
        'PICKUP',
        donationId,
      ]
    );

    // 5. Notify receiver with secure OTP
    await db.query(
      `INSERT INTO platform_notifications (user_id, title, message, type, related_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        targetReceiverId,
        '🔐 Incoming Food Delivery & Handoff OTP',
        `Volunteer ${req.user.name} is on the way with ${donation.quantity_display} of ${donation.food_name}. Your secure handoff code is: ${initialOtp}`,
        'OTP',
        delivery.id,
      ]
    );

    // Broadcast live event
    broadcastPickupUpdate({
      donationId,
      volunteerId,
      volunteerName: req.user.name,
      status: 'ASSIGNED',
    });

    notifyUser(donation.donor_id, 'pickup:assigned', {
      donationId,
      volunteerName: req.user.name,
      phone: req.user.phone,
    });

    notifyUser(targetReceiverId, 'delivery:dispatched', {
      deliveryId: delivery.id,
      foodName: donation.food_name,
      otpCode: initialOtp,
    });

    const { otp_code, ...volunteerDelivery } = delivery;

    res.status(201).json({
      success: true,
      message: 'Pickup accepted successfully! Destination delivery task generated.',
      pickup: pickupRes.rows[0],
      delivery: volunteerDelivery,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update pickup status (IN_TRANSIT, PICKED_UP)
// @route   PUT /api/volunteers/pickups/:id/status
// @access  Private (VOLUNTEER)
const updatePickupStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const volunteerId = req.user.id;

    const pickupRes = await db.query(
      'SELECT * FROM volunteer_pickups WHERE id = $1 AND volunteer_id = $2',
      [id, volunteerId]
    );

    if (pickupRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pickup record not found.' });
    }

    const pickup = pickupRes.rows[0];
    const newStatus = status.toUpperCase();

    await db.query(
      `UPDATE volunteer_pickups
       SET pickup_status = $1,
           actual_pickup_time = CASE WHEN $1 = 'PICKED_UP' THEN CURRENT_TIMESTAMP ELSE actual_pickup_time END,
           pickup_notes = COALESCE($2, pickup_notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [newStatus, notes || null, id]
    );

    if (newStatus === 'PICKED_UP') {
      await db.query(
        `UPDATE food_donations SET status = 'PICKED_UP', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [pickup.donation_id]
      );
      await db.query(
        `UPDATE food_deliveries SET status = 'IN_TRANSIT', updated_at = CURRENT_TIMESTAMP WHERE donation_id = $1`,
        [pickup.donation_id]
      );
    }

    res.json({
      success: true,
      message: `Pickup status updated to ${newStatus}.`,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all active/completed pickups for the logged-in volunteer
// @route   GET /api/volunteers/my-pickups
// @access  Private (VOLUNTEER)
const getMyPickups = async (req, res, next) => {
  try {
    const volunteerId = req.user.id;
    const result = await db.query(
      `SELECT vp.*, fd.food_name, fd.food_type, fd.quantity_display, fd.pickup_location,
              fd.urgency_level, fd.freshness_score, u.name AS donor_name, u.phone AS donor_phone
       FROM volunteer_pickups vp
       JOIN food_donations fd ON vp.donation_id = fd.id
       JOIN platform_users u ON fd.donor_id = u.id
       WHERE vp.volunteer_id = $1
       ORDER BY vp.created_at DESC`,
      [volunteerId]
    );

    res.json({
      success: true,
      count: result.rows.length,
      pickups: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all active/completed deliveries for the logged-in volunteer
// @route   GET /api/volunteers/my-deliveries
// @access  Private (VOLUNTEER)
const getMyDeliveries = async (req, res, next) => {
  try {
    const volunteerId = req.user.id;
    const result = await db.query(
      `SELECT fdel.*, fd.food_name, fd.food_type, fd.quantity_display,
              rec.name AS receiver_name, rec.phone AS receiver_phone, rec.address AS receiver_address,
              rp.organization_name AS receiver_org
       FROM food_deliveries fdel
       JOIN food_donations fd ON fdel.donation_id = fd.id
       JOIN platform_users rec ON fdel.receiver_id = rec.id
       LEFT JOIN receiver_profiles rp ON rp.user_id = rec.id
       WHERE fdel.volunteer_id = $1
       ORDER BY fdel.created_at DESC`,
      [volunteerId]
    );

    res.json({
      success: true,
      count: result.rows.length,
      deliveries: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify receiver OTP to complete delivery handoff
// @route   POST /api/volunteers/verify-otp
// @access  Private (VOLUNTEER)
const verifyDeliveryHandoff = async (req, res, next) => {
  try {
    const { deliveryId, otpCode, feedback, rating } = req.body;
    const volunteerId = req.user.id;

    if (!deliveryId || !otpCode) {
      return res.status(400).json({
        success: false,
        message: 'Delivery ID and 6-digit OTP code are required.',
      });
    }

    const outcome = await verifyHandoffOTP({
      deliveryId: parseInt(deliveryId, 10),
      enteredOtp: otpCode.toString().trim(),
      volunteerId,
      receiverFeedback: feedback,
      receiverRating: rating || 5,
    });

    res.json({
      success: true,
      message: '✅ OTP successfully verified! Delivery finalized & ESG impact recorded.',
      data: outcome,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get volunteer performance statistics & badges
// @route   GET /api/volunteers/stats
// @access  Private (VOLUNTEER)
const getVolunteerStats = async (req, res, next) => {
  try {
    const volunteerId = req.user.id;
    const profileRes = await db.query(
      'SELECT * FROM volunteer_profiles WHERE user_id = $1',
      [volunteerId]
    );

    const countsRes = await db.query(
      `SELECT
         COUNT(CASE WHEN vp.pickup_status = 'ACCEPTED' THEN 1 END) AS pending_pickups,
         COUNT(CASE WHEN fdel.status = 'DELIVERED' THEN 1 END) AS completed_deliveries,
         COALESCE(SUM(fdel.co2_saved_kg), 0) AS total_co2_offset,
         COALESCE(SUM(fdel.water_saved_liters), 0) AS total_water_saved
       FROM volunteer_profiles vp_prof
       LEFT JOIN volunteer_pickups vp ON vp.volunteer_id = vp_prof.user_id
       LEFT JOIN food_deliveries fdel ON fdel.volunteer_id = vp_prof.user_id AND fdel.status = 'DELIVERED'
       WHERE vp_prof.user_id = $1
       GROUP BY vp_prof.id`,
      [volunteerId]
    );

    const profile = profileRes.rows[0] || {};
    const stats = countsRes.rows[0] || {};

    res.json({
      success: true,
      profile,
      stats: {
        deliveriesCompleted: profile.deliveries_completed || 0,
        badgeLevel: profile.badge_level || 'BRONZE',
        rating: profile.rating || 5.0,
        volunteerHours: profile.volunteer_hours || 0,
        pendingPickups: parseInt(stats.pending_pickups, 10) || 0,
        co2OffsetKg: parseFloat(stats.total_co2_offset) || 0,
        waterSavedLiters: parseFloat(stats.total_water_saved) || 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAvailablePickups,
  claimPickup,
  updatePickupStatus,
  getMyPickups,
  getMyDeliveries,
  verifyDeliveryHandoff,
  getVolunteerStats,
};

