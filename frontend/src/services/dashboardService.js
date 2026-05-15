const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

function getToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

export async function fetchAppointmentsByDate(date) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const response = await fetch(`${API_BASE_URL}/api/appointments/date/${date}`, {
    method: 'GET',
    headers
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || 'Erro ao buscar agendamentos');
  }

  return payload.data || [];
}

export async function fetchMyAppointments() {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const response = await fetch(`${API_BASE_URL}/api/appointments/my`, {
    method: 'GET',
    headers
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || 'Erro ao buscar agendamentos');
  }

  return payload.data || [];
}

export async function cancelAppointment(appointmentId) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const response = await fetch(`${API_BASE_URL}/api/appointments/${appointmentId}/cancel`, {
    method: 'PUT',
    headers
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || 'Erro ao cancelar agendamento');
  }

  return payload.data;
}

export async function confirmAppointment(appointmentId) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const response = await fetch(`${API_BASE_URL}/api/appointments/${appointmentId}/confirm`, {
    method: 'POST',
    headers
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || 'Erro ao confirmar agendamento');
  }

  return payload.data;
}
