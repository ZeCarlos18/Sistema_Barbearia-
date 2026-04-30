const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

function getToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

async function request(path) {
  const headers = {
    'Content-Type': 'application/json'
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || 'Erro na requisicao');
  }

  return payload;
}

export async function fetchServices() {
  const payload = await request('/api/services');
  return payload.data || [];
}

export async function fetchBarbers() {
  const payload = await request('/api/users/barbers');
  return payload.data || [];
}

export async function fetchAvailableTimes(barberId, date) {
  const payload = await request(`/api/available-times?barberId=${barberId}&date=${date}`);
  return payload.data || { availableTimes: [] };
}
