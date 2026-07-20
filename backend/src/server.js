/**
 * Entry point: load env, validate config, start HTTP server.
 */

require('dotenv').config();

const app = require('./app');

const PORT = process.env.PORT || 3000;

if (!process.env.DATABASE_URL) {
  console.error('Missing DATABASE_URL in environment. Expected format: postgresql://user:password@host:port/dbname');
}

if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.error('Missing JWT_SECRET or JWT_REFRESH_SECRET in environment');
  process.exit(1);
}

if (process.env.NODE_ENV !== 'production' || process.env.RENDER) {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

// Export for Vercel Serverless
module.exports = app;
