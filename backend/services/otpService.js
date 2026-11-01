/**
 * foodBridge-AI: OTP Verification Workflow for Secure Receiver Handoff
 * 
 * Ensures chain-of-custody integrity by requiring receivers to verify a 
 * time-sensitive 6-digit cryptographic OTP before volunteer marks food as delivered.
 */

const crypto = require('crypto');
const db = require('../config/db');
const { calculateMetricsFromKg } = require('./impactAnalyticsService');
const { notifyUser, broadcastDeliveryUpdate } = require('./socketService');

/**
 * Generate a cryptographically secure 6-digit numeric OTP.
 */
function generateSecureOTP() {
  const num = crypto.randomInt(100000, 999999);
  return num.toString();
}

/**
 * Create or refresh OTP for an active delivery.
 * 
 * @param {number} deliveryId 
 * @returns {Promise<Object>} { otpCode, expiresAt }
 */
async function generateDeliveryOTP(deliveryId) {
  const otpCode = generateSecureOTP();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 mins validity

  const result = await db.query(
    `UPDATE food_deliveries 
     SET otp_code = $1, otp_expires_at = $2, otp_verified = false, otp_attempts = 0
     WHERE id = $3
     RETURNING id, donation_id, volunteer_id, receiver_id, otp_code, otp_expires_at`,
    [otpCode, expiresAt, deliveryId]
  );

  if (result.rows.length === 0) {
    throw new Error('Delivery record not found.');
  }

  const delivery = result.rows[0];

  // Notify receiver with the secure OTP
  const notifMsg = `Your food delivery handoff code is ${otpCode}. Provide this to the volunteer when they deliver your food. Valid for 30 minutes.`;
  await db.query(
    `INSERT INTO platform_notifications (user_id, title, message, type, related_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [delivery.receiver_id, '🔐 Delivery Handoff OTP', notifMsg, 'OTP', delivery.id]
  );

  notifyUser(delivery.receiver_id, 'delivery:otp_received', {
    deliveryId: delivery.id,
    otpCode,
    expiresAt,
    message: notifMsg,
  });

  return {
    otpCode,
    expiresAt,
    delivery,
  };
}

/**
 * Verify OTP entered by volunteer during physical handoff.
 * 
 * @param {Object} params
 * @param {number} params.deliveryId
 * @param {string} params.enteredOtp
 * @param {number} params.volunteerId
 * @param {string} [params.receiverFeedback]
 * @param {number} [params.receiverRating]
 * @returns {Promise<Object>} Verification results & updated ESG stats
 */
async function verifyHandoffOTP({
  deliveryId,
  enteredOtp,
  volunteerId,
  receiverFeedback = '',
  receiverRating = 5,
}) {
  const deliveryRes = await db.query(
    `SELECT d.*, fd.id AS food_id, fd.food_name, fd.quantity_kg, fd.quantity_display, fd.donor_id
     FROM food_deliveries d
     JOIN food_donations fd ON d.donation_id = fd.id
     WHERE d.id = $1`,
    [deliveryId]
  );

  if (deliveryRes.rows.length === 0) {
    const error = new Error('Delivery record not found.');
    error.statusCode = 404;
    throw error;
  }

  const delivery = deliveryRes.rows[0];

  if (delivery.volunteer_id !== volunteerId) {
    const error = new Error('Unauthorized: Only the assigned volunteer can verify handoff for this delivery.');
    error.statusCode = 403;
    throw error;
  }

  if (delivery.status === 'DELIVERED') {
    const error = new Error('This delivery has already been verified and completed.');
    error.statusCode = 409;
    throw error;
  }

  if (delivery.otp_attempts >= 5) {
    const error = new Error('Maximum OTP verification attempts exceeded. Please request a new OTP from the receiver.');
    error.statusCode = 429;
    throw error;
  }

  if (new Date() > new Date(delivery.otp_expires_at)) {
    const error = new Error('Handoff OTP has expired. Please request receiver to generate a new OTP.');
    error.statusCode = 410;
    throw error;
  }

  // Validate OTP code
  if (delivery.otp_code !== enteredOtp.trim()) {
    await db.query(
      `UPDATE food_deliveries SET otp_attempts = otp_attempts + 1 WHERE id = $1`,
      [deliveryId]
    );
    const remaining = 5 - (delivery.otp_attempts + 1);
    const error = new Error(`Invalid OTP code. Attempts remaining: ${remaining}.`);
    error.statusCode = 400;
    throw error;
  }

  // OTP is verified! Execute atomic transaction to update states & ESG metrics
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const foodKg = parseFloat(delivery.quantity_kg) || 1;
    const impact = calculateMetricsFromKg(foodKg);

    // 1. Update delivery status
    await client.query(
      `UPDATE food_deliveries
       SET status = 'DELIVERED',
           otp_verified = true,
           delivered_at = CURRENT_TIMESTAMP,
           co2_saved_kg = $1,
           water_saved_liters = $2,
           receiver_feedback = $3,
           receiver_rating = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [impact.co2OffsetKg, impact.waterSavedLiters, receiverFeedback, receiverRating, deliveryId]
    );

    // 2. Update food donation status
    await client.query(
      `UPDATE food_donations
       SET status = 'DELIVERED', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [delivery.food_id]
    );

    // 3. Update volunteer profile stats & badges
    const volProfRes = await client.query(
      `SELECT deliveries_completed FROM volunteer_profiles WHERE user_id = $1`,
      [delivery.volunteer_id]
    );
    const completedCount = (volProfRes.rows[0]?.deliveries_completed || 0) + 1;
    let badge = 'BRONZE';
    if (completedCount >= 30) badge = 'PLATINUM';
    else if (completedCount >= 15) badge = 'GOLD';
    else if (completedCount >= 5) badge = 'SILVER';

    await client.query(
      `UPDATE volunteer_profiles
       SET deliveries_completed = $1,
           badge_level = $2,
           volunteer_hours = volunteer_hours + 1.5,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $3`,
      [completedCount, badge, delivery.volunteer_id]
    );

    // 4. Update donor profile stats
    await client.query(
      `UPDATE donor_profiles
       SET total_donations_count = total_donations_count + 1,
           total_kg_donated = total_kg_donated + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2`,
      [foodKg, delivery.donor_id]
    );

    // 5. Update receiver profile stats
    await client.query(
      `UPDATE receiver_profiles
       SET total_meals_received = total_meals_received + $1,
           total_kg_received = total_kg_received + $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $3`,
      [impact.mealsServed, foodKg, delivery.receiver_id]
    );

    // 6. Create platform notifications for all three stakeholders
    const notifs = [
      {
        userId: delivery.volunteer_id,
        title: '🎉 Rescue Delivery Completed!',
        msg: `Successfully delivered ${delivery.food_name}! You served ~${impact.mealsServed} meals and offset ${impact.co2OffsetKg} kg CO₂. Badge: ${badge}!`,
        type: 'ESG',
      },
      {
        userId: delivery.receiver_id,
        title: '🍲 Food Received Safely',
        msg: `Your community received ${delivery.quantity_display} of ${delivery.food_name}. Enjoy nutritious meals!`,
        type: 'DELIVERY',
      },
      {
        userId: delivery.donor_id,
        title: '💚 Food Donation Successfully Rescued!',
        msg: `Your donation of ${delivery.food_name} reached families in need! Rescued ${foodKg} kg (${impact.mealsServed} meals).`,
        type: 'ESG',
      },
    ];

    for (const n of notifs) {
      await client.query(
        `INSERT INTO platform_notifications (user_id, title, message, type, related_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [n.userId, n.title, n.msg, n.type, deliveryId]
      );
    }

    await client.query('COMMIT');

    // Real-time broadcast
    broadcastDeliveryUpdate({
      deliveryId,
      status: 'DELIVERED',
      foodName: delivery.food_name,
      impact,
      volunteerId: delivery.volunteer_id,
      receiverId: delivery.receiver_id,
      donorId: delivery.donor_id,
    });

    for (const n of notifs) {
      notifyUser(n.userId, 'notification:new', {
        title: n.title,
        message: n.msg,
        type: n.type,
      });
    }

    return {
      success: true,
      deliveryId,
      status: 'DELIVERED',
      impact,
      badgeAwarded: badge,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  generateSecureOTP,
  generateDeliveryOTP,
  verifyHandoffOTP,
};

