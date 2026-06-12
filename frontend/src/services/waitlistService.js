import { apiFetch } from './apiClient';

export async function createWaitlistEntry({ barberId, serviceId, date, time }) {
  const payload = await apiFetch('/api/waitlist', {
    method: 'POST',
    body: JSON.stringify({ barberId, serviceId, date, time })
  });
  return { success: payload.success, position: payload.data?.position, ...payload.data };
}

export async function acceptWaitlistEntry(id) {
  const payload = await apiFetch(`/api/waitlist/${id}/accept`, { method: 'PUT' });
  return payload;
}

export async function refuseWaitlistEntry(id) {
  const payload = await apiFetch(`/api/waitlist/${id}/refuse`, { method: 'PUT' });
  return payload;
}

export async function getMyWaitlist() {
  const payload = await apiFetch('/api/waitlist/my');
  return payload.data || [];
}

export async function getWaitlistPosition(id) {
  const payload = await apiFetch(`/api/waitlist/${id}/position`);
  return payload.data;
}

export async function cancelWaitlistEntry(id) {
  const payload = await apiFetch(`/api/waitlist/${id}/cancel`, { method: 'PUT' });
  return payload;
}

// BARBER WAITLIST MANAGEMENT
export async function getWaitlistSlots(barberId, date) {
  const payload = await apiFetch(
    `/api/waitlist/barber/${barberId}/date/${date}/slots`
  );

  return payload.data || [];
}

export async function getSlotWaitlist(barberId, date, time) {
  const payload = await apiFetch(
    `/api/waitlist/barber/${barberId}/date/${date}/time/${time}`
  );

  return payload.data;
}

export async function savePendingPositions(
  barberId,
  date,
  time,
  positions
) {
  return await apiFetch(
    `/api/waitlist/barber/${barberId}/date/${date}/time/${time}/reorder`,
    {
      method: 'POST',
      body: JSON.stringify({ positions })
    }
  );
}

export async function confirmReorder(
  barberId,
  date,
  time
) {
  return await apiFetch(
    `/api/waitlist/barber/${barberId}/date/${date}/time/${time}/confirm-reorder`,
    {
      method: 'POST'
    }
  );
}

export async function cancelPendingReorder(
  barberId,
  date,
  time
) {
  return await apiFetch(
    `/api/waitlist/barber/${barberId}/date/${date}/time/${time}/pending`,
    {
      method: 'DELETE'
    }
  );
}
