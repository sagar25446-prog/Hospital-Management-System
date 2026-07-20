/**
 * Request validation for auth endpoints. Plain JS, no extra deps.
 * Returns { error: string } or { value: object }.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const ROLES = ['admin', 'doctor', 'patient', 'reception'];
const REGISTER_ROLES = ['doctor', 'patient'];

function validateRegister(body) {
  const { email, password, role, first_name, last_name } = body || {};
  if (!email || typeof email !== 'string') {
    return { error: 'Email is required' };
  }
  const trimmedEmail = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return { error: 'Invalid email format' };
  }
  if (!password || typeof password !== 'string') {
    return { error: 'Password is required' };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
  }
  if (!role || !REGISTER_ROLES.includes(role)) {
    return { error: 'Role must be doctor or patient' };
  }
  if (!first_name || typeof first_name !== 'string' || !first_name.trim()) {
    return { error: 'First name is required' };
  }
  if (!last_name || typeof last_name !== 'string' || !last_name.trim()) {
    return { error: 'Last name is required' };
  }
  if (role === 'doctor' && (!body.specialization || typeof body.specialization !== 'string' || !body.specialization.trim())) {
    return { error: 'Specialization is required for doctors' };
  }
  return {
    value: {
      email: trimmedEmail,
      password,
      role,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      date_of_birth: body.date_of_birth || null,
      gender: body.gender || null,
      phone: body.phone || null,
      address: body.address || null,
      blood_group: body.blood_group || null,
      specialization: body.specialization ? body.specialization.trim() : null,
      qualification: body.qualification ? body.qualification.trim() : null,
      consultation_fee: body.consultation_fee != null ? Number(body.consultation_fee) : 0,
    },
  };
}

function validateLogin(body) {
  const { email, password } = body || {};
  if (!email || typeof email !== 'string') {
    return { error: 'Email is required' };
  }
  if (!password || typeof password !== 'string') {
    return { error: 'Password is required' };
  }
  return {
    value: {
      email: email.trim().toLowerCase(),
      password,
    },
  };
}

function validateRefresh(token) {
  if (!token || typeof token !== 'string' || !token.trim()) {
    return { error: 'Refresh token is required' };
  }
  return { value: { refreshToken: token.trim() } };
}

function validateLogout(token) {
  if (!token || typeof token !== 'string' || !token.trim()) {
    return { error: 'Refresh token is required' };
  }
  return { value: { refreshToken: token.trim() } };
}

module.exports = {
  validateRegister,
  validateLogin,
  validateRefresh,
  validateLogout,
  ROLES,
};
