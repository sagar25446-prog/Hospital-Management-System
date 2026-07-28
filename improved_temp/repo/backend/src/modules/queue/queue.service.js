/**
 * Queue business logic: generate token, get queue, update current, estimate wait, upcoming, reset.
 * Uses pool for DB; doctor_daily_queue for current/last token; queue_tokens for list.
 */

const { pool } = require('../../config/database');
const { ApiError } = require('../../utils/ApiError');
const { getTodayDate, parseDate } = require('./queue.validation');

const DEFAULT_AVG_CONSULTATION_MINUTES = 10;

function toQueueDate(dateStr) {
  return dateStr || getTodayDate();
}

async function assertDoctorExists(doctorId) {
  const r = await pool.query('SELECT id FROM doctors WHERE id = $1', [doctorId]);
  if (r.rows.length === 0) {
    throw new ApiError(404, 'Doctor not found');
  }
}

/**
 * Ensure doctor_daily_queue row exists; return current_token_number and last_token_number.
 */
async function ensureDoctorDailyQueue(client, doctorId, queueDate) {
  await client.query(
    `INSERT INTO doctor_daily_queue (doctor_id, queue_date, current_token_number, last_token_number)
     VALUES ($1, $2, 0, 0)
     ON CONFLICT (doctor_id, queue_date) DO NOTHING`,
    [doctorId, queueDate]
  );
  const r = await client.query(
    `SELECT current_token_number, last_token_number FROM doctor_daily_queue
     WHERE doctor_id = $1 AND queue_date = $2`,
    [doctorId, queueDate]
  );
  return r.rows[0];
}

/**
 * Generate a new token for (doctor, patient, date). One token per patient per doctor per day.
 */
