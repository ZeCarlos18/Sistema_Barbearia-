import React from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import TextField from '../../components/form/TextField';
import BottomNav from '../../components/BottomNav/BottomNav';
import { getActiveNavItem } from '../../utils/navHelper';
import { resetPassword, validateResetToken } from '../../services/authService';
import '../../styles/Shared/RecoverPassword.css';

export default function ResetPassword({ onBackToLogin, onGoToRecover }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // O token chega pela URL do link enviado no e-mail: /reset-password?token=...
  const token = searchParams.get('token') || '';

  const [email, setEmail] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [validating, setValidating] = React.useState(true);
  const [tokenValid, setTokenValid] = React.useState(false);

  // Valida o link assim que a página abre, para não deixar o usuário
  // preencher o formulário inteiro e só então descobrir que o link expirou.
  React.useEffect(() => {
    let active = true;

    async function checkToken() {
      if (!token) {
        if (active) {
          setError('Link de recuperação inválido. Solicite um novo e-mail de recuperação.');
          setValidating(false);
        }
        return;
      }

      try {
        const response = await validateResetToken(token);
        if (!active) return;

        setTokenValid(true);
        setEmail(response?.email || '');
      } catch (requestError) {
        if (!active) return;
        setError(requestError.message || 'Link de recuperação inválido ou expirado. Solicite um novo.');
      } finally {
        if (active) setValidating(false);
      }
    }

    checkToken();

    return () => {
      active = false;
    };
  }, [token]);

  async function handleResetPassword(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!token || !tokenValid) {
      setError('Link de recuperação inválido ou expirado. Solicite um novo.');
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
      await resetPassword({ token, newPassword, confirmPassword });

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

  function goToRecover() {
    if (typeof onGoToRecover === 'function') {
      onGoToRecover();
      return;
    }
    if (typeof onBackToLogin === 'function') {
      onBackToLogin();
      return;
    }
    navigate('/recover');
  }

  if (validating) {
    return (
      <div className="recover-page">
        <section className="recover-card">
          <h1 className="recover-title">Definir nova senha</h1>
          <p className="recover-text">Validando seu link de recuperação...</p>
        </section>
      </div>
    );
  }

  // Link inválido/expirado: nem mostramos o formulário, só o caminho para pedir outro.
  if (!tokenValid) {
    return (
      <div className="recover-page">
        <section className="recover-card">
          <h1 className="recover-title">Link inválido</h1>
          <p className="recover-text">
            {error || 'Este link de recuperação não é mais válido.'}
          </p>

          <div className="recover-form">
            <button type="button" className="recover-submit" onClick={goToRecover}>
              Solicitar novo link
            </button>

            <button type="button" className="recover-back" onClick={() => navigate('/login')}>
              Voltar para login
            </button>
          </div>
        </section>

        <BottomNav
          active={getActiveNavItem(location.pathname)}
          onNavigate={(page) => {
            if (page === 'home' || page === 'calendar') navigate('/recover');
            else navigate('/login');
          }}
        />
      </div>
    );
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

          <button type="submit" className="recover-submit" disabled={loading}>
            {loading ? 'Alterando...' : 'Redefinir senha'}
          </button>

          <button type="button" className="recover-back" onClick={() => navigate('/login')}>
            Voltar para login
          </button>
        </form>
      </section>

      <BottomNav
        active={getActiveNavItem(location.pathname)}
        onNavigate={(page) => {
          if (page === 'home' || page === 'calendar') navigate('/recover');
          else navigate('/login');
        }}
      />
    </div>
  );
}
