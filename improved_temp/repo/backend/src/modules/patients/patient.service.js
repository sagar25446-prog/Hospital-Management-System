/**
 * Patient module: create (user+patient), list (search), profile, update, queue history, appointment history.
 */

const bcrypt = require('bcrypt');
const { pool } = require('../../config/database');
const { ApiError } = require('../../utils/ApiError');

const BCRYPT_ROUNDS = 10;
const UPDATE_ALLOWED_KEYS = ['first_name', 'last_name', 'date_of_birth', 'gender', 'phone', 'address', 'blood_group'];

async function createPatient(data) {
  const { email, password, first_name, last_name, date_of_birth, gender, phone, address, blood_group } = data;
  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'patient')
       RETURNING id, email, role`,
      [email, password_hash]
    );
    const user = userResult.rows[0];
    const patientResult = await client.query(
      `INSERT INTO patients (user_id, first_name, last_name, date_of_birth, gender, phone, address, blood_group)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, user_id, first_name, last_name, date_of_birth, gender, phone, address, blood_group, created_at, updated_at`,
      [user.id, first_name, last_name, date_of_birth ?? null, gender ?? null, phone ?? null, address ?? null, blood_group ?? null]
    );
    await client.query('COMMIT');
    const patient = patientResult.rows[0];
    return { ...patient, email: user.email };
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') throw new ApiError(409, 'Email already registered');
    throw err;
  } finally {
    client.release();
  }
}

/** Escape LIKE special characters (%, _) to avoid pattern injection. */
function escapeLike(str) {
  return String(str).replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

async function listPatients(filters) {
  const { search, limit, offset } = filters;
  let sql = `
    SELECT p.id, p.user_id, p.first_name, p.last_name, p.date_of_birth, p.gender, p.phone, p.address, p.blood_group, p.created_at, p.updated_at
    FROM patients p
  `;
  const params = [];
  if (search && search.length > 0) {
    sql += ` WHERE (p.first_name ILIKE $1 OR p.last_name ILIKE $1 OR p.phone ILIKE $1)`;
    params.push(`%${escapeLike(search)}%`);
  }
  sql += ` ORDER BY p.last_name, p.first_name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);
  const result = await pool.query(sql, params);
  return result.rows;
}

async function getPatientById(id, includeEmail = false) {
  let sql = `
    SELECT p.id, p.user_id, p.first_name, p.last_name, p.date_of_birth, p.gender, p.phone, p.address, p.blood_group, p.created_at, p.updated_at
  `;
  if (includeEmail) sql += `, u.email `;
  sql += ` FROM patients p`;
  if (includeEmail) sql += ` LEFT JOIN users u ON u.id = p.user_id`;
  sql += ` WHERE p.id = $1`;
  const result = await pool.query(sql, [id]);
  if (result.rows.length === 0) throw new ApiError(404, 'Patient not found');
  return result.rows[0];
}

async function getPatientProfile(id, includeEmail = false) {
  return getPatientById(id, includeEmail);
}

async function updatePatient(id, data) {
  const updates = {};
  for (const k of UPDATE_ALLOWED_KEYS) {
    if (data[k] !== undefined) updates[k] = data[k];
  }
  const keys = Object.keys(updates);
  if (keys.length === 0) return getPatientById(id);
  const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const params = [id, ...keys.map((k) => updates[k])];
  const result = await pool.query(
    `UPDATE patients SET ${setClause}, updated_at = NOW()
     WHERE id = $1 RETURNING id, user_id, first_name, last_name, date_of_birth, gender, phone, address, blood_group, created_at, updated_at`,
    params
  );
  if (result.rows.length === 0) throw new ApiError(404, 'Patient not found');
  return result.rows[0];
}

async function getQueueHistory(patientId, limit, offset) {
  await getPatientById(patientId);
  const result = await pool.query(
    `SELECT qt.id, qt.doctor_id, qt.patient_id, qt.token_number, qt.queue_date, qt.status, qt.created_at,
            d.first_name AS doctor_first_name, d.last_name AS doctor_last_name, d.specialization AS doctor_specialization
     FROM queue_tokens qt
     JOIN doctors d ON d.id = qt.doctor_id
     WHERE qt.patient_id = $1
     ORDER BY qt.queue_date DESC, qt.created_at DESC
     LIMIT $2 OFFSET $3`,
    [patientId, limit, offset]
  );
  return result.rows;
}

async function getAppointmentHistory(patientId, limit, offset) {
  await getPatientById(patientId);
  const result = await pool.query(
    `SELECT a.id, a.patient_id, a.doctor_id, a.appointment_date, a.start_time, a.end_time, a.status, a.notes, a.created_at, a.updated_at,
            d.first_name AS doctor_first_name, d.last_name AS doctor_last_name, d.specialization AS doctor_specialization
     FROM appointments a
     JOIN doctors d ON d.id = a.doctor_id
     WHERE a.patient_id = $1
     ORDER BY a.appointment_date DESC, a.start_time DESC
     LIMIT $2 OFFSET $3`,
    [patientId, limit, offset]
  );
  return result.rows;
}

async function getPatientIdByUserId(userId) {
  const r = await pool.query('SELECT id FROM patients WHERE user_id = $1', [userId]);
  return r.rows[0] ? r.rows[0].id : null;
}

module.exports = {
  createPatient,
  listPatients,
  getPatientById,
  getPatientProfile,
  updatePatient,
  getQueueHistory,
  getAppointmentHistory,
  getPatientIdByUserId,
};
