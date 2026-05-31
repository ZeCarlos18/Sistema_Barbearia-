import { apiFetch } from './apiClient';

/**
 * Serviço de API para dados do barbeiro
 * Atualmente vazio, pronto para integração com backend
 */

/**
 * Buscar dados completos do dashboard do barbeiro
 * @param {number} barberId - ID do barbeiro
 * @returns {Promise<Object>} Dados do barbeiro e agendamentos
 * 
 * @example
 * const data = await getBarberDashboard(1);
 * // Retorna: { barberData: {...}, todaySchedule: [...] }
 */
export async function getBarberDashboard(barberId) {
  if (!barberId) {
    throw new Error('ID do barbeiro é obrigatório');
  }

  const payload = await apiFetch(`/api/barber/${barberId}/dashboard`);
  return payload.data;
}

/**
 * Buscar agendamentos de um barbeiro para um dia específico
 * @param {number} barberId - ID do barbeiro
 * @param {string} date - Data no formato YYYY-MM-DD
 * @returns {Promise<Array>} Array de agendamentos
 */
export async function getBarberScheduleByDate(barberId, date) {
  if (!barberId) {
    throw new Error('ID do barbeiro é obrigatório');
  }

  if (!date) {
    throw new Error('Data é obrigatória');
  }

  const payload = await apiFetch(`/api/appointments/schedule/${barberId}/date/${date}`);
  return payload.data;
}

/**
 * Atualizar status de um agendamento
 * @param {number} appointmentId - ID do agendamento
 * @param {string} status - Novo status (confirmado, cancelado, etc)
 * @returns {Promise<Object>} Agendamento atualizado
 */
export async function updateAppointmentStatus(appointmentId, status) {
  if (!appointmentId) {
    throw new Error('ID do agendamento é obrigatório');
  }

  if (!status) {
    throw new Error('Status é obrigatório');
  }

  const payload = await apiFetch(`/api/appointments/${appointmentId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });

  return payload.data;
}