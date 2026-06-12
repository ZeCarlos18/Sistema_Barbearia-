import { apiFetch } from './apiClient';

export async function createBarber(data) {
  return apiFetch('/api/admin/barbers', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function fetchBarbers() {
  const payload = await apiFetch('/api/admin/barbers');
  return payload.barbers || [];
}

export async function fetchBarberDetails(barberId) {
  if (!barberId) {
    throw new Error('ID do barbeiro é obrigatório');
  }

  const payload = await apiFetch(`/api/admin/barbers/${barberId}`);
  return payload.data || null;
}

export async function deactivateBarber(barberId) {
  if (!barberId) {
    throw new Error('ID do barbeiro é obrigatório');
  }

  const payload = await apiFetch(`/api/admin/barbers/${barberId}/deactivate`, {
    method: 'PUT',
    body: JSON.stringify({ confirm: true })
  });

  return payload.barber || payload.data || null;
}