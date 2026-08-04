import { apiFetch } from './apiClient';

export function login(credentials) {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
}

export function register(userData) {
  return apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
}

export async function logout() {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    return { success: true };
  } catch (error) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    throw error;
  }
}

export function checkRecoverEmail(email) {
  return apiFetch('/api/auth/recover/check-email', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
}

export function resetPasswordByEmail(payload) {
  return apiFetch('/api/auth/recover/reset', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}