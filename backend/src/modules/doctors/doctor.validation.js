/**
 * Request validation for doctor endpoints. Plain JS.
 * Returns { error: string } or { value: object }.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function parseDate(str) {
  if (!str || typeof str !== 'string') return null;
  const trimmed = str.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const d = new Date(trimmed + 'T12:00:00Z');
  return isNaN(d.getTime()) ? null : trimmed;
}

function getTodayDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function validateCreateDoctor(body) {
  const email = body?.email?.trim?.();
  const password = body?.password;
  const first_name = body?.first_name ?? body?.firstName;
  const last_name = body?.last_name ?? body?.lastName;
  const specialization = body?.specialization?.trim?.();
  if (!email) return { error: 'Email is required' };
  if (!EMAIL_REGEX.test(email)) return { error: 'Invalid email format' };
  if (!password || typeof password !== 'string') return { error: 'Password is required' };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
  }
  if (!first_name || !String(first_name).trim()) return { error: 'First name is required' };
  if (!last_name || !String(last_name).trim()) return { error: 'Last name is required' };
  if (!specialization) return { error: 'Specialization is required' };
  const qualification = body?.qualification?.trim?.();
  const consultation_fee = body?.consultation_fee ?? body?.consultationFee;
  const fee = consultation_fee != null ? Number(consultation_fee) : 0;
  if (fee < 0 || !Number.isFinite(fee)) return { error: 'consultation_fee must be a non-negative number' };
  return {
    value: {
      email: email.toLowerCase(),
      password,
      first_name: String(first_name).trim(),
      last_name: String(last_name).trim(),
      specialization,
      qualification: qualification || null,
      consultation_fee: fee,
    },
  };
}

function validateUpdateDoctor(body) {
  const allowed = ['first_name', 'last_name', 'specialization', 'qualification', 'consultation_fee', 'is_available', 'phone'];
  const updates = {};
  for (const key of allowed) {
    const alt = key === 'first_name' ? 'firstName' : key === 'last_name' ? 'lastName' : key === 'consultation_fee' ? 'consultationFee' : key;
    const v = body?.[key] ?? body?.[alt];
    if (v === undefined) continue;
    if (key === 'is_available') {
      updates.is_available = Boolean(v);
    } else if (key === 'consultation_fee' || key === 'consultationFee') {
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0) return { error: 'consultation_fee must be a non-negative number' };
      updates.consultation_fee = n;
    } else if (key === 'phone') {
      updates.phone = v == null || v === '' ? null : String(v).trim().slice(0, 30);
    } else {
      if (typeof v !== 'string') return { error: `${key} must be a string` };
      const trimmed = v.trim();
      if ((key === 'first_name' || key === 'last_name' || key === 'specialization') && !trimmed) {
        return { error: `${key} cannot be empty` };
      }
      updates[key] = trimmed;
    }
  }
  if (Object.keys(updates).length === 0) return { error: 'No valid fields to update' };
  return { value: updates };
}

function validateScheduleBody(body) {
  const slots = Array.isArray(body?.slots) ? body.slots : Array.isArray(body) ? body : null;
  if (!slots || slots.length === 0) return { value: { slots: [] } };
  const out = [];
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    const day = s?.day_of_week ?? s?.dayOfWeek;
    const start = s?.start_time ?? s?.startTime;
    const end = s?.end_time ?? s?.endTime;
    if (day === undefined || day === null) return { error: `Slot ${i + 1}: day_of_week is required` };
    const d = Number(day);
    if (!Number.isInteger(d) || d < 0 || d > 6) return { error: `Slot ${i + 1}: day_of_week must be 0-6` };
    if (!start) return { error: `Slot ${i + 1}: start_time is required` };
    if (!end) return { error: `Slot ${i + 1}: end_time is required` };
    const startStr = String(start).trim();
    const endStr = String(end).trim();
    const timeRe = /^\d{1,2}:\d{2}(:\d{2})?$/;
    if (!timeRe.test(startStr) || !timeRe.test(endStr)) {
      return { error: `Slot ${i + 1}: start_time and end_time must be HH:MM or HH:MM:SS` };
    }
    const is_available = s?.is_available ?? s?.isAvailable;
    out.push({
      day_of_week: d,
      start_time: startStr,
      end_time: endStr,
      is_available: is_available === undefined ? true : Boolean(is_available),
    });
  }
  return { value: { slots: out } };
}

function validateListQuery(query) {
  const specialization = query?.specialization?.trim?.();
  const is_available = query?.is_available ?? query?.isAvailable;
  const has_active_queue = query?.has_active_queue ?? query?.hasActiveQueue;
  const date = query?.date ? parseDate(query.date) : getTodayDate();
  const limit = Math.min(Math.max(1, parseInt(query?.limit, 10) || 20), 100);
  const offset = Math.max(0, parseInt(query?.offset, 10) || 0);
  let availBool = undefined;
  if (is_available !== undefined && is_available !== '') {
    availBool = is_available === true || is_available === 'true' || is_available === '1';
  }
  const hasQueue = has_active_queue === true || has_active_queue === 'true' || has_active_queue === '1';
  return {
    value: {
      specialization: specialization || null,
      is_available: availBool,
      has_active_queue: hasQueue,
      date: date || getTodayDate(),
      limit,
      offset,
    },
  };
}

module.exports = {
  validateCreateDoctor,
  validateUpdateDoctor,
  validateScheduleBody,
  validateListQuery,
  getTodayDate,
  parseDate,
};
