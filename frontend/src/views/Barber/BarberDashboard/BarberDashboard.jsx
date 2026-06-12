import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BarberHeader from '../../../components/BarberHeader/BarberHeader';
import StatsCard from '../../../components/StatsCard/StatsCard';
import ScheduleList from '../../../components/ScheduleList/ScheduleList';
import BottomNav from '../../../components/BottomNav/BottomNav';
import { mockBarberData } from '../../../constants/mockData';
import { useBarberData } from '../../../hooks/useBarberData';
import './BarberDashboard.css';

/**
 * Página principal do dashboard do barbeiro
 * Responsável por coordenar todos os componentes e gerenciar os dados
 * 
 * @returns {JSX.Element} Dashboard completo do barbeiro
 */
function BarberDashboard() {
  const { barberData, todaySchedule, isLoading, error } = useBarberData();
  const safeBarberData = barberData || mockBarberData;
  const navigate = useNavigate();
  const location = useLocation();

  // Estado para navegação inferior
  const [activeNav, setActiveNav] = useState('home');

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    setActiveNav(tab || 'home');
  }, [location.search]);

  // Função para lidar com navegação
  const handleNavigate = (item) => {
    setActiveNav(item);

    if (item === 'home') {
      navigate('/barber-dashboard');
      return;
    }

    if (item === 'dashboard') {
      navigate('/dashboard-barbeiro');
      return;
    }

    if (item === 'search') {
      navigate('/barber-dashboard?tab=search');
      return;
    }

    if (item === 'calendar') {
      navigate('/barber-chief?section=availability');
      return;
    }

    if (item === 'profile') {
      navigate('/barber-chief?section=menu');
      return;
    }

    navigate(`/barber-dashboard?tab=${item}`);
  };

  // Função para lidar com clique em notificações
  const handleNotificationClick = () => {
    console.log('Notificação clicada');
    // Futura integração: mostrar notificações
  };

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
          value={safeBarberData.remainingAppointments}
          label="Restantes"
          variant="remaining"
        />
      </section>

      {/* Lista de agendamentos */}
      <ScheduleList
        schedule={todaySchedule}
        isLoading={isLoading}
        emptyMessage="Nenhum agendamento para hoje"
      />

      {/* Navegação inferior */}
      <BottomNav
        active={activeNav}
        onNavigate={handleNavigate}
      />
    </div>
  );
}

export default BarberDashboard;

