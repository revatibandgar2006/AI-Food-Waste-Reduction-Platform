const express = require('express');
const router = express.Router();
const {
  getPlatformMetrics,
  getUserMetrics,
  predictFreshnessPreview,
  getSystemHealthAndStats,
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/platform', getPlatformMetrics);
router.get('/user', protect, getUserMetrics);
router.post('/predict-freshness', predictFreshnessPreview);
router.get('/system', protect, authorize('ADMIN'), getSystemHealthAndStats);

module.exports = router;

