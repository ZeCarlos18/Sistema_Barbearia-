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
  // Futuro: implementar chamada para /api/barber/:id/dashboard
  // return apiFetch(`/api/barber/${barberId}/dashboard`);
  throw new Error('Método não implementado ainda');
}

/**
 * Buscar agendamentos de um barbeiro para um dia específico
 * @param {number} barberId - ID do barbeiro
 * @param {string} date - Data no formato YYYY-MM-DD
 * @returns {Promise<Array>} Array de agendamentos
 */
export async function getBarberScheduleByDate(barberId, date) {
  // Futuro: implementar chamada para /api/barber/:id/schedule
  // return apiFetch(`/api/barber/${barberId}/schedule?date=${date}`);
  throw new Error('Método não implementado ainda');
}

/**
 * Atualizar status de um agendamento
 * @param {number} appointmentId - ID do agendamento
 * @param {string} status - Novo status (confirmado, cancelado, etc)
 * @returns {Promise<Object>} Agendamento atualizado
 */
export async function updateAppointmentStatus(appointmentId, status) {
  // Futuro: implementar chamada PUT para /api/appointments/:id/status
  throw new Error('Método não implementado ainda');
}