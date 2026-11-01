const express = require('express');
const router = express.Router();
const {
  getAvailablePickups,
  claimPickup,
  updatePickupStatus,
  getMyPickups,
  getMyDeliveries,
  verifyDeliveryHandoff,
  getVolunteerStats,
} = require('../controllers/volunteerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect); // All volunteer routes require authentication

router.get('/available-pickups', authorize('VOLUNTEER', 'ADMIN'), getAvailablePickups);
router.post('/claim-pickup/:donationId', authorize('VOLUNTEER', 'ADMIN'), claimPickup);
router.put('/pickups/:id/status', authorize('VOLUNTEER', 'ADMIN'), updatePickupStatus);
router.get('/my-pickups', authorize('VOLUNTEER', 'ADMIN'), getMyPickups);
router.get('/my-deliveries', authorize('VOLUNTEER', 'ADMIN'), getMyDeliveries);
router.post('/verify-otp', authorize('VOLUNTEER', 'ADMIN'), verifyDeliveryHandoff);
router.get('/stats', authorize('VOLUNTEER', 'ADMIN'), getVolunteerStats);

module.exports = router;

