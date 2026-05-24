import React from 'react';
import PrimaryButton from '../../components/PrimaryButton';
import TextField from '../../components/form/TextField';
import { register } from '../../services/authService';
import './Register.css';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  password: ''
};

export default function Register({ onBack }) {
  const [form, setForm] = React.useState(initialForm);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    
    // Se o campo for o telefone, remove instantaneamente tudo o que não for número
    const finalValue = name === 'phone' ? value.replace(/\D/g, '') : value;
    
    setForm((current) => ({ ...current, [name]: finalValue }));
  }

async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    // Validação do Telefone 
    const phoneDigits = form.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      setError('O telefone deve conter o DDD e um número válido.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: phoneDigits // Enviamos apenas os números para a API
      };

      await register(payload);
      setMessage('Conta criada com sucesso. Agora você pode entrar.');
      setForm(initialForm);
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível criar a conta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-page">
      <section className="register-card">
        <header className="register-header">
          <h1 className="register-title">BARBER PRO</h1>
          <p className="register-subtitle">AGENDAMENTO FÁCIL E PRÁTICO</p>
        </header>

        <div className="register-divider" />

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="register-copy">
            <h2 className="register-form-title">CRIAR CONTA</h2>
            <p className="register-form-text">Preencha seus dados para começar</p>
          </div>

          <TextField
            label="Nome completo"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="João Silva"
            required
          />

          <TextField
            label="E-mail"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="joao@gmail.com"
            required
          />

          <TextField
            label="Telefone (com DDD)"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Ex: 11999999999"
            maxLength={11}
          />

          <TextField
            label="Senha"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Sua senha"
            minLength={6}
            required
          />

          {error ? <div className="register-message register-message--error">{error}</div> : null}
          {message ? <div className="register-message register-message--success">{message}</div> : null}

          <PrimaryButton type="submit">{loading ? 'CRIANDO...' : 'CRIAR CONTA'}</PrimaryButton>

          <button className="register-back" type="button" onClick={onBack}>
            Voltar para a tela inicial
          </button>
        </form>
      </section>
    </div>
  );
}