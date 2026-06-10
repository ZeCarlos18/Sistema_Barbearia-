import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './Booking.css';
import avatarImage from '../../assets/image.png';
import AppointmentConfirmationModal from '../../components/Modal/AppointmentConfirmationModal';
import { fetchServices, fetchBarbers, fetchAvailableTimes, createAppointment } from '../../services/bookingService';
import { createWaitlistEntry } from '../../services/waitlistService';
import WaitlistEntryPanel from '../../components/Waitlist/WaitlistEntryPanel';
import WaitlistConfirmationModal from '../../components/Modal/WaitlistConfirmationModal';



const weekdayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const timeSlots = Array.from({ length: 20 }, (_, i) => {
  const hour = Math.floor(i / 2) + 9;
  const mins = i % 2 === 0 ? '00' : '30';
  return `${String(hour).padStart(2, '0')}:${mins}`;
});

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const formatDateISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const formatPrice = (v) => v ? Number(String(v).replace(',', '.')).toLocaleString('pt-BR') : '';

const getServiceVariant = (name) => {
  const n = String(name || '').toLowerCase();
  if (n.includes('barb')) return 'barba';
  if (n.includes('degrad')) return 'degrade';
  return 'social';
};

export default function Booking({ onBack }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedBarberId, setSelectedBarberId] = useState('');
  const [alternativeBarbers, setAlternativeBarbers] = useState([]);
  const [alternativeBarberId, setAlternativeBarberId] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [calendarMonth, setCalendarMonth] = useState(() => startOfDay(new Date()));
  const [selectedTime, setSelectedTime] = useState('');
  const [availableTimes, setAvailableTimes] = useState([]);
  
  const [loading, setLoading] = useState({ data: false, times: false, alternatives: false });
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [formError, setFormError] = useState('');

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState(null);

  const today = useMemo(() => startOfDay(new Date()), []);

  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistConfirmationData, setWaitlistConfirmationData] = useState(null);
  const [selectedUnavailableTime, setSelectedUnavailableTime] = useState('');

  const waitlistCacheKey = useMemo(() => {
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    const userId = String(user?.id || '');
    const barberId = String(selectedBarberId || '');
    const dateISO = formatDateISO(selectedDate);
    return `waitlist:${userId}:${barberId}:${dateISO}`;
  }, [selectedBarberId, selectedDate]);

  const [alreadyInQueue, setAlreadyInQueue] = useState(false);

  useEffect(() => {
    if (!selectedUnavailableTime) return;
    const raw = localStorage.getItem(waitlistCacheKey);
    const list = raw ? JSON.parse(raw) : [];
    setAlreadyInQueue(list.includes(String(selectedUnavailableTime)));
  }, [selectedUnavailableTime, waitlistCacheKey]);



  // 1. Buscar Serviços e Barbeiros simultaneamente
  useEffect(() => {
    let isMounted = true;
    setLoading(l => ({ ...l, data: true }));
    
    Promise.all([fetchServices(), fetchBarbers()])
      .then(([svcs, barbs]) => {
        if (!isMounted) return;
        setServices(Array.isArray(svcs) ? svcs : []);
        setBarbers(Array.isArray(barbs) ? barbs : []);
      })
      .catch(() => isMounted && setError('Não foi possível carregar os dados iniciais.'))
      .finally(() => isMounted && setLoading(l => ({ ...l, data: false })));

    return () => { isMounted = false; };
  }, []);

  // 2. Limpar estados ao mudar dados base
  useEffect(() => {
    setAvailableTimes([]);
    setSelectedTime('');
    setAlternativeBarbers([]);
    setAlternativeBarberId('');
  }, [selectedBarberId, selectedDate]);

  // 3. Cálculos de Calendário e Horários
  const calendarDays = useMemo(() => {
    const y = calendarMonth.getFullYear(), m = calendarMonth.getMonth();
    const days = Array(new Date(y, m, 1).getDay()).fill(null);
    for (let d = 1; d <= new Date(y, m + 1, 0).getDate(); d++) days.push(new Date(y, m, d));
    return days;
  }, [calendarMonth]);

  const visibleSlotSet = useMemo(() => {
    const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
    const isToday = selectedDate.getTime() === today.getTime();
    return new Set(timeSlots.filter(t => !isToday || (parseInt(t.split(':')[0]) * 60 + parseInt(t.split(':')[1]) >= nowMins)));
  }, [selectedDate, today]);

  const availableSet = useMemo(() => new Set(availableTimes.filter(t => visibleSlotSet.has(t))), [availableTimes, visibleSlotSet]);
  
  const timeGroups = [
    { title: 'MANHÃ', slots: [...visibleSlotSet].filter(t => parseInt(t) < 12) },
    { title: 'TARDE', slots: [...visibleSlotSet].filter(t => parseInt(t) >= 12) }
  ];

  // 4. Buscar Barbeiros Alternativos (Otimizado)
  useEffect(() => {
    if (step !== 3 || availableSet.size > 0 || !barbers.length) return;
    
    let isMounted = true;
    setLoading(l => ({ ...l, alternatives: true }));
    
    const others = barbers.filter(b => String(b.id) !== String(selectedBarberId));
    Promise.all(others.map(b => fetchAvailableTimes(b.id, formatDateISO(selectedDate)).catch(() => ({}))))
      .then(results => {
        if (!isMounted) return;
        const alts = others.filter((_, i) => (results[i]?.availableTimes || []).some(t => visibleSlotSet.has(t)));
        setAlternativeBarbers(alts);
      })
      .finally(() => isMounted && setLoading(l => ({ ...l, alternatives: false })));

    return () => { isMounted = false; };
  }, [step, availableSet.size, selectedBarberId, selectedDate, barbers, visibleSlotSet]);

  const fetchTimes = async (bId) => {
    setLoading(l => ({ ...l, times: true }));
    try {
      const { availableTimes: times } = await fetchAvailableTimes(bId, formatDateISO(selectedDate));
      setAvailableTimes(Array.isArray(times) ? times : []);
      if (bId !== selectedBarberId) {
        setSelectedBarberId(bId);
        setSelectedTime('');
      }
      setStep(3);
    } catch (err) {
      setError(err.message || 'Erro ao carregar horários.');
    } finally {
      setLoading(l => ({ ...l, times: false }));
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedServiceId || !selectedBarberId || !selectedTime) {
      return setFormError('Preencha todos os campos.');
    }

    setConfirming(true);
    setFormError('');
    try {
      const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
      if (!user?.id) throw new Error('Faça login para agendar.');

      await createAppointment({
        userId: user.id,
        barberId: Number(selectedBarberId),
        serviceId: Number(selectedServiceId),
        date: formatDateISO(selectedDate),
        time: selectedTime
      });

      setConfirmationData({
        barberName: barbers.find(b => String(b.id) === String(selectedBarberId))?.name,
        serviceName: services.find(s => String(s.id) === String(selectedServiceId))?.name,
        date: formatDateISO(selectedDate),
        time: selectedTime
      });
      setShowConfirmation(true);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setConfirming(false);
    }
  };

  const HeaderTitle = ({ title, sub }) => (
    <div className="booking-title-block">
      <h2 className="booking-title">{title}</h2>
      <p className="booking-subtitle">{sub}</p>
    </div>
  );

  return (
    <div className="booking-root">
      <div className="booking-stage">
        <div className="booking-stage-title">
          {['ESCOLHER SERVIÇO', 'ESCOLHER BARBEIRO', 'ESCOLHER DATA', 'ESCOLHER HORÁRIO'][step]}
        </div>

        <WaitlistConfirmationModal
          isOpen={showWaitlistModal}
          onClose={() => {
            setShowWaitlistModal(false);
            setWaitlistConfirmationData(null);
            navigate('/home');
          }}
          waitlistData={waitlistConfirmationData}
        />

        
        <div className="booking-phone">
        <div className="booking-shell">


            <header className="booking-header">
              <button className="booking-back" onClick={() => step > 0 ? setStep(s => s - 1) : onBack?.()} />
              <div className="booking-header-center"><span className="booking-header-label">NOVO AGENDAMENTO</span></div>
              <div className="booking-header-avatar"><img src={avatarImage} alt="Barbeiro" /></div>
            </header>

            <div className="booking-body">
              {error && (
  <div className="booking-error">
    {error}
  </div>
)}
              {step === 0 && (
                <section className="booking-section">
                  <HeaderTitle title="ESCOLHA O SERVIÇO" sub="Selecione o que deseja realizar" />
                  <div className="booking-divider" />
                  
                  {loading.data ? <div className="booking-loader">Carregando...</div> : (
                    <div className="service-grid">
                      {services.map((s, i) => (
                        <button key={s.id} className={`service-card ${selectedServiceId === String(s.id) ? 'is-selected' : ''}`} onClick={() => setSelectedServiceId(String(s.id))}>
                          <div className={`service-media service-media--${getServiceVariant(s.name)}`} style={{ backgroundImage: `url(${avatarImage})` }}>
                            {selectedServiceId === String(s.id) && <span className="service-avatar"><img src={avatarImage} alt="Sel" /></span>}
                          </div>
                          <div className="service-info">
                            <span className="service-name">{String(s.name).toUpperCase()}</span>
                            {s.price && <span className="service-price"><span className="service-currency">R$</span><span className="service-amount">{formatPrice(s.price)}</span></span>}
                          </div>
                          <span className="service-select" />
                        </button>
                      ))}
                    </div>
                  )}
                  <button className="booking-cta" onClick={() => setStep(1)} disabled={!selectedServiceId}>CONTINUAR</button>
                </section>
              )}

              {step === 1 && (
                <section className="booking-section">
                  <HeaderTitle title="BARBEIROS" sub="Selecione o profissional" />
                  <div className="booking-divider" />
                  
                  <div className="barber-list">
                    {barbers.map(b => (
                      <button key={b.id} className={`barber-card ${selectedBarberId === String(b.id) ? 'is-selected' : ''}`} onClick={() => setSelectedBarberId(String(b.id))}>
                        <div className="barber-left"><span className="barber-icon" /><span className="barber-name">{b.name}</span></div>
                        <div className="barber-right">
                          <span className={`barber-check ${selectedBarberId === String(b.id) ? 'is-selected' : ''}`} />
                          {selectedBarberId === String(b.id) && <span className="barber-avatar"><img src={avatarImage} alt="Sel" /></span>}
                        </div>
                      </button>
                    ))}
                  </div>
                  <button className="booking-cta" onClick={() => setStep(2)} disabled={!selectedBarberId}>CONTINUAR</button>
                </section>
              )}

              {step === 2 && (
                <section className="booking-section">
                  <HeaderTitle title="ESCOLHA A DATA" sub="Selecione o dia disponível" />
                  <div className="booking-divider" />

                  <div className="calendar">
                    <div className="calendar-header">
                      <button className="calendar-nav" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} />
                      <div className="calendar-month">{calendarMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</div>
                      <button className="calendar-nav calendar-nav--next" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} />
                    </div>
                    
                    <div className="calendar-week">{weekdayLabels.map(l => <span key={l}>{l}</span>)}</div>
                    
                    <div className="calendar-grid">
                      {calendarDays.map((d, i) => d ? (
                        <button key={d.toISOString()} className={`calendar-day ${d.getTime() === selectedDate.getTime() ? 'is-selected' : (d < today ? 'is-unavailable' : 'is-available')}`} onClick={() => setSelectedDate(d)} disabled={d < today}>
                          {d.getDate()}
                        </button>
                      ) : <div key={i} className="calendar-empty" />)}
                    </div>
                  </div>
                  
                  <button className="booking-cta" onClick={() => fetchTimes(selectedBarberId)} disabled={loading.times}>{loading.times ? 'CARREGANDO...' : 'VER HORÁRIOS'}</button>
                </section>
              )}

              {step === 3 && (
                <section className="booking-section">
                  <div className="booking-title-block">
                    <h2 className="booking-title">ESCOLHA O HORÁRIO</h2>
                    <div className="date-chip"><span className="chip-icon" />{selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</div>
                  </div>
                  <div className="booking-divider" />

                  {loading.times ? <div className="booking-loader">Carregando...</div> : availableSet.size === 0 ? (
                    <div className="no-availability">
                      <div className="no-availability-message">Nenhum horário disponível.</div>
                      <div className="no-availability-subtitle">Tente outro profissional:</div>
                      {loading.alternatives ? <div className="booking-loader">Buscando...</div> : (
                        <div className="barber-list">
                          {alternativeBarbers.map(b => (
                            <button key={b.id} className={`barber-card ${alternativeBarberId === String(b.id) ? 'is-selected' : ''}`} onClick={() => setAlternativeBarberId(String(b.id))}>
                              <div className="barber-left"><span className="barber-name">{b.name}</span></div>
                              <div className="barber-right"><span className={`barber-check ${alternativeBarberId === String(b.id) ? 'is-selected' : ''}`} /></div>
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="no-availability-actions">
                        <button className="booking-cta booking-cta--ghost" onClick={() => setStep(2)}>OUTRO DIA</button>
                        <button className="booking-cta" onClick={() => fetchTimes(alternativeBarberId)} disabled={!alternativeBarberId || loading.times}>CONTINUAR</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {timeGroups.map(group => (
                        <React.Fragment key={group.title}>
                          <h3 className="slot-title">{group.title}</h3>
                          <div className="slot-grid">
                            {group.slots.map(t => (
                              <button
                                key={t}
                                className={`slot-button ${selectedTime === t ? 'slot--selected' : (availableSet.has(t) ? 'slot--available' : 'slot--unavailable')}`}
                                onClick={() => {
                                  if (availableSet.has(t)) {
                                    setSelectedUnavailableTime('');
                                    setSelectedTime(t);
                                  } else {
                                    // RF15: horário indisponível -> permitir entrar na lista de espera
                                    setSelectedTime('');
                                    setSelectedUnavailableTime(t);
                                  }
                                }}
                              >
                                {availableSet.has(t) ? t : <span className="slot-dot" />}
                              </button>
                            ))}
                          </div>
                        </React.Fragment>
                      ))}
                      
                      <div className="booking-confirm" style={{marginTop: 16}}>
                        {formError && <div className="booking-error">{formError}</div>}

                        {/* RF15: se usuário selecionou um horário indisponível, aparece "Entrar na Lista" e esconde CONFIRMAR */}
                        {selectedUnavailableTime ? (
                          <WaitlistEntryPanel
                            selectedBarberId={selectedBarberId}
                            selectedDateISO={formatDateISO(selectedDate)}
                            selectedTime={selectedUnavailableTime}
                            alreadyInQueue={alreadyInQueue}
                            onSubmit={async ({ barberId, date, time }) => {
                              const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
                              if (!user?.id) throw new Error('Faça login para entrar na lista de espera.');

                              if (alreadyInQueue) throw new Error('Você já está na lista de espera para este período.');

                              setFormError('');
              
                              try {
                                const res = await createWaitlistEntry({
                                  barberId: Number(barberId),
                                  serviceId: Number(selectedServiceId),
                                  date,
                                  time,
                                });

                                if (!res?.success && typeof res?.position !== 'number') {
                                  throw new Error('Não foi possível entrar na lista de espera.');
                                }

                                setWaitlistConfirmationData({
                                  barberName: barbers.find(b => String(b.id) === String(barberId))?.name,
                                  date,
                                  time,
                                  position: res.position,
                                });

                                // cache visual de duplicidade no front
                                const raw = localStorage.getItem(waitlistCacheKey);
                                const list = raw ? JSON.parse(raw) : [];
                                if (!list.includes(String(time))) {
                                  list.push(String(time));
                                  localStorage.setItem(waitlistCacheKey, JSON.stringify(list));
                                }

                                setShowWaitlistModal(true);
                              } catch (err) {
                                throw err;
                              } finally {
                                
                              }
                            }}
                          />
                        ) : (
                          <button className="booking-cta" onClick={handleConfirmBooking} disabled={!selectedTime || confirming}>
                            {confirming ? 'ENVIANDO...' : 'CONFIRMAR'}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </section>
              )}
            </div>
          </div>
        </div>

        <AppointmentConfirmationModal isOpen={showConfirmation} onClose={() => { setShowConfirmation(false); navigate('/home'); }} appointmentData={confirmationData} />
      </div>
    </div>
  );
}