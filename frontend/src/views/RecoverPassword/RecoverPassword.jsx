import React from 'react';
import TextField from '../../components/form/TextField';
import './RecoverPassword.css';

export default function RecoverPassword({ onBackToLogin }) {
  const [email, setEmail] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');

  function handleSubmit(event) {
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

    setMessage('Seu e-mail foi registrado. Depois vamos ligar isso ao backend.');
  }

  return (
    <div className="recover-page">
      <section className="recover-card">
        <h1 className="recover-title">Recuperar senha</h1>
        <p className="recover-text">
          Digite seu e-mail para receber as instruções de recuperação.
        </p>

        <form onSubmit={handleSubmit} className="recover-form">
          <TextField
            label="E-mail"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="joao@gmail.com"
          />

          {error ? <div className="recover-message recover-message--error">{error}</div> : null}
          {message ? <div className="recover-message recover-message--success">{message}</div> : null}

          <button type="submit" className="recover-submit">
            Enviar link
          </button>

          <button type="button" className="recover-back" onClick={onBackToLogin}>
            Voltar para login
          </button>
        </form>
      </section>
    </div>
  );
}