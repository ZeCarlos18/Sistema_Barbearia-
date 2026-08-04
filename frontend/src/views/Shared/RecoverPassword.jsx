import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getActiveNavItem } from '../../utils/navHelper';
import TextField from '../../components/form/TextField';
import BottomNav from '../../components/BottomNav/BottomNav';
import { checkRecoverEmail, resetPasswordByEmail } from '../../services/authService';
import '../../styles/Shared/RecoverPassword.css';

export default function RecoverPassword({ onBackToLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = React.useState('email');
  const [email, setEmail] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
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
      await checkRecoverEmail(normalizedEmail);
      setEmail(normalizedEmail);
      setStep('reset');
      setMessage('E-mail encontrado. Defina sua nova senha.');
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível verificar este e-mail.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!newPassword || !confirmPassword) {
      setError('Preencha a nova senha e a confirmação.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Os campos de senha e confirmação devem ser iguais.');
      return;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{6,})/;
    if (!passwordRegex.test(newPassword)) {
      setError('A senha deve ter no mínimo 6 caracteres, uma letra maiúscula e um caractere especial.');
      return;
    }

    try {
      setLoading(true);
      await resetPasswordByEmail({
        email,
        newPassword,
        confirmPassword
      });
      setMessage('Senha alterada com sucesso. Redirecionando para o login...');
      setTimeout(() => {
        if (typeof onBackToLogin === 'function') {
          onBackToLogin();
        } else {
          navigate('/login');
        }
      }, 1200);
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível alterar a senha.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="recover-page">
      <section className="recover-card">
        <h1 className="recover-title">Recuperar senha</h1>
        <p className="recover-text">
          {step === 'email'
            ? 'Digite seu e-mail para verificar se ele está cadastrado.'
            : 'Digite sua nova senha e confirme para concluir a recuperação.'}
        </p>

        {step === 'email' ? (
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
              {loading ? 'Verificando...' : 'Verificar e-mail'}
            </button>

            <button type="button" className="recover-back" onClick={onBackToLogin}>
              Voltar para login
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="recover-form">
            <TextField
              label="E-mail"
              name="email"
              type="email"
              value={email}
              onChange={() => {}}
              disabled
            />

            <TextField
              label="Nova senha"
              name="newPassword"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Nova senha"
              required
            />

            <TextField
              label="Confirmar nova senha"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirme a senha"
              required
            />

            <small className="recover-hint">
              A senha deve ter no mínimo 6 caracteres, uma letra maiúscula e um caractere especial.
            </small>

            {error ? <div className="recover-message recover-message--error">{error}</div> : null}
            {message ? <div className="recover-message recover-message--success">{message}</div> : null}

            <button type="submit" className="recover-submit" disabled={loading}>
              {loading ? 'Alterando...' : 'Alterar senha'}
            </button>

            <button type="button" className="recover-back" onClick={onBackToLogin}>
              Voltar para login
            </button>
          </form>
        )}
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