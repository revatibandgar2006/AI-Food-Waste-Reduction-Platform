const db = require('../config/db');
const { getPlatformESGMetrics, getUserESGMetrics } = require('../services/impactAnalyticsService');
const { predictFoodFreshness } = require('../services/aiFreshnessService');

// @desc    Get global platform ESG impact indicators
// @route   GET /api/analytics/platform
// @access  Public
const getPlatformMetrics = async (req, res, next) => {
  try {
    const metrics = await getPlatformESGMetrics();
    res.json({
      success: true,
      data: metrics,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user-specific ESG impact indicators
// @route   GET /api/analytics/user
// @access  Private
const getUserMetrics = async (req, res, next) => {
  try {
    const metrics = await getUserESGMetrics(req.user.id, req.user.role);
    res.json({
      success: true,
      data: metrics,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    AI Freshness & Shelf-Life prediction simulation endpoint
// @route   POST /api/analytics/predict-freshness
// @access  Public or Private
const predictFreshnessPreview = async (req, res, next) => {
  try {
    const { foodType, cookedAt, storageType, quantityKg, ambientTempC } = req.body;
    const prediction = predictFoodFreshness({
      foodType,
      cookedAt,
      storageType,
      quantityKg,
      ambientTempC,
    });

    res.json({
      success: true,
      prediction,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get PostgreSQL database table counts & system health
// @route   GET /api/analytics/system
// @access  Public
const getSystemHealthAndStats = async (req, res, next) => {
  try {
    const usersCount = await db.query('SELECT COUNT(*) FROM platform_users');
    const donorsCount = await db.query('SELECT COUNT(*) FROM donor_profiles');
    const volunteersCount = await db.query('SELECT COUNT(*) FROM volunteer_profiles');
    const receiversCount = await db.query('SELECT COUNT(*) FROM receiver_profiles');
    const donationsCount = await db.query('SELECT COUNT(*) FROM food_donations');
    const pickupsCount = await db.query('SELECT COUNT(*) FROM volunteer_pickups');
    const deliveriesCount = await db.query('SELECT COUNT(*) FROM food_deliveries');
    const notifsCount = await db.query('SELECT COUNT(*) FROM platform_notifications');
    let contactCountVal = 0;
    try {
      const contactCount = await db.query('SELECT COUNT(*) FROM contact_messages');
      contactCountVal = parseInt(contactCount.rows[0].count, 10);
    } catch {
      contactCountVal = 0;
    }

    res.json({
      success: true,
      tables: {
        platform_users: parseInt(usersCount.rows[0].count, 10),
        donor_profiles: parseInt(donorsCount.rows[0].count, 10),
        volunteer_profiles: parseInt(volunteersCount.rows[0].count, 10),
        receiver_profiles: parseInt(receiversCount.rows[0].count, 10),
        food_donations: parseInt(donationsCount.rows[0].count, 10),
        volunteer_pickups: parseInt(pickupsCount.rows[0].count, 10),
        food_deliveries: parseInt(deliveriesCount.rows[0].count, 10),
        platform_notifications: parseInt(notifsCount.rows[0].count, 10),
        contact_messages: contactCountVal,
      },
      system: {
        uptime: Math.round(process.uptime()),
        nodeVersion: process.version,
        database: 'PostgreSQL 16 (foodbridge_db)',
        status: 'OPERATIONAL_EXCELLENCE',
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPlatformMetrics,
  getUserMetrics,
  predictFreshnessPreview,
  getSystemHealthAndStats,
};


