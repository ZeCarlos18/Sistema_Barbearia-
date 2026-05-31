import { useState, useEffect } from 'react';
import { mockBarberData, mockTodaySchedule } from '../constants/mockData';
// import { getBarberDashboard } from '../services/barberService'; // Futuro

/**
 * Hook customizado para gerenciar dados do barbeiro
 * Atualmente usa dados mockados, mas preparado para integração com API
 * 
 * @returns {Object} Objeto com dados e estados do barbeiro
 * @returns {Object} .barberData - Dados do barbeiro (nome, avatar, stats)
 * @returns {Array} .todaySchedule - Agendamentos de hoje
 * @returns {boolean} .isLoading - Indica se está carregando
 * @returns {string|null} .error - Mensagem de erro, se houver
 * 
 * @example
 * const { barberData, todaySchedule, isLoading, error } = useBarberData();
 */
export function useBarberData() {
  const [barberData, setBarberData] = useState(null);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBarberData();
  }, []);

  const loadBarberData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // AGORA: Usando dados mockados
      // FUTURO: Descomente e use chamada API
      // const response = await getBarberDashboard();
      // setBarberData(response.barberData);
      // setTodaySchedule(response.todaySchedule);
      
      // Simulando delay de rede
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setBarberData(mockBarberData);
      setTodaySchedule(mockTodaySchedule);
    } catch (err) {
      setError(err.message || 'Erro ao carregar dados do barbeiro');
    } finally {
      setIsLoading(false);
    }
  };

  return { 
    barberData, 
    todaySchedule, 
    isLoading, 
    error,
    refetch: loadBarberData // Permitir recarregar manualmente
  };
}
