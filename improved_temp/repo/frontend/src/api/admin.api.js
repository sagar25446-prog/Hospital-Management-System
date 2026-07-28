/**
 * Admin API: dashboard metrics, active queues, doctor workload, stats.
 */
import apiClient from './client';

/**
 * GET /api/v1/admin/dashboard
 * @param {string} [date] - Optional YYYY-MM-DD; defaults to today
 */
export async function getDashboard(date) {
  const params = date ? { date } : {};
  const { data } = await apiClient.get('admin/dashboard', { params });
  return data;
}

/**
 * GET /api/v1/admin/queues
 * @param {string} [date] - Optional YYYY-MM-DD
 */
export async function getQueues(date) {
  const params = date ? { date } : {};
  const { data } = await apiClient.get('admin/queues', { params });
  return data;
}

/**
 * GET /api/v1/admin/doctors/workload
 * @param {string} [date] - Optional YYYY-MM-DD
 */
export async function getDoctorsWorkload(date) {
  const params = date ? { date } : {};
  const { data } = await apiClient.get('admin/doctors/workload', { params });
  return data;
}

/**
 * POST /api/v1/admin/staff - Create reception/admin user
 */
export async function createStaff(payload) {
  const { data } = await apiClient.post('admin/staff', payload);
  return data;
}

/**
 * GET /api/v1/admin/staff - List staff users (reception/admin)
 */
export async function listStaff() {
  const { data } = await apiClient.get('admin/staff');
  return data;
}
