import client from './client';

/**
 * Ask the backend to create a Razorpay Order for this appointment's fee.
 * Returns { orderId, amountInPaise, currency, keyId, amount, tax, total }.
 */
export const createOrder = async (appointmentId) => {
  const { data } = await client.post('/payments/create-order', { appointmentId });
  return data;
};

/**
 * After Razorpay Checkout succeeds in the browser, send its response back to
 * the server so it can verify the HMAC signature before marking anything paid.
 */
export const verifyPayment = async ({ appointmentId, razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  const { data } = await client.post('/payments/verify', {
    appointmentId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });
  return data;
};
