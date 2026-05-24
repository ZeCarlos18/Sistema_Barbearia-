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
  const [photoBase64, setPhotoBase64] = React.useState(''); // Novo estado para a foto
  const [feedback, setFeedback] = React.useState({ type: '', message: '' });
  const [loading, setLoading] = React.useState(false);

  function toggleDay(dayId) {
    setSelectedDays((current) => {
      if (current.includes(dayId)) return current.filter((item) => item !== dayId);
      return [...current, dayId];
    });
  }

// Conversor e Validador da Foto de Perfil
  function handlePhotoChange(event) {
    const file = event.target.files[0];
    
    if (file) {
      // 1. Bloqueio Estrito: Verificar se o arquivo é realmente uma imagem
      if (!file.type.startsWith('image/')) {
        setFeedback({ type: 'error', message: 'Formato inválido. Por favor, envie apenas imagens (PNG, JPG).' });
        // Limpa o campo do ficheiro para que o utilizador possa tentar de novo
        event.target.value = ''; 
        return;
      }

      // 2. Bloqueio de Tamanho: Limitar a 2MB (2 * 1024 * 1024 bytes)
      if (file.size > 2 * 1024 * 1024) {
        setFeedback({ type: 'error', message: 'A imagem é muito pesada. O tamanho máximo permitido é 2MB.' });
        event.target.value = ''; 
        return;
      }

      // Se passou nas validações, converte para Base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result);
        setFeedback({ type: '', message: '' });
      };
      reader.readAsDataURL(file);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    setFeedback({ type: '', message: '' });

    // 1. Validar preenchimento obrigatório
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setFeedback({ type: 'error', message: 'Preencha nome, email e telefone.' });
      return;
    }

    // 2. Validar Nome (apenas letras)
    const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/;
    if (!nameRegex.test(form.name.trim())) {
      setFeedback({ type: 'error', message: 'O nome só pode conter letras e espaços.' });
      return;
    }

    // 3. Validar Telefone
    const phoneDigits = form.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      setFeedback({ type: 'error', message: 'O telefone deve conter o DDD e número válido.' });
      return;
    }

// 4. Validar Dias e Horários
    if (selectedDays.length === 0) {
      setFeedback({ type: 'error', message: 'Selecione pelo menos um dia de atendimento.' });
      return;
    }
    
    if (!startTime || !startTime.trim() || !endTime || !endTime.trim()) {
      setFeedback({ type: 'error', message: 'O horário de início e fim são obrigatórios.' });
      return;
    }

    if (startTime === '00:00' || endTime === '00:00') {
      setFeedback({ type: 'error', message: 'Horários como 00:00 não são válidos para atendimento.' });
      return;
    }

    if (startTime >= endTime) {
      setFeedback({ type: 'error', message: 'O horário de término deve ser depois do horário de início.' });
      return;
    }

    setLoading(true);

    // Envio para a API
    createBarber({
      name: form.name,
      email: form.email,
      phone: phoneDigits,
      password: form.password,
      availableDays: selectedDays,
      startTime,
      endTime,
      photoUrl: photoBase64
    })
      .then((response) => {
        const generated = response.generatedPassword
          ? `Senha temporária: ${response.generatedPassword}`
          : 'Barbeiro criado com sucesso.';
        setFeedback({ type: 'success', message: generated });
        setForm({ name: '', email: '', phone: '', password: '' });
        setPhotoBase64('');
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
            {/* Secção da Foto de Perfil Opcional */}
            <div className="barber-photo">
              <label className="barber-photo-btn" style={{ overflow: 'hidden', cursor: 'pointer' }}>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg" 
                  onChange={handlePhotoChange} 
                  style={{ display: 'none' }} 
                />
                {photoBase64 ? (
                  <img src={photoBase64} alt="Pré-visualização" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <FiPlus size={20} />
                )}
              </label>
              <span className="barber-photo-label">FOTO (Opcional)</span>
            </div>

            <form className="barber-form" onSubmit={handleSubmit}>
              <div className="barber-field">
                <label htmlFor="barber-name">Nome completo *</label>
                <input
                  id="barber-name"
                  className="barber-input"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
                />
              </div>

              <div className="barber-field">
                <label htmlFor="barber-email">E-mail *</label>
                <input
                  id="barber-email"
                  className="barber-input"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
                />
              </div>

              <div className="barber-field">
                <label htmlFor="barber-phone">Telefone (com DDD) *</label>
                <input
                  id="barber-phone"
                  className="barber-input"
                  type="tel"
                  maxLength={11}
                  placeholder="Ex: 11999999999"
                  value={form.phone}
                  onChange={(e) => {
                    // Remove letras/símbolos imediatamente
                    const onlyNumbers = e.target.value.replace(/\D/g, '');
                    setForm((c) => ({ ...c, phone: onlyNumbers }));
                  }}
                />
              </div>

              <div className="barber-field">
                <label htmlFor="barber-password">Senha (Opcional)</label>
                <input
                  id="barber-password"
                  className="barber-input"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))}
                  placeholder="Deixe em branco para gerar"
                />
              </div>

              <div className="barber-field">
                <label>Dias disponíveis</label>
                <div className="barber-days">
                  {weekDays.map((day) => (
                    <button
                      type="button"
                      key={day.id}
                      className={`barber-day ${selectedDays.includes(day.id) ? 'is-active' : ''}`}
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
                    <input className="barber-time-input" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                  </div>
                  <div className="barber-time-card">
                    <span>Fim</span>
                    <input className="barber-time-input" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                  </div>
                </div>
              </div>

              <button type="submit" className="barber-submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Concluir cadastro'}
              </button>

              {feedback.message && (
                <div className={`barber-feedback ${feedback.type === 'error' ? 'barber-feedback--error' : 'barber-feedback--success'}`}>
                  {feedback.message}
                </div>
              )}
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}