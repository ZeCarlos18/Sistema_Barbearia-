import { apiFetch } from './apiClient';

export async function getMyNotifications() {
  const payload = await apiFetch('/api/notifications');
  return payload.data || [];
}

export async function getUnreadCount() {
  const payload = await apiFetch('/api/notifications/unread');
  return payload.unreadCount || 0;
}

export async function markNotificationAsRead(id) {
  return await apiFetch(`/api/notifications/${id}/read`, { method: 'PUT' });
}

export async function deleteNotification(id) {
  return await apiFetch(`/api/notifications/${id}`, { method: 'DELETE' });
}
