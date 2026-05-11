import React from 'react';
import './Home.css';
import banner from '../../assets/image.png';
import BottomNav from '../../components/BottomNav/BottomNav';
import { FiTrash2 } from 'react-icons/fi';

const nextAppointment = {
  status: 'Confirmado',
  service: 'Corte Degradê',
  barber: 'Rafael',
  date: 'Seg, 18 de Maio',
  time: '14:30'
};

export default function Home({ onStartBooking }) {
  const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user') || '{}';
  const user = JSON.parse(storedUser);
  const [isCancelModalOpen, setIsCancelModalOpen] = React.useState(false);
  const [appointmentCanceled, setAppointmentCanceled] = React.useState(false);

  function openCancelModal() {
    setIsCancelModalOpen(true);
  }

  function closeCancelModal() {
    setIsCancelModalOpen(false);
  }

  function confirmCancelAppointment() {
    setAppointmentCanceled(true);
    setIsCancelModalOpen(false);
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

              {!appointmentCanceled ? (
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

          <BottomNav active="home" onNavigate={(page) => console.log(page)} />

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

                <div className="cancel-modal-actions">
                  <button
                    type="button"
                    className="cancel-modal-btn cancel-modal-btn--ghost"
                    onClick={closeCancelModal}
                  >
                    Voltar
                  </button>

                  <button
                    type="button"
                    className="cancel-modal-btn cancel-modal-btn--danger"
                    onClick={confirmCancelAppointment}
                  >
                    Sim, cancelar
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