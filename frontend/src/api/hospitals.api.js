import apiClient from './client';

export async function getHospitals(params = {}) {
  const { data } = await apiClient.get('/hospitals', { params });
  return data;
}

export async function getHospital(id) {
  const { data } = await apiClient.get(`/hospitals/${id}`);
  return data;
}

export async function getHospitalDoctors(id) {
  const { data } = await apiClient.get(`/hospitals/${id}/doctors`);
  return data;
}

export async function getCities() {
  const { data } = await apiClient.get('/hospitals/cities');
  return data;
}

export async function getSpecialties() {
  const { data } = await apiClient.get('/hospitals/specialties');
  return data;
}
