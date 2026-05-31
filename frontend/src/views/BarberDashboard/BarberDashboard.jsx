import React, { useState, useEffect } from 'react';
import BarberHeader from '../../components/BarberHeader/BarberHeader';
import StatsCard from '../../components/StatsCard/StatsCard';
import ScheduleList from '../../components/ScheduleList/ScheduleList';
import BottomNav from '../../components/BottomNav/BottomNav';
import { mockBarberData, mockTodaySchedule } from '../../constants/mockData';
import './BarberDashboard.css';

/**
 * Página principal do dashboard do barbeiro
 * Responsável por coordenar todos os componentes e gerenciar os dados
 * 
 * @returns {JSX.Element} Dashboard completo do barbeiro
 */
function BarberDashboard() {
  // Estado para dados do barbeiro
  const [barberData, setBarberData] = useState({
    name: '',
    avatar: '',
    totalAppointmentsToday: 0,
    dailyProfit: 0,
    remainingAppointments: 0
  });

  // Estado para agendamentos do dia
  const [todaySchedule, setTodaySchedule] = useState([]);

  // Estado para navegação inferior
  const [activeNav, setActiveNav] = useState('home');

  // Estados de carregamento e erro
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Efeito para carregar dados (agora com mock, depois com API)
  useEffect(() => {
    setIsLoading(true);
    try {
      // Simulando delay de carregamento
      setTimeout(() => {
        setBarberData(mockBarberData);
        setTodaySchedule(mockTodaySchedule);
        setIsLoading(false);
      }, 500);
    } catch (err) {
      setError('Erro ao carregar dados do barbeiro');
      setIsLoading(false);
    }
  }, []);

  // Função para lidar com navegação
  const handleNavigate = (item) => {
    setActiveNav(item);
    // Futura integração: redirecionar para página
    console.log('Navegando para:', item);
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
        name={barberData.name}
        avatar={barberData.avatar}
        onNotificationClick={handleNotificationClick}
      />

      {/* Cards de resumo */}
      <section className="stats-section">
        <StatsCard
          value={barberData.totalAppointmentsToday}
          label="Atendimentos hoje"
        />
        <StatsCard
          value={`R$${barberData.dailyProfit}`}
          label="Lucro do dia"
          variant="profit"
        />
        <StatsCard
          value={barberData.remainingAppointments}
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
        activeItem={activeNav}
        onNavigate={handleNavigate}
      />
    </div>
  );
}

export default BarberDashboard;

