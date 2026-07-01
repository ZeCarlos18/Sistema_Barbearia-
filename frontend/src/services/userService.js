import { apiFetch } from './apiClient';

export async function getProfile() {
  const payload = await apiFetch('/api/users/profile');
  return payload.user;
}

export async function updateProfile(data) {
  const payload = await apiFetch('/api/users/profile', {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  return payload.user;
}