/**
 * Notification service: sends real email/SMS when a provider is configured
 * via environment variables, and otherwise logs to the console — the same
 * behavior the original mock always had, now as an honest fallback rather
 * than the only mode. No provider SDK is a hard dependency: this uses
 * plain HTTP calls (fetch) so the app doesn't fail to boot without them.
 *
 * Configure to go live:
 *   RESEND_API_KEY + NOTIFICATION_FROM_EMAIL   -> real email via Resend
 *   TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_FROM_NUMBER -> real SMS via Twilio
 * Leave any of these unset and that channel logs instead of sending —
 * the app keeps working in local/demo environments either way.
 */

function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.NOTIFICATION_FROM_EMAIL);
}

function isSmsConfigured() {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER);
}

async function logEmail(to, subject, htmlBody) {
  console.log('----------------------------------------------------');
  console.log(`[EMAIL - not sent, no provider configured] To: ${to}`);
  console.log(`[SUBJECT] ${subject}`);
  console.log(`[BODY]\n${htmlBody}`);
  console.log('----------------------------------------------------');
}

async function logSMS(phone, message) {
  console.log('----------------------------------------------------');
  console.log(`[SMS - not sent, no provider configured] To: ${phone}`);
  console.log(`[MESSAGE] ${message}`);
  console.log('----------------------------------------------------');
}

/**
 * Send an email. Uses Resend's HTTP API if configured, otherwise logs.
 * Never throws — a notification failure should not break the calling
 * request (e.g. a booking still succeeds even if the confirmation email
 * fails to send); errors are logged instead.
 */
async function sendEmail(to, subject, htmlBody) {
  if (!isEmailConfigured()) {
    return logEmail(to, subject, htmlBody);
  }
  if (typeof fetch !== 'function') {
    console.warn('[notificationService] fetch unavailable (Node < 18) — falling back to log');
    return logEmail(to, subject, htmlBody);
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.NOTIFICATION_FROM_EMAIL,
        to: [to],
        subject,
        html: htmlBody,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[notificationService] Resend email failed (${res.status}): ${body}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[notificationService] Email send error:', err.message);
    return false;
  }
}

/**
 * Send an SMS. Uses Twilio's HTTP API if configured, otherwise logs.
 * Never throws, for the same reason as sendEmail above.
 */
async function sendSMS(phone, message) {
  if (!isSmsConfigured()) {
    return logSMS(phone, message);
  }
  if (typeof fetch !== 'function') {
    console.warn('[notificationService] fetch unavailable (Node < 18) — falling back to log');
    return logSMS(phone, message);
  }

  try {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const auth = Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
    const params = new URLSearchParams({
      To: phone,
      From: process.env.TWILIO_FROM_NUMBER,
      Body: message,
    });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[notificationService] Twilio SMS failed (${res.status}): ${body}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[notificationService] SMS send error:', err.message);
    return false;
  }
}

module.exports = { sendEmail, sendSMS, isEmailConfigured, isSmsConfigured };
