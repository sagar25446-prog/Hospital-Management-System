import client from './client';

export const createPaymentIntent = async (appointmentId) => {
  const { data } = await client.post('/payments/intent', { appointmentId });
  return data;
};

export const processPayment = async (appointmentId, transactionId) => {
  const { data } = await client.post('/payments/process', { appointmentId, transactionId });
  return data;
};
