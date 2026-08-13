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

/**
 * Solicita o envio do link de recuperação para o e-mail informado.
 * A API sempre responde com sucesso, exista o e-mail ou não.
 */
export function requestPasswordReset(email) {
  return apiFetch('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
}

/**
 * Verifica se o token vindo do link do e-mail ainda é válido.
 */
export function validateResetToken(token) {
  return apiFetch(`/api/auth/reset-password/${encodeURIComponent(token)}`, {
    method: 'GET'
  });
}

/**
 * Define a nova senha usando o token recebido por e-mail.
 * @param {Object} payload - {token, newPassword, confirmPassword}
 */
export function resetPassword(payload) {
  return apiFetch('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}