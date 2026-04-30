const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

async function request(path, data) {
  const headers = {
    'Content-Type': 'application/json'
  };

  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(data)
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || 'Erro na requisição');
  }

  return payload;
}

export function login(credentials) {
  return request('/api/auth/login', credentials);
}

export function register(userData) {
  return request('/api/auth/register', userData);
}

export async function logout() {
  try {
    await request('/api/auth/logout', {});
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