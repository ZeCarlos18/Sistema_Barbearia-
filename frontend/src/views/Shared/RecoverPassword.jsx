import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getActiveNavItem } from '../../utils/navHelper';
import TextField from '../../components/form/TextField';
import BottomNav from '../../components/BottomNav/BottomNav';
import { checkRecoverEmail } from '../../services/authService';
import '../../styles/Shared/RecoverPassword.css';

export default function RecoverPassword({ onBackToLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  async function handleVerifyEmail(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('Digite seu e-mail para continuar');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Digite um e-mail válido');
      return;
    }

    try {
      setLoading(true);
      const normalizedEmail = email.trim().toLowerCase();
      const response = await checkRecoverEmail(normalizedEmail);

      if (!response?.recoveryToken) {
        setError('Não foi possível iniciar a recuperação de senha.');
        return;
      }

      sessionStorage.setItem('passwordRecoveryToken', response.recoveryToken);
      sessionStorage.setItem('passwordRecoveryEmail', normalizedEmail);

      navigate('/reset-password', {
        state: {
          email: normalizedEmail,
          recoveryToken: response.recoveryToken
        }
      });
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível verificar este e-mail.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="recover-page">
      <section className="recover-card">
        <h1 className="recover-title">Recuperar senha</h1>
        <p className="recover-text">
          Digite seu e-mail para verificar se ele está cadastrado.
        </p>

        <form onSubmit={handleVerifyEmail} className="recover-form">
          <TextField
            label="E-mail"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="joao@gmail.com"
            required
          />

          {error ? <div className="recover-message recover-message--error">{error}</div> : null}
          {message ? <div className="recover-message recover-message--success">{message}</div> : null}

          <button type="submit" className="recover-submit" disabled={loading}>
            {loading ? 'Verificando...' : 'Recuperar senha'}
          </button>

          <button type="button" className="recover-back" onClick={onBackToLogin}>
            Voltar para login
          </button>
        </form>
      </section>

      <BottomNav 
        active={getActiveNavItem(location.pathname)}
        onNavigate={(page) => {
          if (page === 'home') onBackToLogin();
          else if (page === 'dashboard') navigate('/login');
          else if (page === 'calendar') onBackToLogin();
          else if (page === 'profile') navigate('/login');
        }}
      />
    </div>
  );
}