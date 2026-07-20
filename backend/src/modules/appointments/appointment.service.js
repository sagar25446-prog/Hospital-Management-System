/**
 * Appointment business logic: book (with schedule check and queue token), list by doctor/patient, get by id, update status, cancel.
 */

const { pool } = require('../../config/database');
const { ApiError } = require('../../utils/ApiError');
const queueService = require('../queue/queue.service');
const doctorService = require('../doctors/doctor.service');
const patientService = require('../patients/patient.service');
const { getTodayDate } = require('./appointment.validation');

function getDayOfWeek(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.getDay(); // 0 = Sunday, 6 = Saturday
}

async function assertDoctorExists(doctorId) {
  await doctorService.getDoctorById(doctorId);
}

async function assertPatientExists(patientId) {
  await patientService.getPatientById(patientId);
}

/**
 * Check that (startTime, endTime) falls within at least one available doctor schedule slot for the given day_of_week.
 */
async function checkSlotInSchedule(doctorId, dayOfWeek, startTime, endTime) {
  const slots = await pool.query(
    `SELECT start_time, end_time FROM doctor_schedules
     WHERE doctor_id = $1 AND day_of_week = $2 AND is_available = true`,
    [doctorId, dayOfWeek]
  );
  if (slots.rows.length === 0) {
    throw new ApiError(400, 'Doctor has no available schedule for this day of week');
  }
  const slotFits = slots.rows.some((row) => {
    const slotStart = String(row.start_time);
    const slotEnd = String(row.end_time);
    return startTime >= slotStart && endTime <= slotEnd;
  });
  if (!slotFits) {
    throw new ApiError(400, 'Requested time slot is outside doctor schedule or not fully within a slot');
  }
}

/**
 * Check no existing appointment for (doctor_id, appointment_date, start_time). Double-booking prevention.
 */
async function checkNoConflict(client, doctorId, appointmentDate, startTime) {
  const r = await client.query(
    `SELECT id FROM appointments
     WHERE doctor_id = $1 AND appointment_date = $2 AND start_time = $3 AND status != 'cancelled'`,
    [doctorId, appointmentDate, startTime]
  );
  if (r.rows.length > 0) {
    throw new ApiError(409, 'This time slot is already booked for the doctor');
  }
}

async function bookAppointment(data) {
  const { doctorId, patientId, appointment_date, start_time, end_time, notes } = data;
  await assertDoctorExists(doctorId);
  await assertPatientExists(patientId);
  const dayOfWeek = getDayOfWeek(appointment_date);
  await checkSlotInSchedule(doctorId, dayOfWeek, start_time, end_time);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await checkNoConflict(client, doctorId, appointment_date, start_time);
    const insertAppt = await client.query(
      `INSERT INTO appointments (patient_id, doctor_id, appointment_date, start_time, end_time, status, notes)
       VALUES ($1, $2, $3, $4, $5, 'scheduled', $6)
       RETURNING id, patient_id, doctor_id, appointment_date, start_time, end_time, status, notes, queue_token_id, created_at, updated_at`,
      [patientId, doctorId, appointment_date, start_time, end_time, notes]
    );
    const appointment = insertAppt.rows[0];
    const token = await queueService.generateTokenInTransaction(client, doctorId, patientId, appointment_date);
    await client.query(
      'UPDATE appointments SET queue_token_id = $1, updated_at = NOW() WHERE id = $2',
      [token.id, appointment.id]
    );
    await client.query('COMMIT');
    return {
      ...appointment,
      queue_token_id: token.id,
      token_number: token.token_number,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    if (err instanceof ApiError) throw err;
    if (err.code === '23505') {
      throw new ApiError(409, 'This time slot is already booked');
    }
    throw err;
  } finally {
    client.release();
  }
}

