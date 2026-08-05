// frontend/src/services/apiClient.js
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

export function getToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

// No mock handler: all calls go to real backend.

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

  // Try to parse JSON safely
  let payload = null;
  try {
    payload = await response.json();
  } catch (err) {
    // If no JSON, provide a generic payload
    payload = { success: response.ok };
  }

  if (!response.ok) {
    const msg = (payload && payload.message) || `Erro na requisição: ${response.status}`;
    throw new Error(msg);
  }

  return payload;
}