import React from 'react';
import { FiBell, FiCalendar, FiHome, FiLogOut, FiPlus, FiUser } from 'react-icons/fi';
import { fetchAppointmentsByDate, confirmAppointment } from '../../services/dashboardService';
import { fetchServices } from '../../services/bookingService';
import './BarberChief.css';

function getStoredUser() {
  const stored = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (!stored) {
    return {};
  }

  try {
    return JSON.parse(stored);
  } catch (error) {
    return {};
  }
}

export default function BarberChief({ onOpenCreate, onNavigate, onLogout }) {
  const user = getStoredUser();
  const displayName = user.name || 'Lucas';
  const barberId = user.id;
  const [activeNav, setActiveNav] = React.useState('home');
  const [selectedDate, setSelectedDate] = React.useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate()
    ).padStart(2, '0')}`;
  });
  const [metrics, setMetrics] = React.useState({
    appointments: 0,
    profit: 0,
    complaints: 0
  });
  const [agendaItems, setAgendaItems] = React.useState([]);
  const [status, setStatus] = React.useState({ loading: false, error: '' });
  const [confirmingId, setConfirmingId] = React.useState(null);

  React.useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setStatus({ loading: true, error: '' });
      try {
        const [appointments, services] = await Promise.all([
          fetchAppointmentsByDate(selectedDate),
          fetchServices()
        ]);

        if (!isMounted) return;

        // Filtrar apenas agendamentos do barbeiro logado
        const barberAppointments = Array.isArray(appointments)
          ? appointments.filter(apt => apt.barber_id === barberId)
          : [];

        const serviceMap = new Map(
          services.map((service) => [String(service.id), Number(service.price) || 0])
        );

        const activeAppointments = barberAppointments.filter(
          (item) => String(item.status || '').toLowerCase() !== 'cancelled'
        );
        const completedAppointments = barberAppointments.filter((item) =>
          ['confirmed', 'completed'].includes(String(item.status || '').toLowerCase())
        );
        const cancelledAppointments = barberAppointments.filter(
          (item) => String(item.status || '').toLowerCase() === 'cancelled'
        );

        const profitValue = completedAppointments.reduce((total, item) => {
          const price = serviceMap.get(String(item.service_id)) || 0;
          return total + price;
        }, 0);

        setMetrics({
          appointments: activeAppointments.length,
          profit: Math.round(profitValue),
          complaints: cancelledAppointments.length
        });

        setAgendaItems(
          activeAppointments.map((item) => ({
            id: item.id,
            time: String(item.time || '').slice(0, 5),
            name: item.user_name || 'Cliente',
            service: item.service_name || 'Serviço',
            status: item.status || 'pending'
          }))
        );
        setStatus({ loading: false, error: '' });
      } catch (error) {
        if (!isMounted) return;
        setStatus({ loading: false, error: error.message || 'Erro ao carregar painel.' });
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [selectedDate, barberId]);

  function handleNavClick(id) {
    if (id === 'create') {
      onOpenCreate?.();
      return;
    }

    setActiveNav(id);
    onNavigate?.(id);
  }

  function changeDate(days) {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const current = new Date(year, month - 1, day);
    current.setDate(current.getDate() + days);
    const newDate = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(
      current.getDate()
    ).padStart(2, '0')}`;
    setSelectedDate(newDate);
  }

  function formatDateDisplay(dateStr) {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(year, month - 1, day);
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    return `${weekdays[date.getDay()]}, ${day} de ${months[date.getMonth()]}`;
  }

  async function handleConfirmAppointment(appointmentId) {
    setConfirmingId(appointmentId);
    try {
      await confirmAppointment(appointmentId);
      // Recarregar agendamentos após confirmação
      setAgendaItems(prevItems =>
        prevItems.map(item =>
          item.id === appointmentId ? { ...item, status: 'confirmed' } : item
        )
      );
    } catch (error) {
      alert(`Erro ao confirmar: ${error.message}`);
    } finally {
      setConfirmingId(null);
    }
  }

  return (
    <div className="chief-page">
      <div className="chief-stage">
        <span className="chief-stage-title">PAINEL BARBEIRO</span>

        <div className="chief-phone">
          <div className="chief-shell">
            <header className="chief-header">
              <div className="chief-profile">
                <div className="chief-avatar" aria-hidden="true" />
                <div className="chief-greeting">
                  <span>Bem-vindo</span>
                  <strong>{displayName}</strong>
                </div>
              </div>

              <div className="chief-actions">
                <button className="chief-notify" type="button" aria-label="Notificações">
                  <FiBell size={18} />
                </button>
                <button className="chief-logout" type="button" onClick={onLogout}>
                  <FiLogOut size={18} />
                </button>
              </div>
            </header>

            <main className="chief-main">
              <section className="chief-metrics">
                <div className="chief-metric-card">
                  <span className="chief-metric-value">{metrics.appointments}</span>
                  <span className="chief-metric-label">Atendimentos hoje</span>
                </div>
                <div className="chief-metric-card">
                  <span className="chief-metric-value">R${metrics.profit}</span>
                  <span className="chief-metric-label">Lucro do dia</span>
                </div>
                <div className="chief-metric-card">
                  <span className="chief-metric-value">{metrics.complaints}</span>
                  <span className="chief-metric-label">Reclamações</span>
                </div>
              </section>

              <section className="chief-agenda">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <button 
                    type="button"
                    onClick={() => changeDate(-1)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: 'transparent',
                      border: '1px solid #d4af37',
                      color: '#d4af37',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    ← Anterior
                  </button>
                  <h2 className="chief-agenda-title">{formatDateDisplay(selectedDate)}</h2>
                  <button 
                    type="button"
                    onClick={() => changeDate(1)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: 'transparent',
                      border: '1px solid #d4af37',
                      color: '#d4af37',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Próximo →
                  </button>
                </div>
                <div className="chief-agenda-list">
                  {status.loading ? (
                    <div className="chief-empty">Carregando agenda...</div>
                  ) : null}
                  {status.error ? (
                    <div className="chief-empty">{status.error}</div>
                  ) : null}
                  {!status.loading && !status.error && agendaItems.length === 0 ? (
                    <div className="chief-empty">Nenhum agendamento nesta data.</div>
                  ) : null}
                  {!status.loading && !status.error
                    ? agendaItems.map((item) => (
                        <article key={item.id} className="chief-agenda-item" style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1 }}>
                            <span className="chief-agenda-time">{item.time}</span>
                            <div className="chief-agenda-info">
                              <strong>{item.name}</strong>
                              <span>{item.service}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              backgroundColor: item.status === 'pending' ? '#fed7aa' : '#bbf7d0',
                              color: item.status === 'pending' ? '#7c2d12' : '#065f46'
                            }}>
                              {item.status === 'pending' ? 'Pendente' : 'Confirmado'}
                            </span>
                            {item.status === 'pending' && (
                              <button
                                type="button"
                                onClick={() => handleConfirmAppointment(item.id)}
                                disabled={confirmingId === item.id}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#d4af37',
                                  color: '#1a1a1a',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: confirmingId === item.id ? 'not-allowed' : 'pointer',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  opacity: confirmingId === item.id ? 0.6 : 1
                                }}
                              >
                                {confirmingId === item.id ? 'Confirmando...' : 'Confirmar'}
                              </button>
                            )}
                          </div>
                        </article>
                      ))
                    : null}
                </div>
              </section>
            </main>

            <nav className="chief-nav" aria-label="Navegacao principal">
              <button
                type="button"
                className={`chief-nav-btn ${activeNav === 'home' ? 'is-active' : ''}`}
                onClick={() => handleNavClick('home')}
              >
                <FiHome size={18} />
              </button>

              <button
                type="button"
                className={`chief-nav-btn ${activeNav === 'agenda' ? 'is-active' : ''}`}
                onClick={() => handleNavClick('agenda')}
              >
                <FiCalendar size={18} />
              </button>

              <button
                type="button"
                className="chief-nav-btn chief-nav-btn--plus"
                onClick={() => handleNavClick('create')}
                aria-label="Cadastrar barbeiro"
              >
                <FiPlus size={22} />
              </button>

              <button
                type="button"
                className={`chief-nav-btn ${activeNav === 'profile' ? 'is-active' : ''}`}
                onClick={() => handleNavClick('profile')}
              >
                <FiUser size={18} />
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
