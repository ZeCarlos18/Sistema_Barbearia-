import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import BarberHeader from '../../components/BarberHeader/BarberHeader';
import StatsCard from '../../components/StatsCard/StatsCard';
import ScheduleList from '../../components/ScheduleList/ScheduleList';
import BottomNav from '../../components/BottomNav/BottomNav';
import { mockBarberData } from '../../constants/mockData';
import { useBarberData } from '../../hooks/useBarberData';
import { isPastAppointment } from '../../utils/dateHelper';
import '../../styles/Barber/BarberDashboard.css';

/**
 * Página principal do dashboard do barbeiro
 * Responsável por coordenar todos os componentes e gerenciar os dados
 * * @returns {JSX.Element} Dashboard completo do barbeiro
 */
export default function BarberDashboard({ onNavigate }) {
  const { barberData, todaySchedule, isLoading, error } = useBarberData();
  const safeBarberData = barberData || mockBarberData;
  const location = useLocation();

  // Estado para navegação inferior
  const [activeNav, setActiveNav] = useState('home');

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    setActiveNav(tab || 'home');
  }, [location.search]);

  // Função para lidar com clique em notificações
  const handleNotificationClick = () => {
    console.log('Notificação clicada');
    // Futura integração: mostrar notificações
  };

  // Função para lidar com clique na logo/avatar (navegar para dashboard)
  const handleLogoClick = () => {
    onNavigate?.('dashboard');
  };

  const upcomingSchedule = useMemo(() => {
    if (!todaySchedule) return [];

    const todayStr = new Date().toISOString().split('T')[0];

    return todaySchedule
      .filter(apt => {
        const aptDate = apt.date || todayStr;
        return !isPastAppointment(aptDate, apt.time); 
      })
      .sort((a, b) => {
        const timeA = a.time ? String(a.time).substring(0, 8) : '00:00:00';
        const timeB = b.time ? String(b.time).substring(0, 8) : '00:00:00';
        return timeA.localeCompare(timeB);
      });
  }, [todaySchedule]);

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="barber-dashboard">
      {/* Cabeçalho */}
      <BarberHeader
        name={safeBarberData.name}
        avatar={safeBarberData.avatar}
        onNotificationClick={handleNotificationClick}
        onLogoClick={handleLogoClick}
      />

      {/* Cards de resumo */}
      <section className="stats-section">
        <StatsCard
          value={safeBarberData.totalAppointmentsToday}
          label="Atendimentos hoje"
        />
        <StatsCard
          value={`R$${safeBarberData.dailyProfit}`}
          label="Lucro do dia"
          variant="profit"
        />
        <StatsCard
          value={upcomingSchedule.length} 
          label="Restantes"
          variant="remaining"
        />
      </section>

      {/* Lista de agendamentos */}
      <ScheduleList
        schedule={upcomingSchedule} 
        isLoading={isLoading}
        emptyMessage="Nenhum agendamento pendente para hoje" 
      />

      {/* Navegação inferior */}
      <BottomNav
        active={activeNav}
        onNavigate={onNavigate}
      />
    </div>
  );
}