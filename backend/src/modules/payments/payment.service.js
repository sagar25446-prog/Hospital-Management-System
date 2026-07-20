const { pool } = require('../../config/database');
const { ApiError } = require('../../utils/ApiError');
const { sendEmail } = require('../../utils/notificationService');

/**
 * Mock create payment intent.
 * In a real app, you would call stripe.paymentIntents.create() here.
 */
async function createPaymentIntent(appointmentId) {
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
  const tax = amount * 0.18; // 18% mock tax
  const total = amount + tax;

  // Mock transaction ID
  const transactionId = `txn_mock_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  return {
    appointmentId,
    amount,
    tax,
    total,
    transactionId,
    clientSecret: `mock_secret_${transactionId}`
  };
}

/**
 * Finalize the payment and create the invoice.
 */
async function processPayment(appointmentId, transactionId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Lock the row
    const result = await client.query(
      `SELECT a.id, a.patient_id, a.doctor_id, a.payment_status, d.consultation_fee, u.email, pat.first_name
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       JOIN patients pat ON a.patient_id = pat.id
       JOIN users u ON pat.user_id = u.id
       WHERE a.id = $1 FOR UPDATE`,
      [appointmentId]
    );
    if (result.rows.length === 0) throw new ApiError(404, 'Appointment not found');
    
    const appt = result.rows[0];
    if (appt.payment_status === 'paid') {
      await client.query('ROLLBACK');
      return { success: true, message: 'Already paid' };
    }

    const amount = parseFloat(appt.consultation_fee);
    const tax = amount * 0.18;
    const total = amount + tax;

    // Update appointment
    await client.query(
      `UPDATE appointments SET payment_status = 'paid', transaction_id = $1, updated_at = NOW() WHERE id = $2`,
      [transactionId, appointmentId]
    );

    // Create Invoice
    const invoiceRes = await client.query(
      `INSERT INTO invoices (appointment_id, patient_id, amount, tax_amount, total_amount, status, paid_at)
       VALUES ($1, $2, $3, $4, $5, 'paid', NOW())
       RETURNING *`,
      [appointmentId, appt.patient_id, amount, tax, total]
    );

    await client.query('COMMIT');

    // Send mock email
    sendEmail(
      appt.email,
      'Payment Receipt - Q-Care',
      `<p>Hi ${appt.first_name},</p><p>Your payment of $${total.toFixed(2)} for appointment ${appointmentId} was successful.</p><p>Txn ID: ${transactionId}</p>`
    ).catch(console.error);

    return { success: true, invoice: invoiceRes.rows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  createPaymentIntent,
  processPayment
};
