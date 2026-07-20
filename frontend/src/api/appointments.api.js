/**
 * Appointments API: book, list, get, update, cancel
 */
import apiClient from './client';

export async function bookAppointment(payload) {
  const { data } = await apiClient.post('appointments', payload);
  return data;
}

export async function getDoctorAppointments(doctorId, params = {}) {
  const { data } = await apiClient.get(`appointments/doctors/${doctorId}`, { params });
  return data;
}

export async function getPatientAppointments(patientId, params = {}) {
  const { data } = await apiClient.get(`appointments/patients/${patientId}`, { params });
  return data;
}

export async function getAppointment(id) {
  const { data } = await apiClient.get(`appointments/${id}`);
  return data;
}

export async function updateAppointmentStatus(id, status) {
  const { data } = await apiClient.patch(`appointments/${id}/status`, { status });
  return data;
}

export async function cancelAppointment(id) {
  const { data } = await apiClient.post(`appointments/${id}/cancel`);
  return data;
}
