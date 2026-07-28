/**
 * Real Razorpay payment integration.
 *
 * Flow:
 *   1. createOrder()   - server creates a Razorpay Order for the appointment fee.
 *   2. Frontend opens Razorpay Checkout with that order_id and collects payment.
 *   3. verifyAndCapture() - server verifies the HMAC signature Razorpay's
 *      checkout returns, then marks the appointment paid + creates an invoice.
 *   4. handleWebhook() - defense-in-depth: Razorpay also calls this
 *      server-to-server so payment status updates even if the user closes
 *      their browser before step 3 completes. Idempotent by design.
 *
 * Docs: https://razorpay.com/docs/payments/server-integration/nodejs/payment-gateway/build-integration/
 */

const crypto = require('crypto');
const Razorpay = require('razorpay');
const { pool } = require('../../config/database');
const { ApiError } = require('../../utils/ApiError');
const { sendEmail } = require('../../utils/notificationService');

const TAX_RATE = 0.18; // 18% GST, matches existing invoice behaviour

let razorpayInstance = null;
function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new ApiError(500, 'Razorpay is not configured on this server');
  }
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
}

/**
 * Create a Razorpay Order for an appointment's consultation fee.
 * Amount is computed server-side from the doctor's fee — never trust a
 * client-supplied amount for a payment.
 */
async function createOrder(appointmentId) {
  const result = await pool.query(
    `SELECT a.id, a.patient_id, a.doctor_id, a.payment_status, d.consultation_fee
     FROM appointments a
     JOIN doctors d ON a.doctor_id = d.id
     WHERE a.id = $1`,
    [appointmentId]
  );
  if (result.rows.length === 0) throw new ApiError(404, 'Appointment not found');

  const appt = result.rows[0];
  if (appt.payment_status === 'paid') throw new ApiError(400, 'Appointment is already paid');

  const amount = parseFloat(appt.consultation_fee);
  const tax = Math.round(amount * TAX_RATE * 100) / 100;
  const total = Math.round((amount + tax) * 100) / 100;
  const amountInPaise = Math.round(total * 100); // Razorpay uses the smallest currency unit

  const razorpay = getRazorpay();
  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: `appt_${appointmentId}`,
    notes: { appointmentId },
  });

  await pool.query(
    `UPDATE appointments SET razorpay_order_id = $1, updated_at = NOW() WHERE id = $2`,
    [order.id, appointmentId]
  );

  return {
    appointmentId,
    amount,
    tax,
    total,
    orderId: order.id,
    amountInPaise: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  };
}

/**
 * Verify the signature Razorpay Checkout returns to the browser, then
 * finalize payment: mark the appointment paid and create the invoice.
 * This is the primary confirmation path (fast, user-facing).
 */
async function verifyAndCapture({ appointmentId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  const validSignature =
    expectedSignature.length === razorpaySignature.length &&
    crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpaySignature));

  if (!validSignature) {
    throw new ApiError(400, 'Payment verification failed: signature mismatch');
  }

  return finalizePayment({ appointmentId, razorpayOrderId, razorpayPaymentId, razorpaySignature });
}

/**
 * Shared by verifyAndCapture() and the webhook handler. Idempotent: if the
 * appointment is already paid (e.g. the webhook races the checkout
 * callback), this is a safe no-op rather than a double-charge/double-invoice.
 */
async function finalizePayment({ appointmentId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `SELECT a.id, a.patient_id, a.doctor_id, a.payment_status, a.razorpay_order_id,
              d.consultation_fee, u.email, pat.first_name
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       JOIN patients pat ON a.patient_id = pat.id
       JOIN users u ON pat.user_id = u.id
       WHERE a.id = $1 FOR UPDATE`,
      [appointmentId]
    );
    if (result.rows.length === 0) throw new ApiError(404, 'Appointment not found');

    const appt = result.rows[0];

    if (appt.razorpay_order_id && appt.razorpay_order_id !== razorpayOrderId) {
      throw new ApiError(400, 'Order ID does not match this appointment');
    }

    if (appt.payment_status === 'paid') {
      await client.query('COMMIT');
      const existingInvoice = await pool.query(
        `SELECT * FROM invoices WHERE appointment_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [appointmentId]
      );
      return { success: true, message: 'Already paid', invoice: existingInvoice.rows[0] || null };
    }

    const amount = parseFloat(appt.consultation_fee);
    const tax = Math.round(amount * TAX_RATE * 100) / 100;
    const total = Math.round((amount + tax) * 100) / 100;

    await client.query(
      `UPDATE appointments SET payment_status = 'paid', transaction_id = $1, updated_at = NOW() WHERE id = $2`,
      [razorpayPaymentId, appointmentId]
    );

    const invoiceRes = await client.query(
      `INSERT INTO invoices (
         appointment_id, patient_id, amount, tax_amount, total_amount, status, paid_at,
         razorpay_order_id, razorpay_payment_id, razorpay_signature
       )
       VALUES ($1, $2, $3, $4, $5, 'paid', NOW(), $6, $7, $8)
       ON CONFLICT (razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL
       DO NOTHING
       RETURNING *`,
      [appointmentId, appt.patient_id, amount, tax, total, razorpayOrderId, razorpayPaymentId, razorpaySignature || null]
    );

    await client.query('COMMIT');

    const invoice = invoiceRes.rows[0] || (
      await pool.query(`SELECT * FROM invoices WHERE razorpay_payment_id = $1`, [razorpayPaymentId])
    ).rows[0];

    sendEmail(
      appt.email,
      'Payment Receipt - Q-Care',
      `<p>Hi ${appt.first_name},</p><p>Your payment of ₹${total.toFixed(2)} for appointment ${appointmentId} was successful.</p><p>Razorpay Payment ID: ${razorpayPaymentId}</p>`
    ).catch(console.error);

    return { success: true, invoice };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Handle a Razorpay webhook event. `rawBody` must be the exact bytes Razorpay
 * sent (signature is computed over the raw JSON, not a re-serialized object).
 * Configure this URL + a webhook secret in the Razorpay Dashboard:
 * Settings -> Webhooks -> Add New Webhook, subscribe to "payment.captured".
 */
async function handleWebhook(rawBody, signatureHeader) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new ApiError(500, 'Razorpay webhook secret is not configured');
  }
  if (!signatureHeader) {
    throw new ApiError(400, 'Missing webhook signature');
  }

  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  const valid =
    expected.length === signatureHeader.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));

  if (!valid) {
    throw new ApiError(400, 'Invalid webhook signature');
  }

  const event = JSON.parse(rawBody.toString('utf8'));

  if (event.event === 'payment.captured' || event.event === 'order.paid') {
    const payment = event.payload?.payment?.entity;
    if (payment) {
      const appointmentId = payment.notes?.appointmentId;
      if (appointmentId) {
        await finalizePayment({
          appointmentId,
          razorpayOrderId: payment.order_id,
          razorpayPaymentId: payment.id,
          razorpaySignature: null,
        }).catch((err) => {
          // Log and swallow: webhook must still return 200 so Razorpay
          // doesn't retry-storm us for a business-logic issue (e.g. already paid).
          console.error('Webhook finalizePayment error:', err.message);
        });
      }
    }
  }

  return { received: true };
}

module.exports = {
  createOrder,
  verifyAndCapture,
  handleWebhook,
};
