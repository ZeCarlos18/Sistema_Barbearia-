import React from 'react';
import './Home.css';
import banner from '../../assets/image.png';
import BottomNav from '../../components/BottomNav/BottomNav';
import { FiTrash2 } from 'react-icons/fi';
import { fetchMyAppointments, cancelAppointment } from '../../services/dashboardService';

function translateStatus(status) {
  const statusMap = {
    'pending': 'Pendente',
    'confirmed': 'Confirmado',
    'cancelled': 'Cancelado'
  };
  return statusMap[status] || status;
}

export default function Home({ onStartBooking, onNavigate }) {
  const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user') || '{}';
  const user = JSON.parse(storedUser);
  const [isCancelModalOpen, setIsCancelModalOpen] = React.useState(false);
  const [appointmentCanceled, setAppointmentCanceled] = React.useState(false);
  const [nextAppointment, setNextAppointment] = React.useState(null);
  const [appointmentId, setAppointmentId] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [cancelError, setCancelError] = React.useState('');
  const [canceling, setCanceling] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

async function loadAppointment() {
      try {
        const now = new Date();
        
        const appointments = await fetchMyAppointments();
        
        if (isMounted && Array.isArray(appointments) && appointments.length > 0) {
          // Filtrar agendamentos não cancelados e a partir de AGORA (data e hora)
          const futureAppointments = appointments.filter(apt => {
            if (apt.status === 'cancelled') return false;
            
            // Limpa a data que vem do MySQL (pega apenas o YYYY-MM-DD)
            const dateStr = String(apt.date).split('T')[0];
            const timeStr = String(apt.time).slice(0, 5); // Pega apenas HH:mm
            
            // Cria um objeto Date exato do agendamento
            const appointmentDate = new Date(`${dateStr}T${timeStr}:00`);
            
            return appointmentDate >= now;
          });

          if (futureAppointments.length > 0) {
            // Ordenar de forma CRESCENTE (o mais próximo primeiro)
            futureAppointments.sort((a, b) => {
              const dateStrA = String(a.date).split('T')[0];
              const timeStrA = String(a.time).slice(0, 5);
              const dateA = new Date(`${dateStrA}T${timeStrA}:00`);
              
              const dateStrB = String(b.date).split('T')[0];
              const timeStrB = String(b.time).slice(0, 5);
              const dateB = new Date(`${dateStrB}T${timeStrB}:00`);
              
              return dateA - dateB;
            });

            const appointment = futureAppointments[0];
            setAppointmentId(appointment.id);
            
            // Formatar a data para exibição
            const [year, month, day] = String(appointment.date).split('T')[0].split('-');
            const displayDate = new Date(year, month - 1, day);
            
            setNextAppointment({
              status: translateStatus(appointment.status) || 'Pendente',
              service: appointment.service_name || 'Serviço',
              barber: appointment.barber_name || 'Barbeiro',
              date: displayDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }),
              time: String(appointment.time || '').slice(0, 5)
            });
          }
        }
      } catch (error) {
        console.error('Erro ao carregar agendamento:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadAppointment();
    return () => { isMounted = false; };
  }, []);

  function openCancelModal() {
    setIsCancelModalOpen(true);
  }

  function closeCancelModal() {
    setIsCancelModalOpen(false);
  }

  async function confirmCancelAppointment() {
    setCancelError('');
    setCanceling(true);

    try {
      if (!appointmentId) {
        throw new Error('ID do agendamento não encontrado');
      }

      await cancelAppointment(appointmentId);

      setAppointmentCanceled(true);
      setIsCancelModalOpen(false);
      setNextAppointment(null);
      setAppointmentId(null);
    } catch (error) {
      setCancelError(error.message || 'Erro ao cancelar agendamento');
    } finally {
      setCanceling(false);
    }
  }

  return (
    <div className="home-page">
      <div className="home-phone">
        <div className="home-shell">
          <header className="home-header">
            <div className="home-profile">
              <div className="home-avatar" aria-hidden="true" />
              <div className="home-greeting">
                <span>Bem-vindo</span>
                <strong>{user.name || 'João'}</strong>
              </div>
            </div>

            <button className="home-notification-btn" type="button" aria-label="Notificações">
              🔔
            </button>
          </header>

          <main className="home-main">
            <section className="home-section">
              <h2 className="home-section-title">Seu próximo corte</h2>

              {loading ? (
                <div className="appointment-empty">Carregando agendamento...</div>
              ) : !appointmentCanceled && nextAppointment ? (
                <article className="appointment-card">
                  <button
                    type="button"
                    className="appointment-delete"
                    onClick={openCancelModal}
                    aria-label="Cancelar agendamento"
                  >
                    <FiTrash2 size={18} />
                  </button>

                  <div className="appointment-badge">
                    <span className="appointment-dot" />
                    {nextAppointment.status}
                  </div>

                  <div className="appointment-grid">
                    <div>
                      <h3>{nextAppointment.service}</h3>
                      <p>{nextAppointment.barber}</p>
                    </div>

                    <div className="appointment-time">
                      <span>{nextAppointment.date}</span>
                      <strong>{nextAppointment.time}</strong>
                    </div>
                  </div>
                </article>
              ) : (
                <div className="appointment-empty">
                  Você não possui agendamentos ativos no momento.
                </div>
              )}
            </section>

            <section className="home-section">
              <h2 className="home-section-title">Ainda não agendou seu horário?</h2>

              <div className="booking-card" style={{ backgroundImage: `url(${banner})` }}>
                <button className="booking-button" type="button" onClick={onStartBooking}>
                  Agendar corte <span>→</span>
                </button>
              </div>
            </section>
          </main>

          <BottomNav active="home" onNavigate={onNavigate} />

          {isCancelModalOpen ? (
            <div className="cancel-modal-overlay" onClick={closeCancelModal}>
              <div
                className="cancel-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="cancel-modal-title"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="cancel-modal-icon" aria-hidden="true">
                  <FiTrash2 size={18} />
                </div>

                <h3 id="cancel-modal-title">Cancelar agendamento?</h3>
                <p>Tem certeza que deseja cancelar seu horário de corte?</p>

                {cancelError && (
                  <div style={{ 
                    color: '#ef4444', 
                    fontSize: '14px', 
                    marginBottom: '16px',
                    padding: '8px',
                    backgroundColor: '#fee2e2',
                    borderRadius: '4px'
                  }}>
                    {cancelError}
                  </div>
                )}

                <div className="cancel-modal-actions">
                  <button
                    type="button"
                    className="cancel-modal-btn cancel-modal-btn--ghost"
                    onClick={closeCancelModal}
                    disabled={canceling}
                  >
                    Voltar
                  </button>

                  <button
                    type="button"
                    className="cancel-modal-btn cancel-modal-btn--danger"
                    onClick={confirmCancelAppointment}
                    disabled={canceling}
                  >
                    {canceling ? 'Cancelando...' : 'Sim, cancelar'}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}