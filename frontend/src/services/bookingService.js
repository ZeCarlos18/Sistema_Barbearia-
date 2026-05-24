import { apiFetch } from './apiClient';

export async function fetchServices() {
  const payload = await apiFetch('/api/services');
  return payload.data || [];
}

export async function fetchBarbers() {
  const payload = await apiFetch('/api/users/barbers');
  return payload.data || [];
}

export async function fetchAvailableTimes(barberId, date) {
  const payload = await apiFetch(`/api/available-times?barberId=${barberId}&date=${date}`);
  return payload.data || { availableTimes: [] };
}

export async function createAppointment(appointmentData) {
  const payload = await apiFetch('/api/appointments', {
    method: 'POST',
    body: JSON.stringify(appointmentData)
  });
  return payload.data;
}