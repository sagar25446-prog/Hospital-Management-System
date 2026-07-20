/**
 * Runs SQL migration files in order. Tracks applied migrations in schema_migrations table.
 * Uses Neon HTTP SQL function for reliable connectivity (no TCP/WebSocket needed).
 * Usage: node -r dotenv/config src/db/runMigrations.js (from backend dir)
 */

const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const TRACKING_TABLE = 'schema_migrations';

async function main() {
  const sql = neon(process.env.DATABASE_URL);

  try {
    // Ensure tracking table exists
    await sql`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Get already-applied migrations
    const applied = await sql`SELECT name FROM schema_migrations ORDER BY name`;
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

      // Execute the migration (each statement separately for HTTP mode)
      // Split by semicolons, filter empty statements
      const statements = migrationSql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--'));

      for (const stmt of statements) {
        await sql(stmt);
      }

      // Mark as applied
      await sql`INSERT INTO schema_migrations (name) VALUES (${file})`;
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
  }
}

main();
