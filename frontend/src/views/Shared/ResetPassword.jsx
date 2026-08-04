import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TextField from '../../components/form/TextField';
import BottomNav from '../../components/BottomNav/BottomNav';
import { getActiveNavItem } from '../../utils/navHelper';
import { resetPasswordByEmail } from '../../services/authService';
import '../../styles/Shared/RecoverPassword.css';

export default function ResetPassword({ onBackToLogin, onGoToRecover }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = React.useState('');
  const [recoveryToken, setRecoveryToken] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const stateEmail = location.state?.email || sessionStorage.getItem('passwordRecoveryEmail') || '';
    const stateToken = location.state?.recoveryToken || sessionStorage.getItem('passwordRecoveryToken') || '';

    setEmail(stateEmail);
    setRecoveryToken(stateToken);

    if (!stateToken) {
      setError('A sessão de recuperação expirou. Refaça a verificação do e-mail.');
    }
  }, [location.state]);

  function clearRecoverySession() {
    sessionStorage.removeItem('passwordRecoveryToken');
    sessionStorage.removeItem('passwordRecoveryEmail');
  }

  async function handleResetPassword(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!recoveryToken) {
      setError('A sessão de recuperação expirou. Refaça a verificação do e-mail.');
      return;
    }

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
        recoveryToken,
        newPassword,
        confirmPassword
      });

      clearRecoverySession();
      navigate('/login', {
        replace: true,
        state: {
          message: 'Senha alterada com sucesso. Faça login novamente.'
        }
      });
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível alterar a senha.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="recover-page">
      <section className="recover-card">
        <h1 className="recover-title">Definir nova senha</h1>
        <p className="recover-text">
          Escolha uma nova senha para a conta {email ? `de ${email}` : 'informada'}.
        </p>

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

          <button type="submit" className="recover-submit" disabled={loading || !recoveryToken}>
            {loading ? 'Alterando...' : 'Redefinir senha'}
          </button>

          <button
            type="button"
            className="recover-back"
            onClick={() => {
              clearRecoverySession();
              if (typeof onGoToRecover === 'function') {
                onGoToRecover();
                return;
              }
              if (typeof onBackToLogin === 'function') {
                onBackToLogin();
                return;
              }
              navigate('/recover');
            }}
          >
            Voltar para recuperação
          </button>
        </form>
      </section>

      <BottomNav
        active={getActiveNavItem(location.pathname)}
        onNavigate={(page) => {
          if (page === 'home' || page === 'calendar') {
            clearRecoverySession();
            navigate('/recover');
            return;
          }

          if (page === 'dashboard' || page === 'profile') {
            clearRecoverySession();
            navigate('/login');
          }
        }}
      />
    </div>
  );
}