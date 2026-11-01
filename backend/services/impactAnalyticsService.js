/**
 * foodBridge-AI: ESG Impact Analytics Calculation Engine
 * 
 * Implements internationally recognized EPA WARM and FAO carbon/water mitigation standards.
 * Converts rescued food weight (kg) into validated Environmental, Social & Governance (ESG) indices.
 */

const db = require('../config/db');

// Conversion factors per kg of food rescued
const ESG_FACTORS = {
  MEALS_PER_KG: 2.5,          // Average 400g per balanced meal
  CO2_OFFSET_PER_KG: 2.5,     // 2.5 kg CO2e avoided from landfill anaerobic decomposition
  WATER_LITERS_PER_KG: 1000,  // Embedded agricultural virtual water saved
  METHANE_KG_PER_KG: 0.25,    // Methane (CH4) gas formation avoided
  ECONOMIC_VALUE_PER_KG: 120, // Estimated value saved (INR ₹120 / ~$1.45 per kg)
};

/**
 * Calculate ESG impact metrics from weight in kilograms.
 * @param {number} kgRescued 
 * @returns {Object} ESG impact indicators
 */
function calculateMetricsFromKg(kgRescued) {
  const kg = Math.max(0, parseFloat(kgRescued) || 0);
  return {
    foodSavedKg: Math.round(kg * 10) / 10,
    mealsServed: Math.round(kg * ESG_FACTORS.MEALS_PER_KG),
    co2OffsetKg: Math.round(kg * ESG_FACTORS.CO2_OFFSET_PER_KG * 10) / 10,
    waterSavedLiters: Math.round(kg * ESG_FACTORS.WATER_LITERS_PER_KG),
    methaneAvoidedKg: Math.round(kg * ESG_FACTORS.METHANE_KG_PER_KG * 10) / 10,
    economicValueSavedInr: Math.round(kg * ESG_FACTORS.ECONOMIC_VALUE_PER_KG),
  };
}

/**
 * Fetch platform-wide aggregate ESG impact data.
 */
async function getPlatformESGMetrics() {
  const query = `
    SELECT
      COALESCE(SUM(CASE WHEN fd.status = 'DELIVERED' THEN fd.quantity_kg ELSE 0 END), 0) AS total_delivered_kg,
      COALESCE(SUM(fd.quantity_kg), 0) AS total_listed_kg,
      COUNT(DISTINCT CASE WHEN fd.status = 'DELIVERED' THEN fd.id END) AS completed_rescues,
      COUNT(DISTINCT fd.id) AS total_donations_count,
      COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'DONOR') AS total_donors,
      COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'VOLUNTEER') AS total_volunteers,
      COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'RECEIVER') AS total_receivers
    FROM food_donations fd
    FULL OUTER JOIN platform_users u ON true
  `;

  // Use separate concise aggregations for maximum reliability
  const [kgRes, userRes] = await Promise.all([
    db.query(`
      SELECT
        COALESCE(SUM(CASE WHEN status = 'DELIVERED' THEN quantity_kg ELSE 0 END), 0) AS delivered_kg,
        COALESCE(SUM(quantity_kg), 0) AS total_kg,
        COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) AS completed_rescues,
        COUNT(*) AS total_donations
      FROM food_donations
    `),
    db.query(`
      SELECT
        COUNT(CASE WHEN role = 'DONOR' THEN 1 END) AS donor_count,
        COUNT(CASE WHEN role = 'VOLUNTEER' THEN 1 END) AS volunteer_count,
        COUNT(CASE WHEN role = 'RECEIVER' THEN 1 END) AS receiver_count,
        COUNT(*) AS total_users
      FROM platform_users
    `),
  ]);

  const deliveredKg = parseFloat(kgRes.rows[0].delivered_kg) || 0;
  const metrics = calculateMetricsFromKg(deliveredKg);

  return {
    ...metrics,
    totalListedKg: Math.round(parseFloat(kgRes.rows[0].total_kg) || 0),
    completedRescues: parseInt(kgRes.rows[0].completed_rescues, 10) || 0,
    totalDonations: parseInt(kgRes.rows[0].total_donations, 10) || 0,
    activeDonors: parseInt(userRes.rows[0].donor_count, 10) || 0,
    activeVolunteers: parseInt(userRes.rows[0].volunteer_count, 10) || 0,
    partnerShelters: parseInt(userRes.rows[0].receiver_count, 10) || 0,
    totalCommunityMembers: parseInt(userRes.rows[0].total_users, 10) || 0,
  };
}

/**
 * Fetch personalized ESG impact metrics for a specific user.
 * @param {number} userId 
 * @param {string} role 
 */
async function getUserESGMetrics(userId, role) {
  let deliveredKg = 0;
  let totalTasks = 0;

  if (role === 'DONOR') {
    const res = await db.query(
      `SELECT 
         COALESCE(SUM(CASE WHEN status = 'DELIVERED' THEN quantity_kg ELSE 0 END), 0) AS delivered_kg,
         COUNT(*) AS total_donations
       FROM food_donations WHERE donor_id = $1`,
      [userId]
    );
    deliveredKg = parseFloat(res.rows[0].delivered_kg) || 0;
    totalTasks = parseInt(res.rows[0].total_donations, 10) || 0;
  } else if (role === 'VOLUNTEER') {
    const res = await db.query(
      `SELECT 
         COALESCE(SUM(fd.quantity_kg), 0) AS delivered_kg,
         COUNT(fdel.id) AS total_deliveries
       FROM food_deliveries fdel
       JOIN food_donations fd ON fdel.donation_id = fd.id
       WHERE fdel.volunteer_id = $1 AND fdel.status = 'DELIVERED'`,
      [userId]
    );
    deliveredKg = parseFloat(res.rows[0].delivered_kg) || 0;
    totalTasks = parseInt(res.rows[0].total_deliveries, 10) || 0;
  } else if (role === 'RECEIVER') {
    const res = await db.query(
      `SELECT 
         COALESCE(SUM(fd.quantity_kg), 0) AS delivered_kg,
         COUNT(fdel.id) AS total_received
       FROM food_deliveries fdel
       JOIN food_donations fd ON fdel.donation_id = fd.id
       WHERE fdel.receiver_id = $1 AND fdel.status = 'DELIVERED'`,
      [userId]
    );
    deliveredKg = parseFloat(res.rows[0].delivered_kg) || 0;
    totalTasks = parseInt(res.rows[0].total_received, 10) || 0;
  }

  const impact = calculateMetricsFromKg(deliveredKg);
  return {
    ...impact,
    totalTasksCompleted: totalTasks,
    role,
  };
}

module.exports = {
  calculateMetricsFromKg,
  getPlatformESGMetrics,
  getUserESGMetrics,
  ESG_FACTORS,
};

