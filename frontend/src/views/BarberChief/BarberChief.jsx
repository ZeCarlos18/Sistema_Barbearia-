import React from 'react';
import { FiBell, FiCalendar, FiHome, FiLogOut, FiPlus, FiUser } from 'react-icons/fi';
import { fetchAppointmentsByDate } from '../../services/dashboardService';
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
  const [activeNav, setActiveNav] = React.useState('home');
  const [metrics, setMetrics] = React.useState({
    appointments: 0,
    profit: 0,
    complaints: 0
  });
  const [agendaItems, setAgendaItems] = React.useState([]);
  const [status, setStatus] = React.useState({ loading: false, error: '' });

  React.useEffect(() => {
    let isMounted = true;
    const today = new Date();
    const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate()
    ).padStart(2, '0')}`;

    async function loadDashboard() {
      setStatus({ loading: true, error: '' });
      try {
        const [appointments, services] = await Promise.all([
          fetchAppointmentsByDate(date),
          fetchServices()
        ]);

        if (!isMounted) return;

        const serviceMap = new Map(
          services.map((service) => [String(service.id), Number(service.price) || 0])
        );

        const activeAppointments = appointments.filter(
          (item) => String(item.status || '').toLowerCase() !== 'cancelled'
        );
        const completedAppointments = appointments.filter((item) =>
          ['confirmed', 'completed'].includes(String(item.status || '').toLowerCase())
        );
        const cancelledAppointments = appointments.filter(
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
            service: item.service_name || 'Servico'
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
  }, []);

  function handleNavClick(id) {
    if (id === 'create') {
      onOpenCreate?.();
      return;
    }

    setActiveNav(id);
    onNavigate?.(id);
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
                <h2 className="chief-agenda-title">AGENDA DO DIA</h2>
                <div className="chief-agenda-list">
                  {status.loading ? (
                    <div className="chief-empty">Carregando agenda...</div>
                  ) : null}
                  {status.error ? (
                    <div className="chief-empty">{status.error}</div>
                  ) : null}
                  {!status.loading && !status.error && agendaItems.length === 0 ? (
                    <div className="chief-empty">Nenhum agendamento hoje.</div>
                  ) : null}
                  {!status.loading && !status.error
                    ? agendaItems.map((item) => (
                        <article key={item.id} className="chief-agenda-item">
                          <span className="chief-agenda-time">{item.time}</span>
                          <div className="chief-agenda-info">
                            <strong>{item.name}</strong>
                            <span>{item.service}</span>
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
