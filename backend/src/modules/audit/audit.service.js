const { pool } = require('../../config/database');

/**
 * Record one audit entry. Intentionally fire-and-forget from the caller's
 * perspective (the middleware doesn't await this) — a failure to write an
 * audit row should never be the reason a doctor can't see a prescription.
 */
async function record({ userId, userRole, action, resourceType, resourceId, method, path, ipAddress, statusCode }) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, user_role, action, resource_type, resource_id, method, path, ip_address, status_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [userId || null, userRole || null, action, resourceType, resourceId || null, method, path, ipAddress, statusCode]
    );
  } catch (err) {
    console.error('[audit] failed to record entry:', err.message);
  }
}

/**
 * Paginated read for the admin audit viewer.
 */
async function list({ limit = 50, offset = 0, userId, resourceType } = {}) {
  const conditions = [];
  const params = [];
  if (userId) {
    params.push(userId);
    conditions.push(`user_id = $${params.length}`);
  }
  if (resourceType) {
    params.push(resourceType);
    conditions.push(`resource_type = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  params.push(Math.min(Number(limit) || 50, 200));
  const limitParam = `$${params.length}`;
  params.push(Number(offset) || 0);
  const offsetParam = `$${params.length}`;

  const { rows } = await pool.query(
    `SELECT al.*, u.email AS user_email
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.user_id
     ${where}
     ORDER BY al.created_at DESC
     LIMIT ${limitParam} OFFSET ${offsetParam}`,
    params
  );
  return rows;
}

module.exports = { record, list };
