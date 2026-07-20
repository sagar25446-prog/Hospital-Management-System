/**
 * Doctors API: list, get profile, schedule, etc.
 */
import apiClient from './client';

/**
 * GET /api/v1/doctors - List doctors (optional: specialization, is_available, has_active_queue, date, limit, offset)
 */
export async function listDoctors(params = {}) {
  const { data } = await apiClient.get('doctors', { params });
  return data;
}

/**
 * POST /api/v1/doctors - Create a new doctor (Admin only)
 */
export async function createDoctor(payload) {
  const { data } = await apiClient.post('doctors', payload);
  return data;
}

/**
 * GET /api/v1/doctors/:id - Doctor profile (first_name, last_name, specialization, etc.)
 */
export async function getDoctorProfile(id) {
  const { data } = await apiClient.get(`/doctors/${id}`);
  return data;
}

/**
 * PATCH /api/v1/doctors/:id - Update doctor profile
 */
export async function updateDoctor(id, payload) {
  const { data } = await apiClient.patch(`/doctors/${id}`, payload);
  return data;
}
