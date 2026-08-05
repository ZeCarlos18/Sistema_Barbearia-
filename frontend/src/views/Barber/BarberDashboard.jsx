import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import BarberHeader from '../../components/BarberHeader/BarberHeader';
import StatsCard from '../../components/StatsCard/StatsCard';
import ScheduleList from '../../components/ScheduleList/ScheduleList';
import BottomNav from '../../components/BottomNav/BottomNav';
import { useBarberData } from '../../hooks/useBarberData';
import { isPastAppointment } from '../../utils/dateHelper';
import '../../styles/Barber/BarberDashboard.css';

export default function BarberDashboard({ onNavigate }) {
  const { barberData, todaySchedule, isLoading, error } = useBarberData();
  const safeBarberData = barberData || { name: '—', avatar: '', totalAppointmentsToday: 0, dailyProfit: 0, remainingAppointments: 0 };
  const location = useLocation();
  const [activeNav, setActiveNav] = useState('home');

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    const section = searchParams.get('section');

    if (section === 'availability' || section === 'agenda')
      setActiveNav('calendar');
    else if (section === 'menu')
      setActiveNav('profile');
    else
      setActiveNav(tab || 'home');
  }, [location]);

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
      <BarberHeader
        name={safeBarberData.name}
        avatar={safeBarberData.avatar}
        onLogoClick={handleLogoClick}
      />

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
        {/* manual booking button removed (cleanup of mock UI) */}
      </section>

      <ScheduleList
        schedule={upcomingSchedule} 
        isLoading={isLoading}
        emptyMessage="Nenhum agendamento pendente para hoje" 
      />

      <BottomNav
        active={activeNav}
        onNavigate={onNavigate}
      />
    </div>
  );
}