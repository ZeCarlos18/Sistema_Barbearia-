import { apiFetch } from './apiClient';

export async function fetchBarberSchedule(barberId, date) {
  const payload = await apiFetch(`/api/appointments/schedule/${barberId}/date/${date}`);
  return payload.data?.appointments || [];
}

export async function fetchBarberUnavailabilities(barberId) {
  const payload = await apiFetch(`/api/unavailabilities/barber/${barberId}`);
  return payload.data || [];
}

export async function createUnavailability(unavailabilityData) {
  const payload = await apiFetch('/api/unavailabilities', {
    method: 'POST',
    body: JSON.stringify(unavailabilityData)
  });
  return payload.data;
}

export async function updateAppointmentStatus(appointmentId, status) {
  const payload = await apiFetch(`/api/appointments/${appointmentId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
  return payload.data;
}
