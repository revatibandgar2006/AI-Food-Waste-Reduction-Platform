
const express = require('express');
const router = express.Router();

const {
  createDonation,
  getAllDonations,
  getMyDonations,
  getDonationById,
  getRecommendedDonations,
  deleteDonation,
} = require('../controllers/donationController');

const { protect, authorize } = require('../middleware/authMiddleware');

// Get all food donations
router.get('/', getAllDonations);

// Get recommended food for receiver
// Keep this route before /:id
router.get(
  '/recommended',
  protect,
  authorize('RECEIVER', 'ADMIN'),
  getRecommendedDonations
);

// Get donations listed by the logged-in donor
router.get(
  '/my-listings',
  protect,
  authorize('DONOR', 'ADMIN'),
  getMyDonations
);

// Get a single donation by ID
router.get('/:id', getDonationById);

// Create a food donation
router.post(
  '/',
  protect,
  authorize('DONOR', 'ADMIN'),
  createDonation
);

// Delete a food donation
router.delete(
  '/:id',
  protect,
  authorize('DONOR', 'ADMIN'),
  deleteDonation
);

module.exports = router;
