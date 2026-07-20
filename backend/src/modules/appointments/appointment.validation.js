/**
 * Request validation for appointment endpoints. Plain JS.
 * Returns { error: string } or { value: object }.
 */

const APPOINTMENT_STATUSES = ['scheduled', 'completed', 'cancelled', 'no_show'];

// YYYY-MM-DD
function parseDate(str) {
  if (!str || typeof str !== 'string') return null;
  const trimmed = str.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const d = new Date(trimmed + 'T12:00:00Z');
  return isNaN(d.getTime()) ? null : trimmed;
}

// HH:MM or HH:MM:SS -> normalize to HH:MM:SS for consistent comparison with doctor_schedules
function parseTime(str) {
  if (!str || typeof str !== 'string') return null;
  const trimmed = str.trim();
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) return trimmed + ':00';
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  return null;
}

function getTodayDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function validateBookAppointment(body) {
  const doctorId = body?.doctorId ?? body?.doctor_id;
  const patientId = body?.patientId ?? body?.patient_id;
  const appointment_date = body?.appointment_date ?? body?.appointmentDate;
  const start_time = body?.start_time ?? body?.startTime;
  const end_time = body?.end_time ?? body?.endTime;
  const notes = body?.notes;

  if (!doctorId || typeof doctorId !== 'string' || !doctorId.trim()) {
    return { error: 'doctorId is required' };
  }
  if (!patientId || typeof patientId !== 'string' || !patientId.trim()) {
    return { error: 'patientId is required' };
  }
  const dateVal = appointment_date ? parseDate(String(appointment_date).trim()) : null;
  if (!dateVal) {
    return { error: 'appointment_date is required and must be YYYY-MM-DD' };
  }
  if (dateVal < getTodayDate()) {
    return { error: 'appointment_date cannot be in the past' };
  }
  const startVal = start_time != null ? parseTime(String(start_time).trim()) : null;
  if (!startVal) {
    return { error: 'start_time is required (HH:MM or HH:MM:SS)' };
  }
  const endVal = end_time != null ? parseTime(String(end_time).trim()) : null;
  if (!endVal) {
    return { error: 'end_time is required (HH:MM or HH:MM:SS)' };
  }
  if (startVal >= endVal) {
    return { error: 'start_time must be before end_time' };
  }

  return {
    value: {
      doctorId: doctorId.trim(),
      patientId: patientId.trim(),
      appointment_date: dateVal,
      start_time: startVal,
      end_time: endVal,
      notes: notes != null && notes !== '' ? String(notes).trim() : null,
    },
  };
}

function validateListQuery(query) {
  const date = query?.date != null ? parseDate(String(query.date).trim()) : null;
  const from_date = query?.from_date ?? query?.fromDate;
  const to_date = query?.to_date ?? query?.toDate;
  const fromVal = from_date != null ? parseDate(String(from_date).trim()) : null;
  const toVal = to_date != null ? parseDate(String(to_date).trim()) : null;
  const status = query?.status?.trim?.();
  const limit = Math.min(Math.max(1, parseInt(query?.limit, 10) || 50), 100);
  const offset = Math.max(0, parseInt(query?.offset, 10) || 0);

  if (status && !APPOINTMENT_STATUSES.includes(status)) {
    return { error: `status must be one of: ${APPOINTMENT_STATUSES.join(', ')}` };
  }
  if (fromVal && toVal && fromVal > toVal) {
    return { error: 'from_date must be before or equal to to_date' };
  }

  return {
    value: {
      date: date || null,
      from_date: fromVal || null,
      to_date: toVal || null,
      status: status || null,
      limit,
      offset,
    },
  };
}

function validateUpdateStatus(body) {
  const status = body?.status?.trim?.();
  if (!status) {
    return { error: 'status is required' };
  }
  if (!APPOINTMENT_STATUSES.includes(status)) {
    return { error: `status must be one of: ${APPOINTMENT_STATUSES.join(', ')}` };
  }
  return { value: { status } };
}

module.exports = {
  APPOINTMENT_STATUSES,
  parseDate,
  parseTime,
  getTodayDate,
  validateBookAppointment,
  validateListQuery,
  validateUpdateStatus,
};
