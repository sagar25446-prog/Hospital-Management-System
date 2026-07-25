const paymentService = require('./payment.service');
const queueService = require('../queue/queue.service');
const { pool } = require('../../config/database');

async function createOrder(req, res, next) {
  try {
    const { appointmentId } = req.body;
    if (!appointmentId) return res.status(400).json({ message: 'appointmentId is required' });

    // Ownership check: a patient can only pay for their own appointment.
    if (req.user.role === 'patient') {
      const owns = await queueService.getPatientIdByUserId(req.user.id);
      const apptCheck = await pool.query(
        'SELECT patient_id FROM appointments WHERE id = $1',
        [appointmentId]
      );
      if (apptCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      if (apptCheck.rows[0].patient_id !== owns) {
        return res.status(403).json({ message: 'This appointment does not belong to you' });
      }
    }

    const order = await paymentService.createOrder(appointmentId);
    res.json(order);
  } catch (err) {
    next(err);
  }
}

async function verifyPayment(req, res, next) {
  try {
    const {
      appointmentId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    } = req.body;

    if (!appointmentId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        message: 'appointmentId, razorpay_order_id, razorpay_payment_id and razorpay_signature are required',
      });
    }

    const result = await paymentService.verifyAndCapture({
      appointmentId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// Razorpay calls this directly (no user session, no CORS, no JSON body-parsing
// applied the normal way — see app.js for the raw-body capture this depends on).
async function webhook(req, res, next) {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const result = await paymentService.handleWebhook(req.rawBody, signature);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createOrder,
  verifyPayment,
  webhook,
};
