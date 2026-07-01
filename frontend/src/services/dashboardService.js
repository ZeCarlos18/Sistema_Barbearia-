import { apiFetch } from './apiClient';

export async function fetchAppointmentsByDate(date) {
  const payload = await apiFetch(`/api/appointments/date/${date}`);
  return payload.data || [];
}

export async function confirmAppointment(appointmentId) {
  const payload = await apiFetch(`/api/appointments/${appointmentId}/confirm`, {
    method: 'POST'
  });
  return payload.data;
}