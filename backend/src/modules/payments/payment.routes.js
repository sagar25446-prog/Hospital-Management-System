const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');
const { asyncHandler } = require('../../utils/asyncHandler');
const { authMiddleware } = require('../../middleware/authMiddleware');

// Razorpay-to-server webhook: NOT authenticated with our JWT (Razorpay has no
// user session) — authenticity comes from the HMAC signature check instead.
// Must be registered before the `router.use(authMiddleware)` below.
router.post('/webhook', asyncHandler(paymentController.webhook));

router.use(authMiddleware);

router.post('/create-order', asyncHandler(paymentController.createOrder));
router.post('/verify', asyncHandler(paymentController.verifyPayment));

module.exports = router;