function buildListWhere(filters, doctorIdOrPatientId, byDoctor) {
  const conditions = [];
  const params = [];
  let idx = 1;
  if (byDoctor) {
    conditions.push(`a.doctor_id = $${idx}`);
    params.push(doctorIdOrPatientId);
    idx++;
  } else {
    conditions.push(`a.patient_id = $${idx}`);
    params.push(doctorIdOrPatientId);
    idx++;
  }
  if (filters.date) {
    conditions.push(`a.appointment_date = $${idx}`);
    params.push(filters.date);
    idx++;
  }
  if (filters.from_date) {
    conditions.push(`a.appointment_date >= $${idx}`);
    params.push(filters.from_date);
    idx++;
  }
  if (filters.to_date) {
    conditions.push(`a.appointment_date <= $${idx}`);
    params.push(filters.to_date);
    idx++;
  }
  if (filters.status) {
    conditions.push(`a.status = $${idx}`);
    params.push(filters.status);
    idx++;
  }
  // Default: upcoming (today or future) when no date range
  if (!filters.date && !filters.from_date && !filters.to_date) {
    conditions.push(`a.appointment_date >= $${idx}`);
    params.push(getTodayDate());
    idx++;
  }
  return { conditions, params, nextIndex: idx };
}

async function listDoctorAppointments(doctorId, filters) {
  await assertDoctorExists(doctorId);
  const { conditions, params, nextIndex } = buildListWhere(filters, doctorId, true);
  const limitIdx = nextIndex;
  const offsetIdx = nextIndex + 1;
  params.push(filters.limit, filters.offset);
  const sql = `
    SELECT a.id, a.patient_id, a.doctor_id, a.appointment_date, a.start_time, a.end_time, a.status, a.payment_status, a.transaction_id, a.notes, a.queue_token_id, a.created_at, a.updated_at,
           p.first_name AS patient_first_name, p.last_name AS patient_last_name,
           qt.token_number
    FROM appointments a
    JOIN patients p ON p.id = a.patient_id
    LEFT JOIN queue_tokens qt ON qt.id = a.queue_token_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY a.appointment_date ASC, a.start_time ASC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;
  const result = await pool.query(sql, params);
  return result.rows;
}

async function listPatientAppointments(patientId, filters) {
  await assertPatientExists(patientId);
  const { conditions, params, nextIndex } = buildListWhere(filters, patientId, false);
  const limitIdx = nextIndex;
  const offsetIdx = nextIndex + 1;
  params.push(filters.limit, filters.offset);
  const sql = `
    SELECT a.id, a.patient_id, a.doctor_id, a.appointment_date, a.start_time, a.end_time, a.status, a.payment_status, a.transaction_id, a.notes, a.queue_token_id, a.created_at, a.updated_at,
           d.first_name AS doctor_first_name, d.last_name AS doctor_last_name, d.specialization AS doctor_specialization,
           qt.token_number
    FROM appointments a
    JOIN doctors d ON d.id = a.doctor_id
    LEFT JOIN queue_tokens qt ON qt.id = a.queue_token_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY a.appointment_date ASC, a.start_time ASC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;
  const result = await pool.query(sql, params);
  return result.rows;
}

async function getAppointmentById(id) {
  const result = await pool.query(
    `SELECT a.id, a.patient_id, a.doctor_id, a.appointment_date, a.start_time, a.end_time, a.status, a.payment_status, a.transaction_id, a.notes, a.queue_token_id, a.created_at, a.updated_at,
            p.first_name AS patient_first_name, p.last_name AS patient_last_name,
            d.first_name AS doctor_first_name, d.last_name AS doctor_last_name, d.specialization AS doctor_specialization,
            qt.token_number
     FROM appointments a
     JOIN patients p ON p.id = a.patient_id
     JOIN doctors d ON d.id = a.doctor_id
     LEFT JOIN queue_tokens qt ON qt.id = a.queue_token_id
     WHERE a.id = $1`,
    [id]
  );
  if (result.rows.length === 0) {
    throw new ApiError(404, 'Appointment not found');
  }
  return result.rows[0];
}

async function updateAppointmentStatus(id, status) {
  const r = await pool.query(
    `SELECT queue_token_id, appointment_date, status FROM appointments WHERE id = $1`,
    [id]
  );
  if (r.rows.length === 0) {
    throw new ApiError(404, 'Appointment not found');
  }
  const row = r.rows[0];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE appointments SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, id]
    );
    if (status === 'cancelled' && row.queue_token_id) {
      const today = getTodayDate();
      if (row.appointment_date === today) {
        await client.query(
          `UPDATE queue_tokens SET status = 'cancelled' WHERE id = $1 AND status = 'waiting'`,
          [row.queue_token_id]
        );
      }
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  return getAppointmentById(id);
}

async function cancelAppointment(id) {
  return updateAppointmentStatus(id, 'cancelled');
}

module.exports = {
  bookAppointment,
  listDoctorAppointments,
  listPatientAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment,
};
