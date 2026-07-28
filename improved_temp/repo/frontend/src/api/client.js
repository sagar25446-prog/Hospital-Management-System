/**
 * Axios instance for API requests.
 * - baseURL from env or proxy
 * - Request: withCredentials to attach cookies automatically
 * - Response: on 401 try refresh, then retry; on refresh failure trigger onAuthFailure
 */

import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '';
const apiBase = baseURL ? `${baseURL.replace(/\/$/, '')}/api/v1` : '/api/v1';

export const apiClient = axios.create({
  baseURL: apiBase,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let onAuthFailure = () => {};

export function setAuthHelpers({ onAuthFailure: onFail }) {
  onAuthFailure = onFail ?? (() => {});
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh') {
      originalRequest._retry = true;
      try {
        await axios.post(
          `${apiBase}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        return apiClient(originalRequest);
      } catch (_) {
        onAuthFailure();
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
