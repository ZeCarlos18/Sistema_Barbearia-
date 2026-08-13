import React from 'react';
import { getStoredUser } from '../../utils/authHelper';
import { getManualAvailableTimes, createManualBooking } from '../../services/appointmentService';
import { fetchServices, fetchBarbers } from '../../services/bookingService';
import './ManualBooking.css';
import DatePicker from '../../components/DatePicker/DatePicker';

function parseISODateLocal(str){
  if (!str) return null;
  const [y,m,d] = String(str).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m-1, d);
}

function formatLabelDate(str){
  const d = parseISODateLocal(str);
  return d ? d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }) : '';
}

export default function ManualBooking({ onBack, onCreated }) {
  const user = getStoredUser();
  // default to tomorrow (use local date components to avoid timezone shifts)
  const _tomorrow = new Date();
  _tomorrow.setDate(_tomorrow.getDate() + 1);
  const defaultDateStr = `${_tomorrow.getFullYear()}-${String(_tomorrow.getMonth()+1).padStart(2,'0')}-${String(_tomorrow.getDate()).padStart(2,'0')}`;
  const isChief = user?.role === 'admin';

  const [services, setServices] = React.useState([]);
  const [barbers, setBarbers] = React.useState([]);
  const [selectedBarber, setSelectedBarber] = React.useState(user?.id || '');
  const [serviceId, setServiceId] = React.useState('');
  const [date, setDate] = React.useState(defaultDateStr);
  const [availableTimes, setAvailableTimes] = React.useState([]);
  const [selectedTime, setSelectedTime] = React.useState('');
  const [clientName, setClientName] = React.useState('');
  const [loadingTimes, setLoadingTimes] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    async function load() {
      try {
        const svc = await fetchServices();
        setServices(svc);
        if (svc && svc.length) setServiceId(svc[0].id);
        if (isChief) {
          const b = await fetchBarbers();
          setBarbers(b || []);
          if (b && b.length && !selectedBarber) setSelectedBarber(b[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, [isChief, selectedBarber]);

  // If user is a barber and barbers list is empty, show the current user as barber option
  React.useEffect(() => {
    if (!isChief && (!barbers || barbers.length === 0) && user) {
      setBarbers([{ id: user.id, name: user.name, avatar: user.avatar || '' }]);
      setSelectedBarber(user.id);
    }
  }, [user, isChief, barbers]);

  React.useEffect(() => {
    async function loadTimes() {
      if (!selectedBarber || !date) return setAvailableTimes([]);
      setLoadingTimes(true);
      try {
        const resp = await getManualAvailableTimes(selectedBarber, date);
        setAvailableTimes(resp.availableTimes || []);
      } catch (err) {
        console.error('Erro ao buscar horários:', err);
        setAvailableTimes([]);
      } finally {
        setLoadingTimes(false);
      }
    }
    loadTimes();
  }, [selectedBarber, date]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!serviceId || !date || !selectedTime) return setError('Preencha serviço, data e horário.');
    try {
      setSubmitting(true);
      const body = { serviceId, date, time: selectedTime, barberId: selectedBarber, clientName };
      const payload = await createManualBooking(body);
      alert(payload.message || 'Agendamento criado com sucesso');
      onCreated?.();
      onBack?.();
    } catch (err) {
      console.error('createManualBooking error:', err);
      const msg = (err && err.message) ? err.message : 'Erro ao criar agendamento';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <div className="replica-root">
      <div className="replica-card">
        <header className="replica-header">
          <button type="button" className="replica-back" onClick={onBack} aria-label="Voltar">&lt;</button>
          <div className="replica-title">Novo agendamento</div>
        </header>

        <div className="replica-sep" />

        <section className="replica-section">
          <h3 className="replica-section-title">Selecionar Barbeiro</h3>

          <div className="replica-barbers">
            {(barbers || []).map(b => (
              <button
                type="button"
                key={b.id}
                className={`replica-barber ${String(selectedBarber) === String(b.id) ? 'replica-selected' : ''}`}
                onClick={() => setSelectedBarber(b.id)}
              >
                <div className="replica-avatar-wrap">
                  <img className="replica-avatar" src={b.avatar || `https://i.pravatar.cc/80?u=${b.id}`} alt={b.name} />
                </div>
                <div className="replica-barber-name">{b.name}</div>
              </button>
            ))}
          </div>
        </section>

        <form className="replica-form" onSubmit={handleSubmit}>
          <div className="replica-field">
            <label className="replica-label">Nome do cliente</label>
            <input className="replica-input" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nome completo" />
          </div>

          <div className="replica-row">
            <div className="replica-field half">
              <label className="replica-label">Serviço</label>
              <div className="replica-select-wrap">
                <select className="replica-select" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
                  <option value="">Degrade</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <span className="replica-select-caret">▾</span>
              </div>
            </div>

            <div className="replica-field half">
              <label className="replica-label">Data</label>
                <div className="replica-date-wrap">
                  <DatePicker value={date} onChange={(v) => setDate(v)} />
                </div>
            </div>
          </div>

          <div className="replica-field times-block">
            <label className="replica-label">Horários disponiveis {date ? `- ${formatLabelDate(date).replace(/^\w+,\s*/,'')}` : ''}</label>
            <div className="replica-times-grid">
              {loadingTimes ? <div className="replica-loading">Carregando...</div> : (
                (availableTimes || []).length === 0 ? <div className="replica-empty">Nenhum horário disponível</div> : (
                  (availableTimes || []).map(t => (
                    <button key={t} type="button" className={`replica-time ${selectedTime===t? 'replica-time-selected': ''}`} onClick={() => setSelectedTime(t)}>{t}</button>
                  ))
                )
              )}
            </div>
          </div>

          {error && <div className="replica-error">{error}</div>}

          <div className="replica-actions">
            <button type="submit" className="replica-confirm" disabled={submitting}>{submitting ? 'Enviando...' : 'Confirmar agendamento'}</button>
            <button type="button" className="replica-cancel" onClick={onBack}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
