/**
 * Queue API: get current queue, estimate waiting time.
 */
import apiClient from './client';

/**
 * GET /api/v1/queue/doctors/:doctorId
 * @param {string} doctorId
 * @param {string} [date] - Optional YYYY-MM-DD; defaults to today on backend
 */
export async function getQueue(doctorId, date) {
  const params = date ? { date } : {};
  const { data } = await apiClient.get(`queue/doctors/${doctorId}`, { params });
  return data;
}

/**
 * GET /api/v1/queue/doctors/:doctorId/estimate
 * @param {string} doctorId
 * @param {{ tokenNumber?: number, tokenId?: string, date?: string }} options
 */
export async function getEstimate(doctorId, options = {}) {
  const params = {};
  if (options.tokenNumber != null) params.tokenNumber = options.tokenNumber;
  if (options.tokenId) params.tokenId = options.tokenId;
  if (options.date) params.date = options.date;
  const { data } = await apiClient.get(`queue/doctors/${doctorId}/estimate`, { params });
  return data;
}

/**
 * PATCH /api/v1/queue/doctors/:doctorId/current
 * @param {string} doctorId
 * @param {number} currentTokenNumber
 * @param {string} [date] - Optional YYYY-MM-DD
 */
export async function updateCurrentToken(doctorId, currentTokenNumber, date) {
  const params = date ? { date } : {};
  const { data } = await apiClient.patch(`queue/doctors/${doctorId}/current`, { currentTokenNumber }, { params });
  return data;
}

/**
 * POST /api/v1/queue/doctors/:doctorId/reset
 * @param {string} doctorId
 * @param {string} [date] - Optional YYYY-MM-DD; defaults to today on backend
 */
export async function resetQueue(doctorId, date) {
  const params = date ? { date } : {};
  const { data } = await apiClient.post(`queue/doctors/${doctorId}/reset`, null, { params });
  return data;
}

/**
 * POST /api/v1/queue/token
 * @param {{ doctorId: string, date?: string }} payload
 */
export async function generateToken(payload) {
  const { data } = await apiClient.post(`queue/token`, payload);
  return data;
}
