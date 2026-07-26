/**
 * Quick script to run a single migration via Neon HTTP SQL.
 * Usage: node src/db/runSingleMigration.js <migration_file>
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const { sql } = require('../config/database');

async function main() {
  const migrationFile = process.argv[2];
  if (!migrationFile) {
    console.error('Usage: node runSingleMigration.js <migration_file.sql>');
    process.exit(1);
  }

  const filePath = path.join(__dirname, 'migrations', migrationFile);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const migrationSql = fs.readFileSync(filePath, 'utf8');
  
  try {
    // Split on semicolons and run each statement
    const statements = migrationSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const stmt of statements) {
      await sql.query(stmt);
    }
    console.log(`✅ Migration applied: ${migrationFile}`);
  } catch (err) {
    console.error('❌ Migration failed:', err.message || err);
    process.exit(1);
  }
}

main();
