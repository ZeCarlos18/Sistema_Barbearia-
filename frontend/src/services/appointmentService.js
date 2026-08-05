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

export async function deleteFromHistory(appointmentId) {
  if (!appointmentId) throw new Error('ID do agendamento é obrigatório');

  const payload = await apiFetch(`/api/appointments/${appointmentId}/history`, {
    method: 'DELETE'
  });

  return payload;
}

export async function getManualAvailableTimes(barberId, date) {
  if (!barberId || !date) throw new Error('barberId e date são obrigatórios');
  const payload = await apiFetch(`/api/appointments/manual/available-times/${barberId}?date=${encodeURIComponent(date)}`);
  return payload.data || { barberId, date, availableTimes: [] };
}

export async function createManualBooking({ serviceId, date, time, barberId, clientId, clientName, clientPhone }) {
  const body = { serviceId, date, time, barberId, clientId, clientName, clientPhone };
  const payload = await apiFetch('/api/appointments/manual', {
    method: 'POST',
    body: JSON.stringify(body)
  });
  return payload;
}

