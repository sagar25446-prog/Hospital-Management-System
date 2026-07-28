/**
 * App constants (roles, API paths, etc.)
 */
export const ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  PATIENT: 'patient',
};

export const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';
