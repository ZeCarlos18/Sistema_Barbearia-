/**
 * appointmentService - Serviço de chamadas API para Agendamentos
 * 
 * Responsabilidades:
 * - Gerenciar requisições relacionadas a agendamentos
 * - Centralizar endpoints da API
 * - Tratamento de erros e tokens
 */

const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Buscar agendamentos do usuário logado
 * @returns {Promise<Array>} Lista de agendamentos do usuário
 * @throws {Error} Erro na requisição
 */
export async function getMyAppointments() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  if (!token) {
    throw new Error('Token não encontrado. Usuário não autenticado.');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/appointments/my`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Erro ao buscar agendamentos: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    throw error;
  }
}

/**
 * Buscar agendamentos passados e futuros
 * @returns {Promise<Object>} { upcoming: Array, past: Array }
 * @throws {Error} Erro na requisição
 */
export async function getMyPastAndFutureAppointments() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  if (!token) {
    throw new Error('Token não encontrado. Usuário não autenticado.');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/appointments/my/past-future`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Erro ao buscar agendamentos: ${response.status}`);
    }

    const data = await response.json();
    return data.data || { upcoming: [], past: [] };
  } catch (error) {
    console.error('Erro ao buscar agendamentos passados/futuros:', error);
    throw error;
  }
}

/**
 * Cancelar agendamento
 * @param {Number} appointmentId - ID do agendamento
 * @returns {Promise<Object>} Resposta da API
 * @throws {Error} Erro na requisição
 */
export async function cancelAppointment(appointmentId) {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  if (!token) {
    throw new Error('Token não encontrado. Usuário não autenticado.');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/cancel`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Erro ao cancelar agendamento: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao cancelar agendamento:', error);
    throw error;
  }
}

/**
 * Deletar agendamento
 * @param {Number} appointmentId - ID do agendamento
 * @returns {Promise<Object>} Resposta da API
 * @throws {Error} Erro na requisição
 */
export async function deleteAppointment(appointmentId) {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  if (!token) {
    throw new Error('Token não encontrado. Usuário não autenticado.');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Erro ao deletar agendamento: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao deletar agendamento:', error);
    throw error;
  }
}
