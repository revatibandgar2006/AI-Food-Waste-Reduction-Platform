const express = require('express');
const router = express.Router();
const {
  browseAvailableFood,
  requestFoodDonation,
  getMyRequests,
  getReceiverHistory,
  getDeliveryOTP,
} = require('../controllers/receiverController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect); // All receiver routes require authentication

router.get('/browse-food', authorize('RECEIVER', 'ADMIN'), browseAvailableFood);
router.post('/request-food/:donationId', authorize('RECEIVER', 'ADMIN'), requestFoodDonation);
router.get('/my-requests', authorize('RECEIVER', 'ADMIN'), getMyRequests);
router.get('/history', authorize('RECEIVER', 'ADMIN'), getReceiverHistory);
router.get('/delivery-otp/:deliveryId', authorize('RECEIVER', 'ADMIN'), getDeliveryOTP);

module.exports = router;

