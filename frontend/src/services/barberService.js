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

