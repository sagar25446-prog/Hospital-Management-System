const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');
const { asyncHandler } = require('../../utils/asyncHandler');
const { authMiddleware } = require('../../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/intent', asyncHandler(paymentController.createIntent));
router.post('/process', asyncHandler(paymentController.processPayment));

module.exports = router;
