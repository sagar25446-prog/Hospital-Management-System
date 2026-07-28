/**
 * Database layer exports.
 * - pool: use for all queries (parameterized only)
 * - runMigrations: programmatic migration runner (or run via CLI script)
 */

const { pool } = require('../config/database');

module.exports = {
  pool,
  /**
   * Convenience: execute a query with params. Uses pool.query.
   * @param {string} text - SQL with $1, $2 placeholders
   * @param {Array} [params] - Values for placeholders
   * @returns {Promise<{ rows, rowCount }>}
   */
  query(text, params) {
    return pool.query(text, params);
  },
};
