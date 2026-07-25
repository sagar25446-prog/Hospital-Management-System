/**
 * Entry point: load env, validate config, start HTTP server.
 */

require('dotenv').config();

const app = require('./app');

const PORT = process.env.PORT || 3000;

if (!process.env.DATABASE_URL) {
  console.error('Missing DATABASE_URL in environment. Expected format: postgresql://user:password@host:port/dbname');
  process.exit(1);
}

if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.error('Missing JWT_SECRET or JWT_REFRESH_SECRET in environment');
  process.exit(1);
}

// Optional integrations: warn instead of crashing, since the app still runs
// fine without them (Google sign-in / online payments will 500 if actually used).
if (!process.env.GOOGLE_CLIENT_ID) {
  console.warn('⚠️  GOOGLE_CLIENT_ID not set — "Sign in with Google" will be unavailable.');
}
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn('⚠️  RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET not set — online payments will be unavailable.');
}
if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
  console.warn('⚠️  RAZORPAY_WEBHOOK_SECRET not set — the /payments/webhook endpoint will reject all events.');
}

if (process.env.NODE_ENV !== 'production' || process.env.RENDER) {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

// Export for Vercel Serverless
module.exports = app;
