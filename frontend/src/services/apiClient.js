// frontend/src/services/apiClient.js
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

export function getToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

export async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || 'Erro na requisição');
    }
  return payload;
}