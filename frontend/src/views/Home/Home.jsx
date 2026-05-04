import React from 'react';
import { logout } from '../../services/authService';
import './Home.css';

export default function Home({ onLogout, onStartBooking }) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user') || '{}';
  const user = JSON.parse(storedUser);

  async function handleLogout() {
    setLoading(true);
    setError('');

    try {
      await logout();
      onLogout();
    } catch (err) {
      setError(err.message || 'Erro ao fazer logout');
      setLoading(false);
    }
  }

  return (
    <div className="home-page">
      <div className="home-phone">
        <div className="home-shell">
          <header className="home-header">
            <div className="home-header-content">
              <h1 className="home-title">BARBER PRO</h1>
              <p className="home-welcome">Bem-vindo, {user.name || 'Cliente'}</p>
            </div>
            <button className="home-logout-btn" onClick={handleLogout} disabled={loading}>
              {loading ? 'SAINDO...' : 'SAIR'}
            </button>
          </header>

          <main className="home-main">
            <section className="home-hero">
              <div className="home-hero-glow" aria-hidden="true" />
              <div className="home-card">
                <div className="home-card-badge">Area do Cliente</div>
                <h2 className="home-card-title">Seu estilo, seu horario.</h2>
                <p className="home-card-text">Agende seus servicos e acompanhe seus horarios.</p>
                <button className="home-booking-btn" type="button" onClick={onStartBooking}>
                  NOVO AGENDAMENTO
                </button>
              </div>
            </section>

            {error ? <div className="home-error">{error}</div> : null}
          </main>
        </div>
      </div>
    </div>
  );
}
