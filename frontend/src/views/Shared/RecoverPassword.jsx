import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getActiveNavItem } from '../../utils/navHelper';
import TextField from '../../components/form/TextField';
import BottomNav from '../../components/BottomNav/BottomNav';
import { requestPasswordReset } from '../../services/authService';
import '../../styles/Shared/RecoverPassword.css';

export default function RecoverPassword({ onBackToLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  async function handleRequestReset(event) {
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
      const response = await requestPasswordReset(normalizedEmail);

      // Por segurança, a API responde a mesma coisa exista o e-mail ou não.
      setSent(true);
      setMessage(
        response?.message ||
          'Se este e-mail estiver cadastrado, enviamos um link de recuperação. Verifique sua caixa de entrada e o spam.'
      );
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível enviar o e-mail de recuperação.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="recover-page">
      <section className="recover-card">
        <h1 className="recover-title">Recuperar senha</h1>
        <p className="recover-text">
          {sent
            ? 'Enviamos as instruções para o seu e-mail. O link é válido por 30 minutos.'
            : 'Digite seu e-mail e enviaremos um link para você criar uma nova senha.'}
        </p>

        <form onSubmit={handleRequestReset} className="recover-form">
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
            {loading ? 'Enviando...' : sent ? 'Reenviar link' : 'Enviar link de recuperação'}
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
