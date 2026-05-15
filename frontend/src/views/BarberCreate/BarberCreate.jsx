import React from 'react';
import { FiArrowLeft, FiPlus } from 'react-icons/fi';
import { createBarber } from '../../services/adminService';
import './BarberCreate.css';

const weekDays = [
  { id: 0, label: 'D' },
  { id: 1, label: 'S' },
  { id: 2, label: 'T' },
  { id: 3, label: 'Q' },
  { id: 4, label: 'Q' },
  { id: 5, label: 'S' },
  { id: 6, label: 'S' }
];

export default function BarberCreate({ onBack }) {
  const [selectedDays, setSelectedDays] = React.useState([1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = React.useState('09:00');
  const [endTime, setEndTime] = React.useState('19:00');
  const [form, setForm] = React.useState({ name: '', email: '', phone: '', password: '' });
  const [feedback, setFeedback] = React.useState({ type: '', message: '' });
  const [loading, setLoading] = React.useState(false);

  function toggleDay(dayId) {
    setSelectedDays((current) => {
      if (current.includes(dayId)) {
        return current.filter((item) => item !== dayId);
      }
      return [...current, dayId];
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.password.trim()) {
      setFeedback({ type: 'error', message: 'Preencha nome, email, telefone e senha.' });
      return;
    }

    if (form.password.trim().length < 6) {
      setFeedback({ type: 'error', message: 'A senha deve ter no minimo 6 caracteres.' });
      return;
    }

    setFeedback({ type: '', message: '' });
    setLoading(true);

    createBarber({
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password
    })
      .then((response) => {
        const generated = response.generatedPassword
          ? `Senha temporaria: ${response.generatedPassword}`
          : 'Barbeiro criado com sucesso.';
        setFeedback({ type: 'success', message: generated });
        setForm({ name: '', email: '', phone: '', password: '' });
      })
      .catch((error) => {
        setFeedback({ type: 'error', message: error.message || 'Erro ao criar barbeiro.' });
      })
      .finally(() => setLoading(false));
  }

  return (
    <div className="barber-create-page">
      <div className="barber-create-phone">
        <div className="barber-create-shell">
          <header className="barber-create-header">
            <button type="button" className="barber-create-back" onClick={onBack}>
              <FiArrowLeft size={18} />
            </button>
            <h1 className="barber-create-title">Cadastrar Barbeiro</h1>
          </header>

          <main className="barber-create-main">
            <div className="barber-photo">
              <button type="button" className="barber-photo-btn" aria-label="Adicionar foto">
                <FiPlus size={20} />
              </button>
              <span className="barber-photo-label">FOTO</span>
            </div>

            <form className="barber-form" onSubmit={handleSubmit}>
              <div className="barber-field">
                <label htmlFor="barber-name">Nome completo</label>
                <input
                  id="barber-name"
                  className="barber-input"
                  type="text"
                  placeholder=""
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  autoComplete="name"
                />
              </div>

              <div className="barber-field">
                <label htmlFor="barber-email">E-mail</label>
                <input
                  id="barber-email"
                  className="barber-input"
                  type="email"
                  placeholder=""
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  autoComplete="email"
                />
              </div>

              <div className="barber-field">
                <label htmlFor="barber-phone">Telefone</label>
                <input
                  id="barber-phone"
                  className="barber-input"
                  type="tel"
                  placeholder=""
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  autoComplete="tel"
                />
              </div>

              <div className="barber-field">
                <label htmlFor="barber-password">Senha</label>
                <input
                  id="barber-password"
                  className="barber-input"
                  type="password"
                  placeholder=""
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, password: event.target.value }))
                  }
                  autoComplete="new-password"
                />
              </div>

              <div className="barber-field">
                <label>Dias disponíveis</label>
                <div className="barber-days">
                  {weekDays.map((day) => (
                    <button
                      type="button"
                      key={`${day.label}-${day.id}`}
                      className={`barber-day ${
                        selectedDays.includes(day.id) ? 'is-active' : ''
                      }`}
                      onClick={() => toggleDay(day.id)}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="barber-field">
                <label>Horário de atendimento</label>
                <div className="barber-time-row">
                  <div className="barber-time-card">
                    <span>Início</span>
                    <input
                      className="barber-time-input"
                      type="time"
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                    />
                  </div>
                  <div className="barber-time-card">
                    <span>Fim</span>
                    <input
                      className="barber-time-input"
                      type="time"
                      value={endTime}
                      onChange={(event) => setEndTime(event.target.value)}
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="barber-submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Concluir cadastro'}
              </button>

              {feedback.message ? (
                <div
                  className={`barber-feedback ${
                    feedback.type === 'error' ? 'barber-feedback--error' : 'barber-feedback--success'
                  }`}
                >
                  {feedback.message}
                </div>
              ) : null}
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}
