import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Booking.css';
import avatarImage from '../../assets/image.png';
import AppointmentConfirmationModal from '../../components/Modal/AppointmentConfirmationModal';
import {
  fetchServices,
  fetchBarbers,
  fetchAvailableTimes,
  createAppointment
} from '../../services/bookingService';

const fallbackBarbers = [
  { id: 1, name: 'Rafael' },
  { id: 2, name: 'Lucas' },
  { id: 3, name: 'Felipe' }
];

const weekdayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const monthLabels = [
  'Janeiro',
  'Fevereiro',
  'Marco',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];

const timeSlots = createTimeSlots();

function createTimeSlots() {
  const slots = [];
  for (let hour = 9; hour < 19; hour += 1) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  return slots;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatPrice(value) {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  const normalized = Number(String(value).replace(',', '.'));
  if (Number.isNaN(normalized)) {
    return String(value);
  }

  return String(Math.round(normalized));
}

function formatDateISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateLabel(date) {
  const weekday = [
    'Domingo',
    'Segunda',
    'Terca',
    'Quarta',
    'Quinta',
    'Sexta',
    'Sabado'
  ][date.getDay()];

  const month = monthLabels[date.getMonth()];
  const day = String(date.getDate()).padStart(2, '0');
  return `${weekday}, ${day} de ${month}`;
}

function getServiceVariant(service, index) {
  const name = String(service?.name || '').toLowerCase();
  if (name.includes('barb')) {
    return 'barba';
  }
  if (name.includes('degrad')) {
    return 'degrade';
  }
  if (name.includes('social')) {
    return 'social';
  }

  const variants = ['barba', 'degrade', 'social'];
  return variants[index % variants.length];
}

export default function Booking({ onBack }) {
  const navigate = useNavigate();
  const [step, setStep] = React.useState(0);
  const [services, setServices] = React.useState([]);
  const [barbers, setBarbers] = React.useState([]);
  const [selectedServiceId, setSelectedServiceId] = React.useState('');
  const [selectedBarberId, setSelectedBarberId] = React.useState('');
  const [alternativeBarbers, setAlternativeBarbers] = React.useState([]);
  const [alternativeBarberId, setAlternativeBarberId] = React.useState('');
  const [selectedDate, setSelectedDate] = React.useState(() => startOfDay(new Date()));
  const [calendarMonth, setCalendarMonth] = React.useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedTime, setSelectedTime] = React.useState('');
  const [availableTimes, setAvailableTimes] = React.useState([]);
  const [loading, setLoading] = React.useState({
    services: false,
    barbers: false,
    times: false,
    alternatives: false
  });
  const [error, setError] = React.useState('');

  const [confirming, setConfirming] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState('');
  const [formError, setFormError] = React.useState('');

  // Estados para o Modal de Confirmação
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState(null);

  const today = React.useMemo(() => startOfDay(new Date()), []);

  React.useEffect(() => {
    let isMounted = true;
    setLoading((current) => ({ ...current, services: true }));
    fetchServices()
      .then((data) => {
        if (!isMounted) return;
        setServices(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!isMounted) return;
        setServices([]);
        setError('Nao foi possivel carregar os servicos.');
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading((current) => ({ ...current, services: false }));
      });

    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    setLoading((current) => ({ ...current, barbers: true }));
    fetchBarbers()
      .then((data) => {
        if (!isMounted) return;
        setBarbers(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!isMounted) return;
        setBarbers([]);
        setError('Nao foi possivel carregar os barbeiros.');
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading((current) => ({ ...current, barbers: false }));
      });

    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    setAvailableTimes([]);
    setSelectedTime('');
    setAlternativeBarbers([]);
    setAlternativeBarberId('');
  }, [selectedBarberId, selectedDate]);

  const serviceOptions = services;
  const barberOptions = barbers.length > 0 ? barbers : fallbackBarbers;

  const stageTitle = ['ESCOLHER SERVICO', 'ESCOLHER BARBEIRO', 'ESCOLHER DATA', 'ESCOLHER HORARIO'][
    step
  ];

  const calendarDays = React.useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const start = new Date(year, month, 1);
    const startWeekday = start.getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < startWeekday; i += 1) {
      days.push(null);
    }

    for (let day = 1; day <= totalDays; day += 1) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [calendarMonth]);

  const nowMinutes = React.useMemo(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }, []);
  const isTodaySelected = selectedDate.getTime() === today.getTime();
  const visibleSlots = timeSlots.filter((time) => {
    if (!isTodaySelected) {
      return true;
    }

    const [hour, minute] = time.split(':').map(Number);
    const slotMinutes = hour * 60 + minute;
    return slotMinutes >= nowMinutes;
  });
  const visibleSlotSet = React.useMemo(() => new Set(visibleSlots), [visibleSlots]);
  const filteredAvailableTimes = React.useMemo(
    () => availableTimes.filter((time) => visibleSlotSet.has(time)),
    [availableTimes, visibleSlotSet]
  );
  const availableSet = React.useMemo(
    () => new Set(filteredAvailableTimes),
    [filteredAvailableTimes]
  );
  const morningSlots = visibleSlots.filter((time) => parseInt(time.split(':')[0], 10) < 12);
  const afternoonSlots = visibleSlots.filter((time) => parseInt(time.split(':')[0], 10) >= 12);

  const hasRealBarbers = barbers.length > 0;

  React.useEffect(() => {
    let isMounted = true;

    if (step !== 3 || filteredAvailableTimes.length > 0) {
      setAlternativeBarbers([]);
      setAlternativeBarberId('');
      return () => {
        isMounted = false;
      };
    }

    if (!hasRealBarbers) {
      const fallbackList = barberOptions.filter(
        (barber) => String(barber.id) !== String(selectedBarberId)
      );
      setAlternativeBarbers(fallbackList);
      return () => {
        isMounted = false;
      };
    }

    setLoading((current) => ({ ...current, alternatives: true }));
    setAlternativeBarbers([]);

    const dateKey = formatDateISO(selectedDate);
    const barbersToCheck = barberOptions.filter(
      (barber) => String(barber.id) !== String(selectedBarberId)
    );

    Promise.all(
      barbersToCheck.map(async (barber) => {
        try {
          const data = await fetchAvailableTimes(barber.id, dateKey);
          const times = Array.isArray(data.availableTimes) ? data.availableTimes : [];
          const filtered = times.filter((time) => visibleSlotSet.has(time));
          return filtered.length > 0 ? barber : null;
        } catch (requestError) {
          return null;
        }
      })
    )
      .then((results) => {
        if (!isMounted) return;
        setAlternativeBarbers(results.filter(Boolean));
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading((current) => ({ ...current, alternatives: false }));
      });

    return () => {
      isMounted = false;
    };
  }, [
    step,
    // depend only on lengths/primitives to avoid reference churn
    filteredAvailableTimes.length,
    selectedBarberId,
    selectedDate,
    barbers.length,
    hasRealBarbers,
    visibleSlots.length
  ]);

  function handleBack() {
    if (step > 0) {
      setStep((current) => current - 1);
    } else if (onBack) {
      onBack();
    }
  }

  function handleDateSelect(day) {
    setSelectedDate(startOfDay(day));
  }

  async function handleViewTimes() {
    if (!selectedBarberId || !selectedDate) {
      return;
    }

    setLoading((current) => ({ ...current, times: true }));
    setError('');

    try {
      const data = await fetchAvailableTimes(selectedBarberId, formatDateISO(selectedDate));
      setAvailableTimes(Array.isArray(data.availableTimes) ? data.availableTimes : []);
      setStep(3);
    } catch (requestError) {
      setAvailableTimes([]);
      setError(requestError.message || 'Nao foi possivel carregar os horarios.');
    } finally {
      setLoading((current) => ({ ...current, times: false }));
    }
  }

  async function handleAlternativeContinue() {
    if (!alternativeBarberId) {
      return;
    }

    setLoading((current) => ({ ...current, times: true }));
    setError('');

    try {
      const data = await fetchAvailableTimes(alternativeBarberId, formatDateISO(selectedDate));
      setSelectedBarberId(alternativeBarberId);
      setAvailableTimes(Array.isArray(data.availableTimes) ? data.availableTimes : []);
      setSelectedTime('');
      setStep(3);
    } catch (requestError) {
      setAvailableTimes([]);
      setError(requestError.message || 'Nao foi possivel carregar os horarios.');
    } finally {
      setLoading((current) => ({ ...current, times: false }));
    }
  }

  // handler para confirmar e salvar agendamento
  async function handleConfirmBooking() {
    if (!selectedServiceId || !selectedBarberId || !selectedTime || !selectedDate) {
      setFormError('Selecione serviço, barbeiro, data e horário antes de continuar.');
      return;
    }

    setFormError('');
    setConfirming(true);
    setSuccessMessage('');

    try {
      // obter userId do storage (o backend espera userId no body)
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user') || '{}';
      const user = JSON.parse(storedUser);
      const userId = user?.id;

      if (!userId) {
        throw new Error('Usuário não autenticado. Faça login antes de agendar.');
      }

      const serviceIdNum = Number(selectedServiceId);
      if (Number.isNaN(serviceIdNum)) {
        throw new Error('Serviço inválido. Selecione um serviço cadastrado.');
      }

      const payload = {
        userId,
        barberId: Number(selectedBarberId),
        serviceId: serviceIdNum,
        date: formatDateISO(selectedDate), // YYYY-MM-DD
        time: selectedTime // HH:MM
      };

      await createAppointment(payload);

      // Buscar informações do barbeiro e serviço selecionados para o modal
      const selectedBarber = barberOptions.find(b => String(b.id) === String(selectedBarberId));
      const selectedService = serviceOptions.find(s => String(s.id) === String(selectedServiceId));

      // Abrir modal de confirmação
      setConfirmationData({
        barberName: selectedBarber?.name || 'Barbeiro',
        serviceName: selectedService?.name || 'Serviço',
        date: formatDateISO(selectedDate),
        time: selectedTime
      });
      setShowConfirmation(true);

      // Limpar estado e voltar ao início
      setSelectedServiceId('');
      setSelectedBarberId('');
      setSelectedTime('');
      setAvailableTimes([]);
      setStep(0);
    } catch (err) {
      setFormError(err.message || 'Erro ao salvar agendamento.');
    } finally {
      setConfirming(false);
    }
  }

  // Função para fechar o modal e redirecionar
  function handleCloseConfirmation() {
    setShowConfirmation(false);
    setConfirmationData(null);
    // Redirecionar para Home
    navigate('/home');
  }

  const calendarMonthLabel = `${monthLabels[calendarMonth.getMonth()]} ${calendarMonth.getFullYear()}`;

  const selectedDateLabel = formatDateLabel(selectedDate);

  return (
    <div className="booking-root">
      <div className="booking-stage">
        <div className="booking-stage-title">{stageTitle}</div>
        <div className="booking-phone">
          <div className="booking-shell">
            <header className="booking-header">
              <button
                type="button"
                className="booking-back"
                onClick={handleBack}
                disabled={step === 0 && !onBack}
                aria-label="Voltar"
              />
              <div className="booking-header-center">
                <span className="booking-header-label">NOVO AGENDAMENTO</span>
              </div>
              <div className="booking-header-avatar">
                <img src={avatarImage} alt="Barbeiro" />
              </div>
            </header>

            <div className="booking-body">
              {step === 0 && (
                <section className="booking-section">
                  <div className="booking-title-block">
                    <h2 className="booking-title">ESCOLHA O SERVICO</h2>
                    <p className="booking-subtitle">Selecione o que deseja realizar</p>
                  </div>

                  <div className="booking-divider" />

                  {loading.services ? (
                    <div className="booking-loader">Carregando servicos...</div>
                  ) : serviceOptions.length === 0 ? (
                    <div className="booking-error">
                      Nenhum serviço disponível. Contate o administrador.
                    </div>
                  ) : (
                    <div className="service-grid">
                      {serviceOptions.map((service, index) => {
                        const id = String(service.id ?? index);
                        const isSelected = selectedServiceId === id;
                        const variant = getServiceVariant(service, index);
                        const priceText = formatPrice(service.price);

                        return (
                          <button
                            key={id}
                            type="button"
                            className={`service-card ${isSelected ? 'is-selected' : ''}`}
                            onClick={() => setSelectedServiceId(id)}
                          >
                            <div
                              className={`service-media service-media--${variant}`}
                              style={{ backgroundImage: `url(${avatarImage})` }}
                            >
                              {isSelected ? (
                                <span className="service-avatar">
                                  <img src={avatarImage} alt="Selecionado" />
                                </span>
                              ) : null}
                            </div>
                            <div className="service-info">
                              <span className="service-name">
                                {String(service.name || 'Servico').toUpperCase()}
                              </span>
                              {priceText ? (
                                <span className="service-price">
                                  <span className="service-currency">R$</span>
                                  <span className="service-amount">{priceText}</span>
                                </span>
                              ) : null}
                            </div>
                            <span className="service-select" aria-hidden="true" />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <button
                    type="button"
                    className="booking-cta"
                    onClick={() => setStep(1)}
                    disabled={!selectedServiceId}
                  >
                    CONTINUAR
                    <span className="booking-cta-arrow" aria-hidden="true" />
                  </button>
                </section>
              )}

              {step === 1 && (
                <section className="booking-section">
                  <div className="booking-title-block">
                    <h2 className="booking-title">BARBEIROS</h2>
                    <p className="booking-subtitle">Selecione o barbeiro de sua preferencia</p>
                  </div>

                  <div className="booking-divider" />

                  {loading.barbers ? (
                    <div className="booking-loader">Carregando barbeiros...</div>
                  ) : (
                    <div className="barber-list">
                      {barberOptions.map((barber, index) => {
                        const id = String(barber.id ?? index);
                        const isSelected = selectedBarberId === id;

                        return (
                          <button
                            key={id}
                            type="button"
                            className={`barber-card ${isSelected ? 'is-selected' : ''}`}
                            onClick={() => setSelectedBarberId(id)}
                          >
                            <div className="barber-left">
                              <span className="barber-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                                  <circle cx="12" cy="8" r="4" />
                                  <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                                </svg>
                              </span>
                              <span className="barber-name">{barber.name}</span>
                            </div>
                            <div className="barber-right">
                              <span className={`barber-check ${isSelected ? 'is-selected' : ''}`} />
                              {isSelected ? (
                                <span className="barber-avatar">
                                  <img src={avatarImage} alt="Selecionado" />
                                </span>
                              ) : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <button
                    type="button"
                    className="booking-cta"
                    onClick={() => setStep(2)}
                    disabled={!selectedBarberId}
                  >
                    CONTINUAR
                    <span className="booking-cta-arrow" aria-hidden="true" />
                  </button>
                </section>
              )}

              {step === 2 && (
                <section className="booking-section">
                  <div className="booking-title-block">
                    <h2 className="booking-title">ESCOLHA A DATA</h2>
                    <p className="booking-subtitle">Selecione o dia disponivel</p>
                  </div>

                  <div className="booking-divider" />

                  <div className="calendar">
                    <div className="calendar-header">
                      <button
                        type="button"
                        className="calendar-nav"
                        onClick={() =>
                          setCalendarMonth(
                            new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)
                          )
                        }
                        aria-label="Mes anterior"
                      />
                      <div className="calendar-month">{calendarMonthLabel}</div>
                      <button
                        type="button"
                        className="calendar-nav calendar-nav--next"
                        onClick={() =>
                          setCalendarMonth(
                            new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)
                          )
                        }
                        aria-label="Proximo mes"
                      />
                    </div>

                    <div className="calendar-week">
                      {weekdayLabels.map((label) => (
                        <span key={label}>{label}</span>
                      ))}
                    </div>

                    <div className="calendar-grid">
                      {calendarDays.map((day, index) => {
                        if (!day) {
                          return <div key={`empty-${index}`} className="calendar-empty" />;
                        }

                        const dayStart = startOfDay(day);
                        const isPast = dayStart < today;
                        const isSelected = dayStart.getTime() === selectedDate.getTime();

                        return (
                          <button
                            key={day.toISOString()}
                            type="button"
                            className={`calendar-day ${
                              isSelected ? 'is-selected' : isPast ? 'is-unavailable' : 'is-available'
                            }`}
                            onClick={() => handleDateSelect(day)}
                            disabled={isPast}
                          >
                            {day.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="calendar-legend">
                    <div className="legend-item">
                      <span className="legend-dot legend-dot--available" />
                      Disponivel
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot legend-dot--selected" />
                      Selecionado
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot legend-dot--unavailable" />
                      Indisponivel
                    </div>
                  </div>

                  <button
                    type="button"
                    className="booking-cta"
                    onClick={handleViewTimes}
                    disabled={!selectedBarberId || loading.times}
                  >
                    {loading.times ? 'CARREGANDO...' : 'VER HORARIOS'}
                    <span className="booking-cta-arrow" aria-hidden="true" />
                  </button>
                </section>
              )}

              {step === 3 && (
                <section className="booking-section">
                  <div className="booking-title-block">
                    <h2 className="booking-title">ESCOLHA O HORARIO</h2>
                    <div className="date-chip">
                      <span className="chip-icon" aria-hidden="true" />
                      {selectedDateLabel}
                    </div>
                    <p className="booking-subtitle">Selecione um horario disponivel</p>
                  </div>

                  <div className="booking-divider" />

                  {loading.times ? (
                    <div className="booking-loader">Carregando horarios...</div>
                  ) : (
                    <>
                      {filteredAvailableTimes.length === 0 ? (
                        <div className="no-availability">
                          <div className="no-availability-message">
                            O barbeiro selecionado nao possui horarios disponiveis nesta data.
                          </div>
                          <div className="no-availability-subtitle">
                            Selecione outro profissional disponivel
                          </div>

                          {loading.alternatives ? (
                            <div className="booking-loader">Buscando outros barbeiros...</div>
                          ) : (
                            <div className="barber-list alt-barber-list">
                              {alternativeBarbers.map((barber) => {
                                const id = String(barber.id);
                                const isSelected = alternativeBarberId === id;

                                return (
                                  <button
                                    key={id}
                                    type="button"
                                    className={`barber-card ${isSelected ? 'is-selected' : ''}`}
                                    onClick={() => setAlternativeBarberId(id)}
                                  >
                                    <div className="barber-left">
                                      <span className="barber-icon" aria-hidden="true">
                                        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                                          <circle cx="12" cy="8" r="4" />
                                          <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                                        </svg>
                                      </span>
                                      <span className="barber-name">{barber.name}</span>
                                    </div>
                                    <div className="barber-right">
                                      <span
                                        className={`barber-check ${
                                          isSelected ? 'is-selected' : ''
                                        }`}
                                      />
                                      {isSelected ? (
                                        <span className="barber-avatar">
                                          <img src={avatarImage} alt="Selecionado" />
                                        </span>
                                      ) : null}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          <div className="no-availability-actions">
                            <button
                              type="button"
                              className="booking-cta booking-cta--ghost"
                              onClick={() => setStep(2)}
                            >
                              ESCOLHER OUTRO DIA
                            </button>
                            <button
                              type="button"
                              className="booking-cta"
                              onClick={handleAlternativeContinue}
                              disabled={!alternativeBarberId || loading.times}
                            >
                              CONTINUAR
                              <span className="booking-cta-arrow" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h3 className="slot-title">MANHA</h3>
                          <div className="slot-grid">
                            {morningSlots.map((time) => {
                              const isAvailable = availableSet.has(time);
                              const isSelected = selectedTime === time;

                              return (
                                <button
                                  key={time}
                                  type="button"
                                  className={`slot-button ${
                                    isSelected
                                      ? 'slot--selected'
                                      : isAvailable
                                      ? 'slot--available'
                                      : 'slot--unavailable'
                                  }`}
                                  onClick={() => setSelectedTime(time)}
                                  disabled={!isAvailable}
                                >
                                  {isAvailable ? time : <span className="slot-dot" />}
                                </button>
                              );
                            })}
                          </div>

                          <h3 className="slot-title">TARDE</h3>
                          <div className="slot-grid">
                            {afternoonSlots.map((time) => {
                              const isAvailable = availableSet.has(time);
                              const isSelected = selectedTime === time;

                              return (
                                <button
                                  key={time}
                                  type="button"
                                  className={`slot-button ${
                                    isSelected
                                      ? 'slot--selected'
                                      : isAvailable
                                      ? 'slot--available'
                                      : 'slot--unavailable'
                                  }`}
                                  onClick={() => setSelectedTime(time)}
                                  disabled={!isAvailable}
                                >
                                  {isAvailable ? time : <span className="slot-dot" />}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </>
                  )}
                  {/* confirmação do agendamento */}
                  {filteredAvailableTimes.length > 0 ? (
                    <div className="booking-confirm">
                      {formError ? <div className="booking-error">{formError}</div> : null}
                      {successMessage ? (
                        <div className="booking-success">{successMessage}</div>
                      ) : null}

                      <button
                        type="button"
                        className="booking-cta"
                        onClick={handleConfirmBooking}
                        disabled={!selectedTime || confirming}
                      >
                        {confirming ? 'ENVIANDO...' : 'CONTINUAR'}
                        <span className="booking-cta-arrow" aria-hidden="true" />
                      </button>
                    </div>
                  ) : null}
                </section>
              )}

              {null}
            </div>
          </div>
        </div>

        {/* Modal de Confirmação de Agendamento */}
        <AppointmentConfirmationModal
          isOpen={showConfirmation}
          onClose={handleCloseConfirmation}
          appointmentData={confirmationData}
        />
      </div>
    </div>
  );
}
