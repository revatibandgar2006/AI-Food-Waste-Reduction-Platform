const express = require('express');
const router = express.Router();
const { submitContactMessage, getAllContactMessages } = require('../controllers/contactController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', submitContactMessage);
router.get('/', protect, authorize('ADMIN'), getAllContactMessages);

module.exports = router;
