/**
 * Request validation for queue endpoints. Plain JS, no extra deps.
 * Returns { error: string } or { value: object }.
 */

const QUEUE_STATUSES = ['waiting', 'called', 'serving', 'completed', 'cancelled'];

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

function validateGenerateToken(body) {
  const doctorId = body?.doctorId ?? body?.doctor_id;
  const patientId = body?.patientId ?? body?.patient_id;
  if (!doctorId || typeof doctorId !== 'string' || !doctorId.trim()) {
    return { error: 'doctorId is required' };
  }
  if (!patientId || typeof patientId !== 'string' || !patientId.trim()) {
    return { error: 'patientId is required' };
  }
  return {
    value: {
      doctorId: doctorId.trim(),
      patientId: patientId.trim(),
    },
  };
}

function validateUpdateCurrent(body) {
  const currentTokenNumber = body?.currentTokenNumber ?? body?.current_token_number;
  if (currentTokenNumber === undefined || currentTokenNumber === null) {
    return { error: 'currentTokenNumber is required' };
  }
  const num = Number(currentTokenNumber);
  if (!Number.isInteger(num) || num < 0) {
    return { error: 'currentTokenNumber must be a non-negative integer' };
  }
  return { value: { currentTokenNumber: num } };
}

function validateEstimateQuery(query) {
  const tokenNumber = query?.tokenNumber ?? query?.token_number;
  const tokenId = query?.tokenId ?? query?.token_id;
  if ((!tokenNumber && tokenNumber !== 0) && !tokenId) {
    return { error: 'tokenNumber or tokenId is required' };
  }
  if (tokenNumber !== undefined && tokenNumber !== null) {
    const num = Number(tokenNumber);
    if (!Number.isInteger(num) || num < 1) {
      return { error: 'tokenNumber must be a positive integer' };
    }
    return { value: { tokenNumber: num, tokenId: null } };
  }
  if (tokenId && typeof tokenId === 'string' && tokenId.trim()) {
    return { value: { tokenNumber: null, tokenId: tokenId.trim() } };
  }
  return { error: 'tokenNumber or tokenId is required' };
}

function validateDateQuery(query, paramName = 'date') {
  const dateStr = query?.[paramName];
  if (dateStr != null && dateStr !== '') {
    const date = parseDate(dateStr);
    if (!date) {
      return { error: 'Invalid date format (use YYYY-MM-DD)' };
    }
    return { value: { date } };
  }
  return { value: { date: getTodayDate() } };
}

function validateResetQuery(query) {
  return validateDateQuery(query, 'date');
}

module.exports = {
  validateGenerateToken,
  validateUpdateCurrent,
  validateEstimateQuery,
  validateDateQuery,
  validateResetQuery,
  getTodayDate,
  parseDate,
  QUEUE_STATUSES,
};
