/**
 * Notification Service
 * Integrates with SendGrid for emails. Falls back to console if key is missing.
 */
const sgMail = require('@sendgrid/mail');

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

async function sendEmail(to, subject, htmlBody) {
  if (!process.env.SENDGRID_API_KEY) {
    // Fallback if no key is configured
    console.log('----------------------------------------------------');
    console.log(`[MOCK EMAIL] To: ${to}`);
    console.log(`[SUBJECT] ${subject}`);
    console.log(`[BODY]\n${htmlBody}`);
    console.log('----------------------------------------------------');
    return true;
  }

  try {
    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@qcare.com', // Must be verified in SendGrid
      subject,
      html: htmlBody,
    };
    await sgMail.send(msg);
    console.log(`[EMAIL SENT] To: ${to} via SendGrid`);
    return true;
  } catch (error) {
    console.error('[SENDGRID ERROR]', error);
    if (error.response) {
      console.error(error.response.body);
    }
    return false;
  }
}

async function sendSMS(phone, message) {
  // Simulate network delay for now (Twilio to be added later)
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log('----------------------------------------------------');
  console.log(`[MOCK SMS] To: ${phone}`);
  console.log(`[MESSAGE] ${message}`);
  console.log('----------------------------------------------------');
  return true;
}

async function sendWhatsApp(phone, templateName, variables) {
  // Simulate network delay for now (WhatsApp Business API to be added later)
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log('----------------------------------------------------');
  console.log(`[MOCK WHATSAPP] To: ${phone}`);
  console.log(`[TEMPLATE] ${templateName}`);
  console.log(`[VARIABLES] ${JSON.stringify(variables)}`);
  console.log('----------------------------------------------------');
  return true;
}

module.exports = {
  sendEmail,
  sendSMS,
  sendWhatsApp,
};
