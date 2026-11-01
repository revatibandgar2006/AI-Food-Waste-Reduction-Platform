const db = require('../config/db');
const { notifyUser } = require('../services/socketService');

// @desc    Get all available food listings for receivers
// @route   GET /api/receivers/browse-food
// @access  Private (RECEIVER, ADMIN)
const browseAvailableFood = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT fd.*, u.name AS donor_name, u.phone AS donor_phone, dp.organization_name
       FROM food_donations fd
       JOIN platform_users u ON fd.donor_id = u.id
       LEFT JOIN donor_profiles dp ON dp.user_id = u.id
       WHERE fd.status = 'AVAILABLE'
       ORDER BY fd.urgency_level DESC, fd.created_at DESC`
    );

    res.json({
      success: true,
      count: result.rows.length,
      donations: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Request an available food donation
// @route   POST /api/receivers/request-food/:donationId
// @access  Private (RECEIVER)
const requestFoodDonation = async (req, res, next) => {
  try {
    const { donationId } = req.params;
    const receiverId = req.user.id;
    const { neededPeopleCount, notes } = req.body;

    const donRes = await db.query(
      'SELECT * FROM food_donations WHERE id = $1',
      [donationId]
    );

    if (donRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Donation listing not found.' });
    }

    const donation = donRes.rows[0];
    if (donation.status !== 'AVAILABLE') {
      return res.status(400).json({
        success: false,
        message: `This donation is no longer available (current status: ${donation.status}).`,
      });
    }

    const requestRes = await db.query(
      `UPDATE food_donations
       SET status = 'REQUESTED', requested_by = $1, requested_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND status = 'AVAILABLE'
       RETURNING id`,
      [receiverId, donationId]
    );

    if (requestRes.rows.length === 0) {
      return res.status(409).json({ success: false, message: 'This donation has just been requested by someone else.' });
    }

    // Notify donor
    const notifMsg = `${req.user.name} has requested your donation of ${donation.food_name}. Looking for a nearby volunteer to dispatch!`;
    await db.query(
      `INSERT INTO platform_notifications (user_id, title, message, type, related_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [donation.donor_id, '📥 Donation Requested by Shelter', notifMsg, 'DONATION', donationId]
    );

    notifyUser(donation.donor_id, 'donation:requested', {
      donationId,
      receiverName: req.user.name,
      foodName: donation.food_name,
    });

    res.json({
      success: true,
      message: `Successfully requested ${donation.food_name}! A volunteer will be dispatched for pickup.`,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get active requests and inbound deliveries for receiver
// @route   GET /api/receivers/my-requests
// @access  Private (RECEIVER)
const getMyRequests = async (req, res, next) => {
  try {
    const receiverId = req.user.id;

    // Include requests immediately, before a volunteer has accepted them.
    const result = await db.query(
      `SELECT fd.id, fd.id AS donation_id, fdel.id AS delivery_id,
              fd.food_name, fd.quantity_display, fd.quantity_kg, fd.food_type,
              fd.pickup_location, fd.status AS donation_status,
              COALESCE(fdel.status, fd.status) AS status,
              fd.requested_at, fdel.created_at AS accepted_at,
              fdel.estimated_delivery_at, vp.pickup_scheduled_time,
              fdel.otp_expires_at, fdel.otp_code,
              vu.name AS volunteer_name, vu.phone AS volunteer_phone,
              du.name AS donor_name, du.phone AS donor_phone,
              dp.organization_name AS donor_organization
       FROM food_donations fd
       JOIN platform_users du ON fd.donor_id = du.id
       LEFT JOIN donor_profiles dp ON dp.user_id = du.id
       LEFT JOIN food_deliveries fdel ON fdel.donation_id = fd.id AND fdel.receiver_id = $1
       LEFT JOIN platform_users vu ON vu.id = fdel.volunteer_id
       LEFT JOIN volunteer_pickups vp ON vp.donation_id = fd.id AND vp.volunteer_id = fdel.volunteer_id
       WHERE fd.requested_by = $1 AND (fdel.id IS NULL OR fdel.status != 'DELIVERED')
       ORDER BY COALESCE(fdel.created_at, fd.requested_at, fd.created_at) DESC`,
      [receiverId]
    );

    res.json({
      success: true,
      count: result.rows.length,
      requests: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get historical completed deliveries received
// @route   GET /api/receivers/history
// @access  Private (RECEIVER)
const getReceiverHistory = async (req, res, next) => {
  try {
    const receiverId = req.user.id;

    const result = await db.query(
      `SELECT fdel.*, fd.food_name, fd.quantity_display, fd.quantity_kg, fd.food_type,
              vu.name AS volunteer_name, du.name AS donor_name
       FROM food_deliveries fdel
       JOIN food_donations fd ON fdel.donation_id = fd.id
       JOIN platform_users vu ON fdel.volunteer_id = vu.id
       JOIN platform_users du ON fd.donor_id = du.id
       WHERE fdel.receiver_id = $1 AND fdel.status = 'DELIVERED'
       ORDER BY fdel.delivered_at DESC`,
      [receiverId]
    );

    res.json({
      success: true,
      count: result.rows.length,
      history: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get secret OTP for receiver handoff
// @route   GET /api/receivers/delivery-otp/:deliveryId
// @access  Private (RECEIVER)
const getDeliveryOTP = async (req, res, next) => {
  try {
    const { deliveryId } = req.params;
    const receiverId = req.user.id;

    const result = await db.query(
      `SELECT id, otp_code, otp_expires_at, status
       FROM food_deliveries
       WHERE id = $1 AND receiver_id = $2`,
      [deliveryId, receiverId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Delivery record not found.' });
    }

    res.json({
      success: true,
      otpCode: result.rows[0].otp_code,
      expiresAt: result.rows[0].otp_expires_at,
      status: result.rows[0].status,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  browseAvailableFood,
  requestFoodDonation,
  getMyRequests,
  getReceiverHistory,
  getDeliveryOTP,
};

