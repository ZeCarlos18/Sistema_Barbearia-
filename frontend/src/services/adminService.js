import { apiFetch } from './apiClient';

export async function createBarber(data) {
  return apiFetch('/api/admin/barbers', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}