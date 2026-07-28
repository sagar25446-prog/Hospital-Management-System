/**
 * Auth API. Login, register, refresh, logout, getMe.
 * Tokens are managed via httpOnly cookies — no manual token passing needed.
 */
import apiClient from './client';

export async function login(credentials) {
  const { data } = await apiClient.post('auth/login', credentials);
  return data;
}

export async function register(payload) {
  const { data } = await apiClient.post('auth/register', payload);
  return data;
}

export async function googleLogin(idToken) {
  const { data } = await apiClient.post('auth/google', { idToken });
  return data;
}

export async function refresh() {
  const { data } = await apiClient.post('auth/refresh');
  return data;
}

export async function logout() {
  await apiClient.post('auth/logout');
}

export async function getMe() {
  const { data } = await apiClient.get('auth/me');
  return data;
}
