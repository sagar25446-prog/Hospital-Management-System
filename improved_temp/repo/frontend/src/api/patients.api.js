/**
 * Patients API: list, queue history, appointment history, profile update.
 */
import apiClient from './client';

/**
 * GET /api/v1/patients - List patients (admin/reception)
 * @param {{ search?: string, limit?: number, offset?: number }} [params]
 */
export async function listPatients(params = {}) {
  const { data } = await apiClient.get('patients', { params });
  return data;
}
/**
 * GET /api/v1/patients/:id/queue-history
 * @param {string} patientId
 * @param {{ limit?: number, offset?: number }} [params]
 */
export async function getQueueHistory(patientId, params = {}) {
  const { data } = await apiClient.get(`patients/${patientId}/queue-history`, { params });
  return data;
}

/**
 * GET /api/v1/patients/:id/appointment-history
 * @param {string} patientId
 * @param {{ limit?: number, offset?: number }} [params]
 */
export async function getAppointmentHistory(patientId, params = {}) {
  const { data } = await apiClient.get(`patients/${patientId}/appointment-history`, { params });
  return data;
}

/**
 * PATCH /api/v1/patients/:id
 * @param {string} patientId 
 * @param {object} payload 
 */
export async function updatePatientProfile(patientId, payload) {
  const { data } = await apiClient.patch(`patients/${patientId}`, payload);
  return data;
}
