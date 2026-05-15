const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

function getToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || 'Erro na requisicao');
  }

  return payload;
}

export async function getProfile() {
  const payload = await request('/api/users/profile', { method: 'GET' });
  return payload.user;
}

export async function updateProfile(data) {
  const payload = await request('/api/users/profile', {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  return payload.user;
}

export async function fetchMyAppointments() {
  const payload = await request('/api/appointments/my', { method: 'GET' });
  return payload.data || [];
}
