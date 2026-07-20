/**
 * Doctor module: create (user+doctor), list, get profile, update, schedule, filter, list with active queues.
 */

const bcrypt = require('bcrypt');
const { pool } = require('../../config/database');
const { ApiError } = require('../../utils/ApiError');

const BCRYPT_ROUNDS = 10;

async function createDoctor(data) {
  const { email, password, first_name, last_name, specialization, qualification, consultation_fee } = data;
  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'doctor')
       RETURNING id, email, role`,
      [email, password_hash]
    );
    const user = userResult.rows[0];
    const doctorResult = await client.query(
      `INSERT INTO doctors (user_id, first_name, last_name, specialization, qualification, consultation_fee)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, first_name, last_name, specialization, qualification, consultation_fee, is_available, phone, created_at, updated_at`,
      [user.id, first_name, last_name, specialization, qualification ?? null, consultation_fee ?? 0]
    );
    await client.query('COMMIT');
    const doctor = doctorResult.rows[0];
    return { ...doctor, email: user.email };
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') throw new ApiError(409, 'Email already registered');
    throw err;
  } finally {
    client.release();
  }
}

function buildListWhere(filters) {
  const conditions = [];
  const params = [];
  let idx = 1;
  if (filters.specialization) {
    conditions.push(`d.specialization ILIKE $${idx}`);
    params.push(`%${filters.specialization}%`);
    idx++;
  }
  if (filters.is_available !== undefined) {
    conditions.push(`d.is_available = $${idx}`);
    params.push(filters.is_available);
    idx++;
  }
  return { conditions, params, nextIndex: idx };
}

async function listDoctors(filters) {
  const { specialization, is_available, has_active_queue, date, limit, offset } = filters;
  const { conditions, params, nextIndex } = buildListWhere({ specialization, is_available });
  let sql = `
    SELECT d.id, d.user_id, d.first_name, d.last_name, d.specialization, d.qualification,
           d.consultation_fee, d.is_available, d.phone, d.created_at, d.updated_at
  `;
  if (has_active_queue) {
    sql = `
    SELECT DISTINCT d.id, d.user_id, d.first_name, d.last_name, d.specialization, d.qualification,
           d.consultation_fee, d.is_available, d.phone, d.created_at, d.updated_at
    `;
  }
  sql += ` FROM doctors d`;
  if (has_active_queue) {
    sql += ` INNER JOIN queue_tokens q ON q.doctor_id = d.id AND q.queue_date = $${nextIndex} AND q.status IN ('waiting', 'called', 'serving')`;
    params.push(date);
  }
  if (conditions.length) sql += ` WHERE ` + conditions.join(' AND ');
  const limitIdx = params.length + 1;
  const offsetIdx = params.length + 2;
  sql += ` ORDER BY d.last_name, d.first_name LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
  params.push(limit, offset);
  const result = await pool.query(sql, params);
  return result.rows;
}

async function getDoctorById(id, includeEmail = false) {
  let sql = `
    SELECT d.id, d.user_id, d.first_name, d.last_name, d.specialization, d.qualification,
           d.consultation_fee, d.is_available, d.phone, d.created_at, d.updated_at
  `;
  if (includeEmail) sql += `, u.email `;
  sql += ` FROM doctors d`;
  if (includeEmail) sql += ` LEFT JOIN users u ON u.id = d.user_id`;
  sql += ` WHERE d.id = $1`;
  const result = await pool.query(sql, [id]);
  if (result.rows.length === 0) throw new ApiError(404, 'Doctor not found');
  return result.rows[0];
}

async function getDoctorProfile(id, includeEmail = false) {
  const doctor = await getDoctorById(id, includeEmail);
  const scheduleResult = await pool.query(
    `SELECT id, doctor_id, day_of_week, start_time, end_time, is_available, created_at
     FROM doctor_schedules WHERE doctor_id = $1 ORDER BY day_of_week, start_time`,
    [id]
  );
  return { ...doctor, schedule: scheduleResult.rows };
}

const UPDATE_ALLOWED_KEYS = ['first_name', 'last_name', 'specialization', 'qualification', 'consultation_fee', 'is_available', 'phone'];

async function updateDoctor(id, data) {
  const updates = {};
  for (const k of UPDATE_ALLOWED_KEYS) {
    if (data[k] !== undefined) updates[k] = data[k];
  }
  const keys = Object.keys(updates);
  if (keys.length === 0) return await getDoctorById(id);
  const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const params = [id, ...keys.map((k) => updates[k])];
  const result = await pool.query(
    `UPDATE doctors SET ${setClause}, updated_at = NOW()
     WHERE id = $1 RETURNING id, user_id, first_name, last_name, specialization, qualification, consultation_fee, is_available, phone, created_at, updated_at`,
    params
  );
  if (result.rows.length === 0) throw new ApiError(404, 'Doctor not found');
  return result.rows[0];
}

async function getSchedule(doctorId) {
  await getDoctorById(doctorId);
  const result = await pool.query(
    `SELECT id, doctor_id, day_of_week, start_time, end_time, is_available, created_at
     FROM doctor_schedules WHERE doctor_id = $1 ORDER BY day_of_week, start_time`,
    [doctorId]
  );
  return result.rows;
}

async function setSchedule(doctorId, slots) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await getDoctorById(doctorId);
    await client.query('DELETE FROM doctor_schedules WHERE doctor_id = $1', [doctorId]);
    for (const s of slots) {
      const { day_of_week, start_time, end_time, is_available } = s;
      if (start_time >= end_time) throw new ApiError(400, 'start_time must be before end_time');
      await client.query(
        `INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, is_available)
         VALUES ($1, $2, $3, $4, $5)`,
        [doctorId, day_of_week, start_time, end_time, is_available !== false]
      );
    }
    await client.query('COMMIT');
    return await getSchedule(doctorId);
  } catch (err) {
    await client.query('ROLLBACK');
    if (err instanceof ApiError) throw err;
    throw err;
  } finally {
    client.release();
  }
}

async function getSpecializations() {
  const result = await pool.query(
    `SELECT DISTINCT specialization FROM doctors WHERE specialization IS NOT NULL AND specialization != '' ORDER BY specialization`
  );
  return result.rows.map((r) => r.specialization);
}

/** Resolve doctor_id from user_id for "own" checks. */
async function getDoctorIdByUserId(userId) {
  const r = await pool.query('SELECT id FROM doctors WHERE user_id = $1', [userId]);
  return r.rows[0] ? r.rows[0].id : null;
}

module.exports = {
  createDoctor,
  listDoctors,
  getDoctorById,
  getDoctorProfile,
  updateDoctor,
  getSchedule,
  setSchedule,
  getSpecializations,
  getDoctorIdByUserId,
};
