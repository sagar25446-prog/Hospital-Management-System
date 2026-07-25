/**
 * Runs SQL migration files in order. Tracks applied migrations in schema_migrations table.
 * Uses Neon HTTP SQL function for reliable connectivity (no TCP/WebSocket needed).
 * Usage: node -r dotenv/config src/db/runMigrations.js (from backend dir)
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const TRACKING_TABLE = 'schema_migrations';

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    // Ensure tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Get already-applied migrations
    const { rows: applied } = await client.query(`SELECT name FROM schema_migrations ORDER BY name`);
    const appliedSet = new Set(applied.map((r) => r.name));

    // Read migration files
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let appliedCount = 0;
    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`  Skip (already applied): ${file}`);
        continue;
      }

      const filePath = path.join(MIGRATIONS_DIR, file);
      const migrationSql = fs.readFileSync(filePath, 'utf8');

      // Execute the migration entirely at once
      await client.query(migrationSql);

      // Mark as applied
      await client.query(`INSERT INTO schema_migrations (name) VALUES ($1)`, [file]);
      console.log(`  ✅ Applied: ${file}`);
      appliedCount++;
    }

    if (appliedCount === 0) {
      console.log('✅ All migrations already applied. Database is up to date.');
    } else {
      console.log(`✅ ${appliedCount} migration(s) applied successfully.`);
    }
  } catch (err) {
    console.error('❌ Migration failed:', err.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
