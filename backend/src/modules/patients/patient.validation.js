/**
 * Request validation for patient endpoints. Plain JS.
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

function validateCreatePatient(body) {
  const email = body?.email?.trim?.();
  const password = body?.password;
  const first_name = body?.first_name ?? body?.firstName;
  const last_name = body?.last_name ?? body?.lastName;
  if (!email) return { error: 'Email is required' };
  if (!EMAIL_REGEX.test(email)) return { error: 'Invalid email format' };
  if (!password || typeof password !== 'string') return { error: 'Password is required' };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
  }
  if (!first_name || !String(first_name).trim()) return { error: 'First name is required' };
  if (!last_name || !String(last_name).trim()) return { error: 'Last name is required' };
  const date_of_birth = body?.date_of_birth ?? body?.dateOfBirth;
  const dob = date_of_birth ? parseDate(String(date_of_birth).trim()) : null;
  if (date_of_birth && !dob) return { error: 'Invalid date_of_birth (use YYYY-MM-DD)' };
  return {
    value: {
      email: email.toLowerCase(),
      password,
      first_name: String(first_name).trim(),
      last_name: String(last_name).trim(),
      date_of_birth: dob,
      gender: body?.gender != null ? String(body.gender).trim().slice(0, 20) : null,
      phone: body?.phone != null ? String(body.phone).trim().slice(0, 30) : null,
      address: body?.address != null ? String(body.address).trim() : null,
      blood_group: (body?.blood_group ?? body?.bloodGroup) != null ? String(body?.blood_group ?? body?.bloodGroup).trim().slice(0, 10) : null,
    },
  };
}

const UPDATE_ALLOWED = ['first_name', 'last_name', 'date_of_birth', 'gender', 'phone', 'address', 'blood_group'];

function validateUpdatePatient(body) {
  const updates = {};
  for (const key of UPDATE_ALLOWED) {
    const alt = key === 'first_name' ? 'firstName' : key === 'last_name' ? 'lastName' : key === 'date_of_birth' ? 'dateOfBirth' : key === 'blood_group' ? 'bloodGroup' : key;
    const v = body?.[key] ?? body?.[alt];
    if (v === undefined) continue;
    if (key === 'date_of_birth') {
      const dob = v === null || v === '' ? null : parseDate(String(v).trim());
      if (v !== null && v !== '' && !dob) return { error: 'Invalid date_of_birth (use YYYY-MM-DD)' };
      updates.date_of_birth = dob;
    } else if (key === 'gender') {
      updates.gender = v == null || v === '' ? null : String(v).trim().slice(0, 20);
    } else if (key === 'phone') {
      updates.phone = v == null || v === '' ? null : String(v).trim().slice(0, 30);
    } else if (key === 'address') {
      updates.address = v == null || v === '' ? null : String(v).trim();
    } else if (key === 'blood_group') {
      updates.blood_group = v == null || v === '' ? null : String(v).trim().slice(0, 10);
    } else {
      if (typeof v !== 'string') return { error: `${key} must be a string` };
      const trimmed = v.trim();
      if (!trimmed) return { error: `${key} cannot be empty` };
      updates[key] = trimmed;
    }
  }
  if (Object.keys(updates).length === 0) return { error: 'No valid fields to update' };
  return { value: updates };
}

function validateListQuery(query) {
  const search = query?.search?.trim?.();
  const limit = Math.min(Math.max(1, parseInt(query?.limit, 10) || 20), 100);
  const offset = Math.max(0, parseInt(query?.offset, 10) || 0);
  return {
    value: {
      search: search || null,
      limit,
      offset,
    },
  };
}

function validateHistoryQuery(query) {
  const limit = Math.min(Math.max(1, parseInt(query?.limit, 10) || 50), 100);
  const offset = Math.max(0, parseInt(query?.offset, 10) || 0);
  return { value: { limit, offset } };
}

module.exports = {
  validateCreatePatient,
  validateUpdatePatient,
  validateListQuery,
  validateHistoryQuery,
  parseDate,
};
