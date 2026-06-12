import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getActiveNavItem } from '../../utils/navHelper';
import TextField from '../../components/form/TextField';
import { login } from '../../services/authService';
import BottomNav from '../../components/BottomNav/BottomNav';
import './Login.css';

export default function Login({ onLoginSuccess, onGoToRegister, onGoToRecover }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = React.useState({ email: '', password: '', remember: true });
  const [errors, setErrors] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  const [formMessage, setFormMessage] = React.useState('');

  function handleChange(event) {
    const { name, type, checked, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  function validateForm() {
    const nextErrors = {};

    if (!form.email.trim()) {
      nextErrors.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'Digite um e-mail válido';
    }

    if (!form.password) {
      nextErrors.password = 'Senha é obrigatória';
    } else if (form.password.length < 6) {
      nextErrors.password = 'A senha deve ter no mínimo 6 caracteres';
    }

    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateForm();
    setErrors(nextErrors);
    setFormMessage('');

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      const response = await login({ email: form.email, password: form.password });

      const storage = form.remember ? localStorage : sessionStorage;
      storage.setItem('token', response.token);
      storage.setItem('user', JSON.stringify(response.user));

      if (!form.remember) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }

      onLoginSuccess(response.user);
    } catch (error) {
      setFormMessage(error.message || 'Não foi possível entrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <section className="login-card">
        <header className="login-header">
          <h1 className="login-title">BARBER PRO</h1>
          <p className="login-subtitle">AGENDAMENTO FÁCIL E PRÁTICO</p>
        </header>

        <div className="login-divider" />

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-copy">
            <h2 className="login-form-title">ACESSAR CONTA</h2>
            <p className="login-form-text">Entre com seu e-mail e senha para continuar</p>
          </div>

          <TextField
            label="E-mail"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="joao@gmail.com"
            error={errors.email}
          />

          <TextField
            label="Senha"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Sua senha"
            error={errors.password}
          />

          <label className="login-remember">
            <span>Manter logado sempre?</span>
            <input
              type="checkbox"
              name="remember"
              checked={form.remember}
              onChange={handleChange}
            />
          </label>

          {formMessage ? <div className="login-message login-message--error">{formMessage}</div> : null}

          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? 'ENTRANDO...' : 'ENTRAR'}
          </button>

          <button type="button" className="login-link" onClick={onGoToRegister}>
            Não tem uma conta? <span>Cadastrar-se</span>
          </button>

          <button type="button" className="login-recover" onClick={onGoToRecover}>
            Recuperar senha
          </button>
        </form>
      </section>

      <BottomNav 
        active={getActiveNavItem(location.pathname)}
        onNavigate={(page) => {
          if (page === 'home' || page === 'dashboard') onGoToRegister();
          else if (page === 'calendar') navigate('/');
          else if (page === 'profile') onGoToRecover();
        }}
      />
    </div>
  );
}