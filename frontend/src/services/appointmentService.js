import { apiFetch } from './apiClient';

export async function getMyAppointments() {
  const payload = await apiFetch('/api/appointments/my');
  return payload.data || payload.appointments || [];
}

export async function cancelAppointment(appointmentId) {
  if (!appointmentId) throw new Error('ID do agendamento é obrigatório');

  const payload = await apiFetch(`/api/appointments/${appointmentId}/cancel`, {
    method: 'PUT'
  });

  return payload;
}

