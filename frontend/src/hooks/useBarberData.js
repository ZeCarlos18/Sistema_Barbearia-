import { useCallback, useEffect, useState } from 'react';
import { getBarberDashboard } from '../services/barberService';
import { getStoredUser } from '../utils/authHelper';

function formatTime(value) {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value.slice(0, 5);
  }

  if (value instanceof Date) {
    return value.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return String(value).slice(0, 5);
}

function normalizeDashboardData(payload) {
  const barber = payload?.barber || {};
  const appointments = payload?.appointments || {};
  const todayAppointments = Array.isArray(appointments.today) ? appointments.today : [];
  const statistics = appointments.statistics || {};

  const mappedSchedule = todayAppointments.map((appointment) => ({
    id: appointment.id,
    time: formatTime(appointment.time),
    clientName: appointment.user_name || appointment.clientName || 'Cliente',
    service: appointment.service_name || appointment.service || 'Serviço'
  }));

  const dailyProfitFromAppointments = todayAppointments.reduce((sum, appointment) => {
    const rawValue = appointment.price ?? appointment.service_price ?? appointment.servicePrice ?? 0;
    const numericValue = Number(rawValue);

    return sum + (Number.isFinite(numericValue) ? numericValue : 0);
  }, 0);

  return {
    barberData: {
      id: barber.id ?? null,
      name: barber.name || '',
      avatar: barber.avatar || '',
      totalAppointmentsToday: statistics.totalAppointmentsToday ?? todayAppointments.length,
      dailyProfit: statistics.dailyProfit ?? dailyProfitFromAppointments,
      remainingAppointments: statistics.remainingAppointments ?? todayAppointments.length
    },
    todaySchedule: mappedSchedule
  };
}

export function useBarberData() {
  const [barberData, setBarberData] = useState(null);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadBarberData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const storedUser = getStoredUser();
      const barberId = storedUser?.id;

      if (!barberId) {
        setBarberData(null);
        setTodaySchedule([]);
        setIsLoading(false);
        return;
      }

      const dashboard = await getBarberDashboard(barberId);
      const normalizedDashboard = normalizeDashboardData(dashboard);

      setBarberData(normalizedDashboard.barberData);
      setTodaySchedule(normalizedDashboard.todaySchedule);
    } catch (err) {
      console.warn('Erro ao carregar dashboard do barbeiro:', err);
      setBarberData(null);
      setTodaySchedule([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBarberData();
  }, [loadBarberData]);

  return { 
    barberData, 
    todaySchedule, 
    isLoading, 
    error,
    refetch: loadBarberData
  };
}
