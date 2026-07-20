/**
 * Mock Notification Service
 * In a real application, this would integrate with SendGrid, Twilio, or AWS SES.
 */

async function sendEmail(to, subject, htmlBody) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log('----------------------------------------------------');
  console.log(`[EMAIL SENT] To: ${to}`);
  console.log(`[SUBJECT] ${subject}`);
  console.log(`[BODY]\n${htmlBody}`);
  console.log('----------------------------------------------------');
  return true;
}

async function sendSMS(phone, message) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log('----------------------------------------------------');
  console.log(`[SMS SENT] To: ${phone}`);
  console.log(`[MESSAGE] ${message}`);
  console.log('----------------------------------------------------');
  return true;
}

module.exports = {
  sendEmail,
  sendSMS,
};
