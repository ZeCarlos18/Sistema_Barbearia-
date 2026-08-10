import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiBell,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiHome,
  FiLayout,
  FiLock,
  FiLogOut,
  FiPlus,
  FiUserPlus,
  FiUser,
  FiUserX,
  FiUsers,
} from "react-icons/fi";
import { fetchAppointmentsByDate } from "../../services/dashboardService";
import {
  createAppointment,
  fetchServices,
} from "../../services/bookingService";
import {
  createUnavailability,
  fetchBarberSchedule,
  fetchBarberUnavailabilities,
  updateAppointmentStatus,
} from "../../services/availabilityService";
import { getStoredUser } from "../../utils/authHelper";
import "../../styles/BarberChief/BarberChief.css";

const normalizeDateValue = (value) => {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().split("T")[0];
  return String(value).split("T")[0];
};

const normalizeTimeValue = (value) => {
  if (!value) return "";
  if (value instanceof Date) {
    const hours = String(value.getHours()).padStart(2, "0");
    const minutes = String(value.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }
  const str = String(value);
  return str.length >= 5 ? str.slice(0, 5) : str;
};

const formatDateValue = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const formatTodayValue = () => {
  const today = new Date();
  return formatDateValue(today);
};

function buildTimeSlots(startHour = 9, endHour = 19, intervalMinutes = 30) {
  const slots = [];
  for (let hour = startHour; hour < endHour; hour += 1) {
    for (let minutes = 0; minutes < 60; minutes += intervalMinutes) {
      slots.push(
        `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
      );
    }
  }
  return slots;
}

function formatMonthYearLabel(date) {
  const formatted = date.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  return formatted
    .replace(" de ", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

export default function BarberChief({
  onOpenCreate,
  onLogout,
  onOpenDashboard,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getStoredUser();
  const displayName = user?.name || "Lucas";
  const barberId = user?.id || user?.userId || user?.barberId || user?._id;
  const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

  const getInitialSection = React.useCallback(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get("section");

    const sectionMap = {
      availability: { activeNav: "profile", profileView: "availability" },
      menu: { activeNav: "profile", profileView: "menu" },
      agenda: { activeNav: "agenda", profileView: "menu" },
    };

    return sectionMap[section] || { activeNav: "home", profileView: "menu" };
  }, [location.search]);

  const initialSection = getInitialSection();
  const [activeNav, setActiveNav] = React.useState(initialSection.activeNav);
  const todayStr = React.useMemo(formatTodayValue, []);
  const [selectedDate, setSelectedDate] = React.useState(todayStr);
  const [metrics, setMetrics] = React.useState({
    appointments: 0,
    profit: 0,
    remaining: 0,
  });
  const [agendaItems, setAgendaItems] = React.useState([]);
  const [status, setStatus] = React.useState({ loading: false, error: "" });
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [profileView, setProfileView] = React.useState(
    initialSection.profileView,
  );
  const [availabilityView, setAvailabilityView] = React.useState("calendar");
  const [availabilityMonth, setAvailabilityMonth] = React.useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [availabilityDate, setAvailabilityDate] = React.useState(todayStr);
  const [availabilityStatus, setAvailabilityStatus] = React.useState({
    loading: false,
    error: "",
  });
  const [availabilityAppointments, setAvailabilityAppointments] =
    React.useState([]);
  const [availabilityUnavailabilities, setAvailabilityUnavailabilities] =
    React.useState([]);
  const [availabilityAction, setAvailabilityAction] = React.useState({
    loading: false,
    error: "",
    success: "",
  });
  const [availabilityRefresh, setAvailabilityRefresh] = React.useState(0);
  const [selectedSlot, setSelectedSlot] = React.useState(null);
  const [rescheduleTarget, setRescheduleTarget] = React.useState(null);
  const [rescheduleTime, setRescheduleTime] = React.useState("");

  React.useEffect(() => {
    const section = new URLSearchParams(location.search).get("section");
    const routeMap = {
      availability: { nav: "profile", view: "availability" },
      menu: { nav: "profile", view: "menu" },
      agenda: { nav: "agenda", view: "menu" },
    };

    const route = routeMap[section] || { nav: "home", view: "menu" };

    setActiveNav(route.nav);
    setProfileView(route.view);
  }, [location.search]);

  React.useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setStatus({ loading: true, error: "" });
      try {
        const [appointments, services] = await Promise.all([
          fetchAppointmentsByDate(selectedDate),
          fetchServices(),
        ]);

        if (!isMounted) return;

        // Filtrar apenas agendamentos do barbeiro logado
        const barberAppointments = Array.isArray(appointments)
          ? appointments.filter((apt) => apt.barber_id === barberId)
          : [];

        const serviceMap = new Map(
          services.map((service) => [
            String(service.id),
            Number(service.price) || 0,
          ]),
        );

        const activeAppointments = barberAppointments.filter(
          (item) => String(item.status || "").toLowerCase() !== "cancelled",
        );
        const completedAppointments = barberAppointments.filter((item) =>
          ["confirmed", "completed"].includes(
            String(item.status || "").toLowerCase(),
          ),
        );

        const profitValue = completedAppointments.reduce((total, item) => {
          const price = serviceMap.get(String(item.service_id)) || 0;
          return total + price;
        }, 0);

        const remainingCount = Math.max(
          activeAppointments.length - completedAppointments.length,
          0,
        );

        setMetrics({
          appointments: activeAppointments.length,
          profit: Math.round(profitValue),
          remaining: remainingCount,
        });

        setAgendaItems(
          activeAppointments.map((item) => ({
            id: item.id,
            time: String(item.time || "").slice(0, 5),
            name: item.user_name || "Cliente",
            service: item.service_name || "Serviço",
            status: item.status || "pending",
          })),
        );
        setStatus({ loading: false, error: "" });
      } catch (error) {
        if (!isMounted) return;
        setStatus({
          loading: false,
          error: error.message || "Erro ao carregar painel.",
        });
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [selectedDate, barberId]);

  React.useEffect(() => {
    if (activeNav !== "profile" && profileView !== "menu") {
      setProfileView("menu");
      setAvailabilityView("calendar");
    }
  }, [activeNav, profileView]);

  React.useEffect(() => {
    if (
      activeNav !== "profile" ||
      profileView !== "availability" ||
      !barberId
    ) {
      return;
    }

    let isMounted = true;

    async function loadAvailability() {
      setAvailabilityStatus({ loading: true, error: "" });
      setAvailabilityAction({ loading: false, error: "", success: "" });

      try {
        const [appointments, unavailabilities] = await Promise.all([
          fetchBarberSchedule(barberId, availabilityDate),
          fetchBarberUnavailabilities(barberId),
        ]);

        if (!isMounted) return;

        setAvailabilityAppointments(
          Array.isArray(appointments) ? appointments : [],
        );
        setAvailabilityUnavailabilities(
          Array.isArray(unavailabilities) ? unavailabilities : [],
        );
        setAvailabilityStatus({ loading: false, error: "" });
      } catch (error) {
        if (!isMounted) return;
        setAvailabilityStatus({
          loading: false,
          error: error.message || "Erro ao carregar disponibilidade.",
        });
      }
    }

    loadAvailability();

    return () => {
      isMounted = false;
    };
  }, [activeNav, profileView, availabilityDate, barberId, availabilityRefresh]);

  React.useEffect(() => {
    if (profileView === "availability") {
      setSelectedSlot(null);
      setRescheduleTarget(null);
      setRescheduleTime("");
    }
  }, [availabilityDate, profileView]);

  function handleNavClick(id) {
    if (id === "create") {
      setActiveNav("create");
      onOpenCreate?.();
      return;
    }

    if (id === "dashboard") {
      setActiveNav("dashboard");
      if (typeof onOpenDashboard === "function") {
        onOpenDashboard();
      } else {
        navigate("/dashboard-barbeiro");
      }
      return;
    }

    setActiveNav(id);
  }

  function formatDateDisplay(dateStr) {
    const [year, month, day] = dateStr.split("-");
    const date = new Date(year, month - 1, day);
    const formatted = date
      .toLocaleDateString("pt-BR", {
        weekday: "short",
        day: "2-digit",
        month: "short",
      })
      .replace(/\./g, "");

    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(":").map((value) => Number(value));
    return (hours || 0) * 60 + (minutes || 0);
  }

  function getAgendaWeekDates(dateStr) {
    const baseDate = new Date(dateStr);
    baseDate.setHours(0, 0, 0, 0);
    const start = new Date(baseDate);
    start.setDate(baseDate.getDate() - baseDate.getDay());

    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }

  function handleAgendaDaySelect(date) {
    setSelectedDate(formatDateValue(date));
  }

  function handleAgendaWeekShift(offsetWeeks) {
    const baseDate = new Date(selectedDate);
    baseDate.setDate(baseDate.getDate() + offsetWeeks * 7);
    setSelectedDate(formatDateValue(baseDate));
  }

  function formatAgendaSummary(dateStr, count) {
    const date = new Date(dateStr);
    const weekdays = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
    const months = [
      "JAN",
      "FEV",
      "MAR",
      "ABR",
      "MAI",
      "JUN",
      "JUL",
      "AGO",
      "SET",
      "OUT",
      "NOV",
      "DEZ",
    ];
    const dayLabel = String(date.getDate()).padStart(2, "0");
    return `${weekdays[date.getDay()]} ${dayLabel} ${months[date.getMonth()]} - ${count} HORARIOS`;
  }

  function handleOpenAvailability() {
    setProfileView("availability");
    setAvailabilityView("calendar");
  }

  function handleBackToSettings() {
    setProfileView("menu");
    setAvailabilityView("calendar");
  }

  function handleAvailabilityDateSelect(day) {
    const year = availabilityMonth.getFullYear();
    const month = availabilityMonth.getMonth() + 1;
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setAvailabilityDate(dateStr);
    setSelectedSlot(null);
    setRescheduleTarget(null);
    setRescheduleTime("");
  }

  function changeAvailabilityMonth(offset) {
    setAvailabilityMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1),
    );
  }

  const isUnavailable = React.useCallback((dateStr, timeStr = null) => {
    return availabilityUnavailabilities.some((unav) => {
      const startDate = normalizeDateValue(unav.start_date || unav.startDate);
      const endDate = normalizeDateValue(unav.end_date || unav.endDate);

      if (!startDate || !endDate || dateStr < startDate || dateStr > endDate)
        return false;

      const startTime = normalizeTimeValue(unav.start_time || unav.startTime);
      const endTime = normalizeTimeValue(unav.end_time || unav.endTime);

      return (
        (!startTime && !endTime) ||
        !!(
          timeStr &&
          startTime &&
          endTime &&
          timeStr >= startTime &&
          timeStr <= endTime
        )
      );
    });
  }, [availabilityUnavailabilities]);

  const isDayUnavailable = React.useCallback((dateStr) => isUnavailable(dateStr), [isUnavailable]);

  const availabilitySlots = React.useMemo(() => {
    const times = buildTimeSlots();
    const appointmentsByTime = new Map(
      availabilityAppointments.map((appointment) => [
        normalizeTimeValue(appointment.time),
        appointment,
      ]),
    );

    return times.map((time) => {
      const appointment = appointmentsByTime.get(time) || null;
      const unavailable = isUnavailable(availabilityDate, time);
      const status = appointment
        ? "booked"
        : unavailable
          ? "disabled"
          : "available";

      return {
        time,
        status,
        appointment,
      };
    });
  }, [
    availabilityAppointments,
    availabilityDate,
    isUnavailable,
  ]);

  function handleSlotSelect(slot) {
    setSelectedSlot(slot);
    setAvailabilityAction((prev) => ({ ...prev, error: "", success: "" }));

    if (rescheduleTarget) {
      if (slot.status !== "available") {
        setAvailabilityAction((prev) => ({
          ...prev,
          error: "Selecione um horario disponivel para remarcar.",
        }));
        return;
      }

      if (normalizeTimeValue(rescheduleTarget.time) === slot.time) {
        setAvailabilityAction((prev) => ({
          ...prev,
          error: "Escolha um horario diferente do atual.",
        }));
        return;
      }

      setRescheduleTime(slot.time);
    }
  }

  async function handleUnavailabilityAction(action, confirmMessage, payload) {
    if (!barberId || availabilityAction.loading) {
      setAvailabilityAction({
        loading: false,
        error: "Não foi possível identificar o barbeiro logado.",
        success: "",
      });
      return;
    }

    const confirm = window.confirm(confirmMessage);
    if (!confirm) return;

    setAvailabilityAction({ loading: true, error: "", success: "" });
    try {
      await action(payload);
      setAvailabilityAction({
        loading: false,
        error: "",
        success: payload.successMessage,
      });
      setSelectedSlot(null);
      setAvailabilityRefresh((prev) => prev + 1);
    } catch (error) {
      setAvailabilityAction({
        loading: false,
        error: error.message || payload.errorMessage,
        success: "",
      });
    }
  }

  async function handleDisableDay() {
    await handleUnavailabilityAction(
      (payload) =>
        createUnavailability({
          barberId,
          startDate: availabilityDate,
          endDate: availabilityDate,
          startTime: null,
          endTime: null,
          reason: "Dia indisponivel",
          action: "suggest_reschedule",
        }),
      "Deseja indisponibilizar este dia inteiro?",
      {
        successMessage: "Dia indisponibilizado.",
        errorMessage: "Erro ao indisponibilizar dia.",
      },
    );
  }

  async function handleDisableSlot() {
    if (!selectedSlot) return;

    const hasAppointment = Boolean(selectedSlot.appointment);
    const confirmMessage = hasAppointment
      ? "Esse horario possui agendamento. Cancelar e desativar horario?"
      : "Deseja desativar este horario?";

    if (!window.confirm(confirmMessage)) return;

    setAvailabilityAction({ loading: true, error: "", success: "" });
    try {
      if (hasAppointment) {
        await updateAppointmentStatus(selectedSlot.appointment.id, "cancelled");
      }

      await createUnavailability({
        barberId,
        startDate: availabilityDate,
        endDate: availabilityDate,
        startTime: selectedSlot.time,
        endTime: selectedSlot.time,
        reason: "Horario desativado",
        action: "maintenance_warning",
      });

      setAvailabilityAction({
        loading: false,
        error: "",
        success: "Horario desativado.",
      });
      setSelectedSlot(null);
      setAvailabilityRefresh((prev) => prev + 1);
    } catch (error) {
      setAvailabilityAction({
        loading: false,
        error: error.message || "Erro ao desativar horario.",
        success: "",
      });
    }
  }

  async function handleCancelAppointment(appointmentId) {
    if (!appointmentId || availabilityAction.loading) return;
    if (!window.confirm("Cancelar este agendamento?")) return;

    setAvailabilityAction({ loading: true, error: "", success: "" });
    try {
      await updateAppointmentStatus(appointmentId, "cancelled");
      setAvailabilityAction({
        loading: false,
        error: "",
        success: "Agendamento cancelado.",
      });
      setSelectedSlot(null);
      setAvailabilityRefresh((prev) => prev + 1);
    } catch (error) {
      setAvailabilityAction({
        loading: false,
        error: error.message || "Erro ao cancelar agendamento.",
        success: "",
      });
    }
  }

  function handleStartReschedule(appointment) {
    setRescheduleTarget(appointment);
    setRescheduleTime("");
    setAvailabilityAction({ loading: false, error: "", success: "" });
  }

  function handleCancelReschedule() {
    setRescheduleTarget(null);
    setRescheduleTime("");
  }

  async function handleConfirmReschedule() {
    if (!rescheduleTarget || !rescheduleTime || availabilityAction.loading)
      return;

    setAvailabilityAction({ loading: true, error: "", success: "" });
    try {
      const userId = rescheduleTarget.user_id || rescheduleTarget.userId;
      const serviceId =
        rescheduleTarget.service_id || rescheduleTarget.serviceId;

      await createAppointment({
        userId,
        barberId,
        serviceId,
        date: availabilityDate,
        time: rescheduleTime,
      });

      await updateAppointmentStatus(rescheduleTarget.id, "cancelled");

      setAvailabilityAction({
        loading: false,
        error: "",
        success: "Agendamento remarcado.",
      });
      setRescheduleTarget(null);
      setRescheduleTime("");
      setSelectedSlot(null);
      setAvailabilityRefresh((prev) => prev + 1);
    } catch (error) {
      setAvailabilityAction({
        loading: false,
        error: error.message || "Erro ao remarcar.",
        success: "",
      });
    }
  }

  function renderAvailabilityCalendar() {
    const year = availabilityMonth.getFullYear();
    const month = availabilityMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const weeks = [];
    let currentDate = new Date(startDate);

    for (let i = 0; i < 6; i++) {
      const week = [];
      for (let j = 0; j < 7; j++) {
        week.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(week);
    }

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    return weeks.map((week, weekIdx) => (
      <div key={weekIdx} className="chief-calendar-row">
        {week.map((date, dayIdx) => {
          const isCurrentMonth = date.getMonth() === month;
          const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
          const isSelected = dateStr === availabilityDate;
          const isToday = dateStr === todayStr;
          const isUnavailable = isDayUnavailable(dateStr);

          return (
            <button
              key={dayIdx}
              type="button"
              onClick={() => handleAvailabilityDateSelect(date.getDate())}
              disabled={!isCurrentMonth}
              className={`chief-calendar-day ${isSelected ? "is-selected" : ""} ${isToday ? "is-today" : ""} ${isUnavailable ? "is-unavailable" : ""} ${!isCurrentMonth ? "is-outside" : ""}`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    ));
  }

  const agendaWeekDates = React.useMemo(
    () => getAgendaWeekDates(selectedDate),
    [selectedDate],
  );

  const agendaMonthLabel = React.useMemo(() => {
    const date = new Date(selectedDate);
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  }, [selectedDate]);

  const agendaSortedItems = React.useMemo(() => {
    const todayMinutes =
      selectedDate === todayStr
        ? timeToMinutes(normalizeTimeValue(new Date()))
        : null;

    return [...agendaItems].sort((a, b) => {
      const minutesA = timeToMinutes(a.time);
      const minutesB = timeToMinutes(b.time);

      if (todayMinutes === null) {
        return minutesA - minutesB;
      }

      const distanceA =
        minutesA >= todayMinutes
          ? minutesA - todayMinutes
          : minutesA + 24 * 60 - todayMinutes;
      const distanceB =
        minutesB >= todayMinutes
          ? minutesB - todayMinutes
          : minutesB + 24 * 60 - todayMinutes;

      if (distanceA !== distanceB) {
        return distanceA - distanceB;
      }

      return minutesA - minutesB;
    });
  }, [agendaItems, selectedDate, todayStr]);

  const agendaTimeline = React.useMemo(() => {
    return agendaSortedItems.map((item) => ({ type: "appointment", ...item }));
  }, [agendaSortedItems]);

  const agendaSummary = React.useMemo(
    () => formatAgendaSummary(selectedDate, agendaTimeline.length),
    [selectedDate, agendaTimeline.length],
  );

  const isProfile = activeNav === "profile";
  const isAgenda = activeNav === "agenda";
  const isProfileAvailability = isProfile && profileView === "availability";
  const isProfileMenu = isProfile && profileView === "menu";

  function renderLoadingOrError(loading, error, emptyMessage) {
    if (loading) {
      return <div className="chief-empty">Carregando agenda...</div>;
    }
    if (error) {
      return <div className="chief-empty">{error}</div>;
    }
    return null;
  }

  function renderAlert(error, success, loading) {
    if (loading || error || success) {
      return (
        <div className={`chief-alert ${error ? "is-error" : "is-success"}`}>
          {loading ? "Processando..." : error || success}
        </div>
      );
    }
    return null;
  }

  function renderHeaderContent() {
    if (isProfileAvailability) {
      return (
        <>
          <button
            className="chief-header-back"
            type="button"
            onClick={handleBackToSettings}
            aria-label="Voltar"
          >
            <FiChevronLeft size={18} />
          </button>
          <h1 className="chief-header-title">Gerenciar Disponibilidade</h1>
          <span className="chief-header-spacer" aria-hidden="true" />
        </>
      );
    }

    if (isProfileMenu) {
      return <h1 className="chief-header-title">Configuracoes</h1>;
    }

    if (isAgenda) {
      return (
        <>
          <div className="chief-profile chief-profile--agenda">
            <div className="chief-avatar" aria-hidden="true" />
            <div className="chief-greeting chief-greeting--agenda">
              <span>Barbeiro - {displayName}</span>
              <strong>Minha Agenda</strong>
            </div>
          </div>
          <div className="chief-actions">
            <button
              className="chief-icon-btn"
              type="button"
              aria-label="Notificacoes"
            >
              <FiBell size={18} />
            </button>
          </div>
        </>
      );
    }

    return (
      <>
        <div className="chief-profile">
          <div className="chief-avatar" aria-hidden="true" />
          <div className="chief-greeting">
            <span>Bem-Vindo</span>
            <strong>{displayName}</strong>
          </div>
        </div>
        <div className="chief-actions">
          <button
            className="chief-icon-btn"
            type="button"
            aria-label="Notificacoes"
          >
            <FiBell size={18} />
          </button>
          {user?.role === 'admin' ? (
            <button
              className="chief-create-btn"
              type="button"
              onClick={() => onOpenCreate ? onOpenCreate() : navigate('/barber-create')}
              aria-label="Criar Barbeiro"
            >
              <FiUserPlus size={16} />
            </button>
          ) : null}
        </div>
      </>
    );
  }

  return (
    <div className="chief-page">
      <div className="chief-stage">
        <span className="chief-stage-title">
          {activeNav === "agenda"
            ? "PAINEL DE AGENDA BARBEIRO"
            : activeNav === "profile"
              ? "CONFIGURACAO BARBEIRO"
              : "PAINEL BARBEIRO"}
        </span>

        <div className="chief-phone">
          <div className="chief-shell">
            <header
              className={`chief-header ${isProfile ? "chief-header--profile" : ""} ${isProfileAvailability ? "chief-header--subview" : ""}`}
            >
              {renderHeaderContent()}
              {/* Floating create: only in Chief screen — opens Manual Booking */}
              <button
                className="chief-create-fixed"
                type="button"
                onClick={() => onOpenCreate ? onOpenCreate() : navigate('/barber-manual')}
                aria-label="Criar Agendamento"
              >
                <FiPlus size={18} />
              </button>
            </header>

            <main className="chief-main">
              {activeNav === "home" && (
                <>
                  <section className="chief-metrics">
                    <div className="chief-metric-card">
                      <span className="chief-metric-value">
                        {metrics.appointments}
                      </span>
                      <span className="chief-metric-label">
                        ATENDIMENTOS HOJE
                      </span>
                    </div>
                    <div className="chief-metric-card">
                      <span className="chief-metric-value">
                        R${metrics.profit}
                      </span>
                      <span className="chief-metric-label">LUCRO DO DIA</span>
                    </div>
                    <div className="chief-metric-card">
                      <span className="chief-metric-value">
                        {metrics.remaining}
                      </span>
                      <span className="chief-metric-label">RESTANTES</span>
                    </div>
                  </section>

                  <section className="chief-agenda">
                    <h2 className="chief-section-title">Agenda do dia</h2>
                    <div className="chief-agenda-list">
                      {renderLoadingOrError(
                        status.loading,
                        status.error,
                        "Nenhum agendamento nesta data.",
                      )}
                      {!status.loading &&
                        !status.error &&
                        agendaItems.length === 0 && (
                          <div className="chief-empty">
                            Nenhum agendamento nesta data.
                          </div>
                        )}
                      {!status.loading &&
                        !status.error &&
                        agendaSortedItems.length > 0 &&
                        agendaSortedItems.map((item) => (
                          <article key={item.id} className="chief-agenda-item">
                            <span className="chief-agenda-time">
                              {item.time}
                            </span>
                            <div className="chief-agenda-info">
                              <strong>{item.name}</strong>
                              <span>{item.service}</span>
                            </div>
                          </article>
                        ))}
                    </div>
                  </section>
                </>
              )}

              {activeNav === "agenda" && (
                <section className="chief-agenda-screen">
                  <div className="chief-agenda-card">
                    <div className="chief-agenda-month">
                      <button
                        type="button"
                        className="chief-agenda-nav"
                        onClick={() => handleAgendaWeekShift(-1)}
                        aria-label="Semana anterior"
                      >
                        <FiChevronLeft size={16} />
                      </button>
                      <span className="chief-agenda-month-label">
                        {agendaMonthLabel}
                      </span>
                      <button
                        type="button"
                        className="chief-agenda-nav"
                        onClick={() => handleAgendaWeekShift(1)}
                        aria-label="Proxima semana"
                      >
                        <FiChevronRight size={16} />
                      </button>
                    </div>

                    <div className="chief-agenda-weekdays">
                      {WEEKDAYS.map((day) => (
                        <span key={day}>{day}</span>
                      ))}
                    </div>

                    <div className="chief-agenda-week">
                      {agendaWeekDates.map((date) => {
                        const dateStr = formatDateValue(date);
                        const isSelected = dateStr === selectedDate;
                        const isToday = dateStr === formatDateValue(new Date());
                        const isOutside =
                          date.getMonth() !== new Date(selectedDate).getMonth();

                        return (
                          <button
                            key={dateStr}
                            type="button"
                            className={`chief-agenda-day ${isSelected ? "is-selected" : ""} ${isToday ? "is-today" : ""} ${isOutside ? "is-outside" : ""}`}
                            onClick={() => handleAgendaDaySelect(date)}
                          >
                            {date.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="chief-agenda-summary">{agendaSummary}</div>

                  <div className="chief-agenda-list">
                    {renderLoadingOrError(
                      status.loading,
                      status.error,
                      "Nenhum agendamento nesta data.",
                    )}
                    {!status.loading &&
                      !status.error &&
                      agendaTimeline.length === 0 && (
                        <div className="chief-empty">
                          Nenhum agendamento nesta data.
                        </div>
                      )}
                    {!status.loading &&
                      !status.error &&
                      agendaTimeline.length > 0 &&
                      agendaTimeline.map((item) => (
                        <article
                          key={item.id || `${item.type}-${item.time}`}
                          className={`chief-agenda-row ${item.type === "break" ? "is-break" : ""}`}
                        >
                          <span className="chief-agenda-time">{item.time}</span>
                          <div className="chief-agenda-info">
                            <strong>
                              {item.type === "break" ? "Intervalo" : item.name}
                            </strong>
                            <span>
                              {item.type === "break"
                                ? "Intervalo"
                                : item.service}
                            </span>
                          </div>
                        </article>
                      ))}
                  </div>
                </section>
              )}

              {isProfileMenu && (
                <section className="chief-settings">
                  <div className="chief-settings-user">
                    <div className="chief-settings-avatar" aria-hidden="true" />
                    <strong className="chief-settings-name">
                      {displayName}
                    </strong>
                  </div>

                  <div className="chief-settings-card">
                    <button type="button" className="chief-settings-item">
                      <div className="chief-settings-item-left">
                        <span className="chief-settings-icon">
                          <FiUser size={14} />
                        </span>
                        <span className="chief-settings-label">
                          Editar Perfil
                        </span>
                      </div>
                      <span className="chief-settings-end">
                        <FiChevronRight
                          className="chief-settings-chevron"
                          size={16}
                        />
                      </span>
                    </button>

                    <button type="button" className="chief-settings-item">
                      <div className="chief-settings-item-left">
                        <span className="chief-settings-icon">
                          <FiLock size={14} />
                        </span>
                        <span className="chief-settings-label">
                          Alterar Senha
                        </span>
                      </div>
                      <span className="chief-settings-end">
                        <FiChevronRight
                          className="chief-settings-chevron"
                          size={16}
                        />
                      </span>
                    </button>

                    <div className="chief-settings-item chief-settings-item--toggle">
                      <div className="chief-settings-item-left">
                        <span className="chief-settings-icon">
                          <FiBell size={14} />
                        </span>
                        <span className="chief-settings-label">
                          Notificacoes
                        </span>
                      </div>
                      <div className="chief-settings-end chief-toggle-wrap">
                        <button
                          type="button"
                          className={`chief-toggle ${notificationsEnabled ? "is-on" : ""}`}
                          onClick={() =>
                            setNotificationsEnabled((prev) => !prev)
                          }
                          aria-pressed={notificationsEnabled}
                          aria-label="Alternar notificacoes"
                        >
                          <span className="chief-toggle-thumb" />
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="chief-settings-item"
                      onClick={handleOpenAvailability}
                    >
                      <div className="chief-settings-item-left">
                        <span className="chief-settings-icon">
                          <FiCalendar size={14} />
                        </span>
                        <span className="chief-settings-label">
                          Gerenciar Disponibilidade
                        </span>
                      </div>
                      <span className="chief-settings-end">
                        <FiChevronRight
                          className="chief-settings-chevron"
                          size={16}
                        />
                      </span>
                    </button>

                    <button
                      type="button"
                      className="chief-settings-item"
                      onClick={() => navigate("/barber-waitlist")}
                    >
                      <div className="chief-settings-item-left">
                        <span className="chief-settings-icon">
                          <FiUsers size={14} />
                        </span>

                        <span className="chief-settings-label">
                          Gerenciar Lista de Espera
                        </span>
                      </div>

                      <span className="chief-settings-end">
                        <FiChevronRight
                          className="chief-settings-chevron"
                          size={16}
                        />
                      </span>
                    </button>

                    <button
                      type="button"
                      className="chief-settings-item"
                      onClick={onOpenDashboard}
                    >
                      <div className="chief-settings-item-left">
                        <span className="chief-settings-icon">
                          <FiUserX size={14} />
                        </span>
                        <span className="chief-settings-label">
                          Desativar Barbeiros
                        </span>
                      </div>
                      <span className="chief-settings-end">
                        <FiChevronRight
                          className="chief-settings-chevron"
                          size={16}
                        />
                      </span>
                    </button>

                    <button
                      type="button"
                      className="chief-settings-logout"
                      onClick={onLogout}
                    >
                      <span>Sair da Conta</span>
                      <FiLogOut size={16} />
                    </button>
                  </div>
                </section>
              )}

              {isProfileAvailability && (
                <section className="chief-availability">
                  {availabilityView === "calendar" && (
                    <div className="chief-availability-card">
                      <div className="chief-calendar-header">
                        <button
                          type="button"
                          className="chief-calendar-nav"
                          onClick={() => changeAvailabilityMonth(-1)}
                        >
                          <FiChevronLeft size={16} />
                        </button>
                        <h2 className="chief-calendar-title">
                          {formatMonthYearLabel(availabilityMonth)}
                        </h2>
                        <button
                          type="button"
                          className="chief-calendar-nav"
                          onClick={() => changeAvailabilityMonth(1)}
                        >
                          <FiChevronRight size={16} />
                        </button>
                      </div>

                      <div className="chief-calendar-weekdays">
                        {WEEKDAYS.map((day) => (
                          <span key={day}>{day}</span>
                        ))}
                      </div>

                      <div className="chief-calendar-grid">
                        {renderAvailabilityCalendar()}
                      </div>

                      <div className="chief-calendar-legend">
                        <div className="chief-legend-item">
                          <span className="chief-legend-dot is-available" />
                          <span>Disponivel</span>
                        </div>
                        <div className="chief-legend-item">
                          <span className="chief-legend-dot is-selected" />
                          <span>Selecionado</span>
                        </div>
                        <div className="chief-legend-item">
                          <span className="chief-legend-dot is-unavailable" />
                          <span>Indisponivel</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {availabilityView === "calendar" && (
                    <div className="chief-availability-actions">
                      <button
                        type="button"
                        className="chief-secondary-btn"
                        onClick={() => setAvailabilityView("slots")}
                      >
                        Ver horarios
                      </button>
                      <button
                        type="button"
                        className="chief-danger-btn"
                        onClick={handleDisableDay}
                        disabled={availabilityAction.loading}
                      >
                        {availabilityAction.loading
                          ? "Indisponibilizando..."
                          : "Indisponibilizar dia"}
                      </button>

                      {renderAlert(
                        availabilityAction.error,
                        availabilityAction.success,
                        availabilityAction.loading,
                      )}
                    </div>
                  )}

                  {availabilityView === "slots" && (
                    <div className="chief-availability-slots">
                      <div className="chief-availability-top">
                        <button
                          type="button"
                          className="chief-link-btn"
                          onClick={() => setAvailabilityView("calendar")}
                        >
                          <FiChevronLeft size={14} />
                          <span>Voltar</span>
                        </button>
                        <span className="chief-availability-date">
                          {formatDateDisplay(availabilityDate)}
                        </span>
                      </div>

                      <div className="chief-availability-daycard">
                        <div>
                          <span className="chief-availability-daycard-label">
                            Dia selecionado
                          </span>
                          <strong>{formatDateDisplay(availabilityDate)}</strong>
                        </div>
                        <button
                          type="button"
                          className="chief-danger-btn"
                          onClick={handleDisableDay}
                        >
                          Indisponibilizar dia
                        </button>
                      </div>

                      {availabilityStatus.loading && (
                        <div className="chief-empty">
                          Carregando horarios...
                        </div>
                      )}
                      {availabilityStatus.error && (
                        <div className="chief-empty">
                          {availabilityStatus.error}
                        </div>
                      )}

                      {!availabilityStatus.loading &&
                        !availabilityStatus.error && (
                          <div className="chief-slots-grid">
                            {availabilitySlots.map((slot) => (
                              <button
                                key={slot.time}
                                type="button"
                                className={`chief-slot is-${slot.status} ${selectedSlot?.time === slot.time ? "is-selected" : ""} ${rescheduleTime === slot.time ? "is-reschedule" : ""}`}
                                onClick={() => handleSlotSelect(slot)}
                              >
                                {slot.time}
                              </button>
                            ))}
                          </div>
                        )}

                      {(availabilityAction.error ||
                        availabilityAction.success) && (
                        <div
                          className={`chief-alert ${availabilityAction.error ? "is-error" : "is-success"}`}
                        >
                          {availabilityAction.error ||
                            availabilityAction.success}
                        </div>
                      )}

                      {rescheduleTarget && (
                        <div className="chief-slot-detail">
                          <div className="chief-slot-detail-title">
                            Remarcar horario
                          </div>
                          <div className="chief-slot-detail-subtitle">
                            {rescheduleTarget.user_name || "Cliente"} •{" "}
                            {normalizeTimeValue(rescheduleTarget.time)}
                          </div>
                          <p className="chief-slot-detail-hint">
                            Selecione um novo horario disponivel.
                          </p>
                          <div className="chief-slot-actions">
                            <button
                              type="button"
                              className="chief-secondary-btn"
                              onClick={handleCancelReschedule}
                            >
                              Cancelar remarcacao
                            </button>
                            <button
                              type="button"
                              className="chief-primary-btn"
                              onClick={handleConfirmReschedule}
                              disabled={
                                !rescheduleTime || availabilityAction.loading
                              }
                            >
                              Salvar alteracao
                            </button>
                          </div>
                        </div>
                      )}

                      {!rescheduleTarget && selectedSlot?.appointment && (
                        <div className="chief-slot-detail">
                          <div className="chief-slot-detail-title">
                            1 cliente neste horario
                          </div>
                          <div className="chief-slot-detail-subtitle">
                            {selectedSlot.appointment.service_name || "Servico"}{" "}
                            • {selectedSlot.time}
                          </div>
                          <div className="chief-slot-detail-status">
                            Confirmado
                          </div>
                          <p className="chief-slot-detail-hint">
                            O que fazer com esse agendamento?
                          </p>
                          <div className="chief-slot-actions">
                            <button
                              type="button"
                              className="chief-danger-btn"
                              onClick={() =>
                                handleCancelAppointment(
                                  selectedSlot.appointment.id,
                                )
                              }
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              className="chief-secondary-btn"
                              onClick={() =>
                                handleStartReschedule(selectedSlot.appointment)
                              }
                            >
                              Remarcar
                            </button>
                          </div>
                          <button
                            type="button"
                            className="chief-outline-btn"
                            onClick={handleDisableSlot}
                          >
                            Desativar horario
                          </button>
                        </div>
                      )}

                      {!rescheduleTarget &&
                        selectedSlot &&
                        !selectedSlot.appointment && (
                          <div className="chief-slot-detail">
                            <div className="chief-slot-detail-title">
                              {selectedSlot.status === "disabled"
                                ? "Horario indisponivel"
                                : "Horario livre"}
                            </div>
                            <div className="chief-slot-detail-subtitle">
                              {selectedSlot.time}
                            </div>
                            <button
                              type="button"
                              className="chief-outline-btn"
                              onClick={handleDisableSlot}
                            >
                              Desativar horario
                            </button>
                          </div>
                        )}

                      {!rescheduleTarget && !selectedSlot && (
                        <button
                          type="button"
                          className="chief-outline-btn"
                          onClick={handleDisableDay}
                        >
                          Indisponibilizar dia inteiro
                        </button>
                      )}
                    </div>
                  )}
                </section>
              )}
            </main>

            <nav className="chief-nav" aria-label="Navegacao principal">
              <button
                type="button"
                className={`chief-nav-btn chief-nav-btn--home ${activeNav === "home" ? "is-active" : ""}`}
                onClick={() => handleNavClick("home")}
              >
                <FiHome size={18} />
                <span>Home</span>
              </button>

              <button
                type="button"
                className={`chief-nav-btn chief-nav-btn--dashboard ${activeNav === "dashboard" ? "is-active" : ""}`}
                onClick={() => handleNavClick("dashboard")}
                aria-label="Dashboard"
              >
                <FiLayout size={18} />
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                className={`chief-nav-btn chief-nav-btn--plus ${activeNav === "create" ? "is-active" : ""}`}
                onClick={() => handleNavClick("create")}
                aria-label="Cadastrar barbeiro"
              >
                <FiPlus size={22} />
              </button>

              <button
                type="button"
                className={`chief-nav-btn chief-nav-btn--agenda ${activeNav === "agenda" ? "is-active" : ""}`}
                onClick={() => handleNavClick("agenda")}
                aria-label="Agenda"
              >
                <FiCalendar size={18} />
                <span>Agenda</span>
              </button>

              <button
                type="button"
                className={`chief-nav-btn chief-nav-btn--profile ${activeNav === "profile" ? "is-active" : ""}`}
                onClick={() => handleNavClick("profile")}
                aria-label="Perfil"
              >
                <FiUser size={18} />
                <span>Perfil</span>
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* BottomNav removido: navegação consolidada no nav superior */}
    </div>
  );
}