async function generateToken(doctorId, patientId, dateStr) {
  const queueDate = toQueueDate(dateStr);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const doctorCheck = await client.query(
      'SELECT id FROM doctors WHERE id = $1',
      [doctorId]
    );
    if (doctorCheck.rows.length === 0) {
      throw new ApiError(404, 'Doctor not found');
    }
    const patientCheck = await client.query(
      'SELECT id FROM patients WHERE id = $1',
      [patientId]
    );
    if (patientCheck.rows.length === 0) {
      throw new ApiError(404, 'Patient not found');
    }
    const tokenRow = await generateTokenInTransaction(client, doctorId, patientId, queueDate);
    await client.query('COMMIT');
    return tokenRow;
  } catch (err) {
    await client.query('ROLLBACK');
    if (err instanceof ApiError) throw err;
    if (err.code === '23505') {
      throw new ApiError(409, 'Duplicate token or patient already in queue');
    }
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Generate a queue token using an existing transaction client (no commit/rollback).
 * Used by appointment booking so appointment + token are created in one transaction.
 * Caller must have already started a transaction on client.
 */
async function generateTokenInTransaction(client, doctorId, patientId, queueDate) {
  const existing = await client.query(
    `SELECT id FROM queue_tokens WHERE doctor_id = $1 AND queue_date = $2 AND patient_id = $3`,
    [doctorId, queueDate, patientId]
  );
  if (existing.rows.length > 0) {
    throw new ApiError(409, 'Patient already has a token for this doctor on this date');
  }
  await ensureDoctorDailyQueue(client, doctorId, queueDate);
  const inc = await client.query(
    `UPDATE doctor_daily_queue SET last_token_number = last_token_number + 1, updated_at = NOW()
     WHERE doctor_id = $1 AND queue_date = $2
     RETURNING last_token_number`,
    [doctorId, queueDate]
  );
  const tokenNumber = inc.rows[0].last_token_number;
  const insert = await client.query(
    `INSERT INTO queue_tokens (doctor_id, patient_id, queue_date, token_number, status)
     VALUES ($1, $2, $3, $4, 'waiting')
     RETURNING id, doctor_id, patient_id, token_number, queue_date, status, created_at`,
    [doctorId, patientId, queueDate, tokenNumber]
  );
  return insert.rows[0];
}

/**
 * Get current queue for doctor: list of tokens (waiting/called/serving) and current_token_number.
 */
async function getCurrentQueue(doctorId, dateStr) {
  await assertDoctorExists(doctorId);
  const queueDate = toQueueDate(dateStr);
  const [stateResult, tokensResult, doctorResult] = await Promise.all([
    pool.query(
      `SELECT current_token_number, last_token_number, updated_at
       FROM doctor_daily_queue WHERE doctor_id = $1 AND queue_date = $2`,
      [doctorId, queueDate]
    ),
    pool.query(
      `SELECT qt.id, qt.doctor_id, qt.patient_id, qt.token_number, qt.queue_date, qt.status, qt.created_at,
              p.first_name AS patient_first_name, p.last_name AS patient_last_name
       FROM queue_tokens qt
       JOIN patients p ON p.id = qt.patient_id
       WHERE qt.doctor_id = $1 AND qt.queue_date = $2 AND qt.status IN ('waiting', 'called', 'serving')
       ORDER BY qt.token_number ASC`,
      [doctorId, queueDate]
    ),
    pool.query(
      `SELECT id, first_name, last_name, specialization, qualification, consultation_fee, is_available, phone
       FROM doctors
       WHERE id = $1`,
      [doctorId]
    ),
  ]);
  const state =
    stateResult.rows[0] || { current_token_number: 0, last_token_number: 0, updated_at: null };
  const doctor = doctorResult.rows[0] || null;
  return {
    doctor,
    doctorId,
    queueDate,
    currentTokenNumber: Number(state.current_token_number),
    lastTokenNumber: Number(state.last_token_number),
    updatedAt: state.updated_at,
    tokens: tokensResult.rows,
  };
}

/**
 * Update current token number for doctor/date (staff only).
 */
async function updateCurrentToken(doctorId, currentTokenNumber, dateStr) {
  await assertDoctorExists(doctorId);
  const queueDate = toQueueDate(dateStr);
  // Ensure row exists (use pool directly - not inside a transaction)
  await pool.query(
    `INSERT INTO doctor_daily_queue (doctor_id, queue_date, current_token_number, last_token_number)
     VALUES ($1, $2, 0, 0)
     ON CONFLICT (doctor_id, queue_date) DO NOTHING`,
    [doctorId, queueDate]
  );
  const result = await pool.query(
    `UPDATE doctor_daily_queue SET current_token_number = $1, updated_at = NOW()
     WHERE doctor_id = $2 AND queue_date = $3
     RETURNING doctor_id, queue_date, current_token_number`,
    [currentTokenNumber, doctorId, queueDate]
  );
  if (result.rows.length === 0) {
    throw new ApiError(404, 'Doctor or queue date not found');
  }
  return result.rows[0];
}

/**
 * Estimate waiting time in minutes for a token (by tokenNumber or tokenId).
 */
async function estimateWaitingTime(doctorId, dateStr, tokenNumberOrId, byTokenId = false) {
  await assertDoctorExists(doctorId);
  const queueDate = toQueueDate(dateStr);
  let tokenNumber;
  if (byTokenId) {
    const r = await pool.query(
      `SELECT token_number FROM queue_tokens WHERE id = $1 AND doctor_id = $2 AND queue_date = $3`,
      [tokenNumberOrId, doctorId, queueDate]
    );
    if (r.rows.length === 0) {
      throw new ApiError(404, 'Token not found');
    }
    tokenNumber = r.rows[0].token_number;
  } else {
    tokenNumber = tokenNumberOrId;
  }
  const state = await pool.query(
    `SELECT current_token_number FROM doctor_daily_queue WHERE doctor_id = $1 AND queue_date = $2`,
    [doctorId, queueDate]
  );
  const current = state.rows[0] ? Number(state.rows[0].current_token_number) : 0;
  const peopleAhead = Math.max(0, tokenNumber - current - 1);
  const estimatedMinutes = peopleAhead * DEFAULT_AVG_CONSULTATION_MINUTES;
  return {
    doctorId,
    queueDate,
    tokenNumber,
    currentTokenNumber: current,
    peopleAhead: peopleAhead,
    estimatedMinutes,
  };
}

/**
 * List upcoming tokens for doctor (waiting/called/serving), optionally limited.
 */
async function listUpcomingTokens(doctorId, dateStr, limit = 50) {
  await assertDoctorExists(doctorId);
  const queueDate = toQueueDate(dateStr);
  const result = await pool.query(
    `SELECT qt.id, qt.doctor_id, qt.patient_id, qt.token_number, qt.queue_date, qt.status, qt.created_at,
            p.first_name AS patient_first_name, p.last_name AS patient_last_name
     FROM queue_tokens qt
     JOIN patients p ON p.id = qt.patient_id
     WHERE qt.doctor_id = $1 AND qt.queue_date = $2 AND qt.status IN ('waiting', 'called', 'serving')
     ORDER BY qt.token_number ASC
     LIMIT $3`,
    [doctorId, queueDate, Math.min(limit, 100)]
  );
  const state = await pool.query(
    `SELECT current_token_number FROM doctor_daily_queue WHERE doctor_id = $1 AND queue_date = $2`,
    [doctorId, queueDate]
  );
  const currentTokenNumber = state.rows[0] ? Number(state.rows[0].current_token_number) : 0;
  return {
    doctorId,
    queueDate,
    currentTokenNumber,
    tokens: result.rows,
  };
}

/**
 * Reset daily queue: set current_token_number to 0 for doctor/date.
 */
async function resetDailyQueue(doctorId, dateStr) {
  await assertDoctorExists(doctorId);
  const queueDate = toQueueDate(dateStr);
  // Ensure row exists (use pool directly - not inside a transaction)
  await pool.query(
    `INSERT INTO doctor_daily_queue (doctor_id, queue_date, current_token_number, last_token_number)
     VALUES ($1, $2, 0, 0)
     ON CONFLICT (doctor_id, queue_date) DO NOTHING`,
    [doctorId, queueDate]
  );
  const result = await pool.query(
    `UPDATE doctor_daily_queue SET current_token_number = 0, updated_at = NOW()
     WHERE doctor_id = $1 AND queue_date = $2
     RETURNING doctor_id, queue_date, current_token_number`,
    [doctorId, queueDate]
  );
  if (result.rows.length === 0) {
    throw new ApiError(404, 'Doctor or queue date not found');
  }
  return result.rows[0];
}

/**
 * Resolve doctor_id from user_id (for role "doctor" own-resource checks).
 */
async function getDoctorIdByUserId(userId) {
  const r = await pool.query(
    'SELECT id FROM doctors WHERE user_id = $1',
    [userId]
  );
  return r.rows[0] ? r.rows[0].id : null;
}

/**
 * Resolve patient_id from user_id (for role "patient" own-resource checks).
 */
async function getPatientIdByUserId(userId) {
  const r = await pool.query(
    'SELECT id FROM patients WHERE user_id = $1',
    [userId]
  );
  return r.rows[0] ? r.rows[0].id : null;
}

module.exports = {
  generateToken,
  generateTokenInTransaction,
  getCurrentQueue,
  updateCurrentToken,
  estimateWaitingTime,
  listUpcomingTokens,
  resetDailyQueue,
  getDoctorIdByUserId,
  getPatientIdByUserId,
};
