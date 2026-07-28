/**
 * PostgreSQL connection configuration using Neon serverless HTTP driver.
 * Uses the fetch-based `neon()` function for reliable connectivity,
 * with a Pool wrapper for compatibility with existing service code.
 */

require('dotenv').config();

const { neon, Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');

// Configure WebSocket for Pool (used in serverless/Vercel environments)
neonConfig.webSocketConstructor = ws;

const isProduction = process.env.NODE_ENV === 'production';

// HTTP-based SQL function (most reliable, works everywhere)
const sql = neon(process.env.DATABASE_URL);

// Pool-based connection (for transaction support and existing code compatibility)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: isProduction ? 5 : 3,
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 30000,
  allowExitOnIdle: true,
});

// Log pool errors without crashing
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message);
});

module.exports = { pool, sql };
