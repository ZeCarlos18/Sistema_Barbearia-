import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    FiBell,
    FiChevronDown,
    FiCheck,
    FiScissors,
    FiX,
} from "react-icons/fi";
import BottomNav from "../../components/BottomNav/BottomNav";
import {
    deactivateBarber,
    fetchBarberDetails,
    fetchBarbers,
} from "../../services/adminService";
import "../../styles/BarberChief/DashboardChief.css";

// No hardcoded fallbacks — show loaders or empty states when API has no data

function getStoredUser() {
    const stored = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!stored) return {};

    try {
        return JSON.parse(stored);
    } catch (error) {
        return {};
    }
}

function getInitials(name = "") {
    return String(name)
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
}

function formatCurrency(value) {
    return `R$${Number(value || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
}

function getDisplayDetails(selectedBarberId) {
    return {
        barber: { id: selectedBarberId, name: '', active: true, avatar: '' },
        metrics: { appointments: 0, revenue: 0, completed: 0 },
        chartTitle: 'Cortes Realizados',
        chartData: [],
        schedule: []
    };
}

export default function DashboardBarbeiro() {
    const navigate = useNavigate();
    const location = useLocation();
    const user = getStoredUser();
    const displayName = user.name || "Barbeiro Chefe";
    const agendaRef = React.useRef(null);

    const [activeNav, setActiveNav] = React.useState("dashboard");

    const [barbers, setBarbers] = React.useState([]);
    const [selectedBarberId, setSelectedBarberId] = React.useState(null);
    const [selectedBarberDetails, setSelectedBarberDetails] =
        React.useState(null);
    const [showDeactivateModal, setShowDeactivateModal] = React.useState(false);
    const [showScheduleSection, setShowScheduleSection] = React.useState(false);
    const [chartMode, setChartMode] = React.useState("cuts"); // 'cuts' or 'revenue'
    const [actionState, setActionState] = React.useState({
        loading: false,
        error: "",
        success: "",
    });
    const [loadingBarbers, setLoadingBarbers] = React.useState(true);
    const [loadingDetails, setLoadingDetails] = React.useState(false);
    const [loadError, setLoadError] = React.useState("");

    React.useEffect(() => {
        let isMounted = true;

        async function loadBarbers() {
            try {
                const list = await fetchBarbers();
                if (!isMounted) return;
                const normalized =
                    Array.isArray(list) && list.length > 0
                        ? list.map((barber, index) => ({
                            id: barber.id || index + 1,
                            name: barber.name || `Barbeiro ${index + 1}`,
                            avatar: barber.avatar || '',
                            active: barber.active !== false,
                        }))
                        : [];

                setBarbers(normalized);

                const preferred =
                    normalized.find((barber) => barber.name === "Felipe") ||
                    normalized[0];
                if (preferred) {
                    setSelectedBarberId(Number(preferred.id));
                }
                setLoadingBarbers(false);
            } catch (error) {
                if (!isMounted) return;
                setLoadError(error.message || "Erro ao carregar barbeiros");
                setBarbers([]);
                setSelectedBarberId(null);
                setLoadingBarbers(false);
            }
        }

        loadBarbers();

        return () => {
            isMounted = false;
        };
    }, []);

    React.useEffect(() => {
        // Sincroniza o estado do BottomNav de acordo com a rota atual
        const pathname = location.pathname;
        const searchParams = new URLSearchParams(location.search);
        const tab = searchParams.get("tab");
        const section = searchParams.get("section");

        if (pathname === "/dashboard-barbeiro") setActiveNav("dashboard");
        else if (pathname === "/barber-dashboard") setActiveNav("home");
        else if (pathname === "/barber-dashboard" && tab === "search")
            setActiveNav("search");
        else if (pathname === "/barber-chief" && section === "availability")
            setActiveNav("calendar");
        else if (pathname === "/barber-chief" && section === "menu")
            setActiveNav("profile");
        else setActiveNav("dashboard");
    }, [location.pathname, location.search]);

    React.useEffect(() => {
        let isMounted = true;

        async function loadDetails() {
            if (!selectedBarberId) return;
            setLoadingDetails(true);
            try {
                const details = await fetchBarberDetails(selectedBarberId);
                if (!isMounted) return;

                if (details) {
                    const detailsBarber = details.barber || {};
                    const statistics = details.statistics || {};
                    const cutsEntries = details.chartData?.cutsByDate
                        ? Object.entries(details.chartData.cutsByDate).map(
                            ([label, value]) => ({
                                label: label.toUpperCase().slice(0, 3),
                                value: Number(value) || 0,
                            }),
                        )
                        : getDisplayDetails(selectedBarberId).chartData;

                    const revenueEntries = details.chartData?.revenueByDate
                        ? Object.entries(details.chartData.revenueByDate).map(
                            ([label, value]) => ({
                                label: label.toUpperCase().slice(0, 3),
                                value: Number(value) || 0,
                            }),
                        )
                        : getDisplayDetails(selectedBarberId).chartData;

                    setSelectedBarberDetails({
                        barber: {
                            id: detailsBarber.id || selectedBarberId,
                            name:
                                detailsBarber.name ||
                                getDisplayDetails(selectedBarberId).barber.name,
                            active: detailsBarber.active !== false,
                            avatar:
                                detailsBarber.avatar ||
                                barbers.find(
                                    (barber) => Number(barber.id) === Number(selectedBarberId),
                                )?.avatar || '',
                        },
                        metrics: {
                            appointments:
                                Number(statistics.totalAppointments) ||
                                getDisplayDetails(selectedBarberId).metrics.appointments,
                            revenue:
                                Number(statistics.totalRevenue) ||
                                getDisplayDetails(selectedBarberId).metrics.revenue,
                            completed:
                                Number(statistics.completedAppointments) ||
                                getDisplayDetails(selectedBarberId).metrics.completed,
                        },
                        chartTitle: "Cortes Realizados",
                        chartDataCuts:
                            cutsEntries.length > 0
                                ? cutsEntries
                                : getDisplayDetails(selectedBarberId).chartData,
                        chartDataRevenue:
                            revenueEntries.length > 0
                                ? revenueEntries
                                : getDisplayDetails(selectedBarberId).chartData,
                        schedule: Array.isArray(details.schedule) ? details.schedule : [],
                    });
                } else {
                    setSelectedBarberDetails(getDisplayDetails(selectedBarberId));
                }
            } catch (error) {
                if (!isMounted) return;
                setLoadError(error.message || "Erro ao carregar detalhes");
                setSelectedBarberDetails(getDisplayDetails(selectedBarberId));
            } finally {
                setLoadingDetails(false);
            }
        }

        loadDetails();

        return () => {
            isMounted = false;
        };
    }, [selectedBarberId, barbers]);

    const selectedBarber =
        selectedBarberDetails?.barber ||
        (selectedBarberId
            ? getDisplayDetails(selectedBarberId).barber
            : { id: null, name: "", avatar: '' });
    const selectedMetrics = selectedBarberDetails?.metrics || {
        appointments: 0,
        revenue: 0,
        completed: 0,
    };
    const chartData =
        selectedBarberDetails?.chartData ||
        getDisplayDetails(selectedBarberId || 2).chartData;
    const chartTitle = selectedBarberDetails?.chartTitle || "Cortes Realizados";
    const chartDataCuts =
        selectedBarberDetails?.chartDataCuts ||
        getDisplayDetails(selectedBarberId || 2).chartData;
    const chartDataRevenue =
        selectedBarberDetails?.chartDataRevenue ||
        getDisplayDetails(selectedBarberId || 2).chartData;
    const selectedChartData =
        chartMode === "revenue" ? chartDataRevenue : chartDataCuts;

    function handleSelectBarber(barber) {
        setSelectedBarberId(Number(barber.id));
        setSelectedBarberDetails(getDisplayDetails(Number(barber.id)));
        // hide schedule section when selecting another barber
        setShowScheduleSection(false);
    }

    // Navbar (BottomNav)
    function handleNavigate(item) {
        if (item === "home") {
            setActiveNav("home");
            navigate("/barber-dashboard");
            return;
        }

        if (item === "dashboard") {
            setActiveNav("dashboard");
            navigate("/dashboard-barbeiro");
            return;
        }

        if (item === "search") {
            setActiveNav("search");
            navigate("/barber-dashboard?tab=search");
            return;
        }

        if (item === "calendar") {
            setActiveNav("calendar");
            navigate("/barber-chief?section=availability");
            return;
        }

        if (item === "profile") {
            setActiveNav("profile");
            navigate("/barber-chief?section=menu");
            return;
        }
    }

    async function handleDeactivateSelectedBarber() {
        setActionState({ loading: true, error: "", success: "" });
        try {
            await deactivateBarber(selectedBarber.id);
            setBarbers((current) =>
                current.map((barber) =>
                    Number(barber.id) === Number(selectedBarber.id)
                        ? { ...barber, active: false }
                        : barber,
                ),
            );
            setSelectedBarberDetails((current) => ({
                ...current,
                barber: { ...current.barber, active: false },
            }));
            setActionState({
                loading: false,
                error: "",
                success: "Barbeiro desativado com sucesso.",
            });
            setShowDeactivateModal(false);
        } catch (error) {
            setActionState({
                loading: false,
                error: error.message || "Não foi possível desativar.",
                success: "",
            });
        }
    }

    const maxBarValue = Math.max(
        ...selectedChartData.map((item) => item.value),
        1,
    );

    return (
        <div className="dashboard-mobile-page">
            <div className="dashboard-mobile-title">GERENCIAR BARBEIRO</div>

            <section className="dashboard-mobile-shell">
                <header className="dashboard-mobile-header">
                    <div className="dashboard-mobile-profile">
                        <div className="dashboard-mobile-avatar">
                            {getInitials(displayName)}
                        </div>
                        <div className="dashboard-mobile-greeting">
                            <span>Bem-Vindo</span>
                            <strong>{displayName}</strong>
                            <p>Dashboard Barbeiro</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="dashboard-mobile-icon-btn"
                        aria-label="Notificações"
                    >
                        <FiBell size={17} />
                    </button>
                </header>

                <main className="dashboard-mobile-content" ref={agendaRef}>
                    <section className="dashboard-mobile-section">
                        <h2>Lista de Barbeiros</h2>

                        <div
                            className="dashboard-mobile-barbers"
                            role="list"
                            aria-label="Lista de barbeiros"
                        >
                            {loadingBarbers ? (
                                <div className="dashboard-mobile-loading">
                                    Carregando barbeiros...
                                </div>
                            ) : loadError ? (
                                <div className="dashboard-mobile-error">{loadError}</div>
                            ) : barbers.length === 0 ? (
                                <div className="dashboard-mobile-empty">
                                    Nenhum barbeiro encontrado.
                                </div>
                            ) : (
                                barbers.slice(0, 3).map((barber) => {
                                    const isSelected =
                                        Number(barber.id) === Number(selectedBarberId);
                                    return (
                                        <button
                                            key={barber.id}
                                            type="button"
                                            className={`dashboard-mobile-barber ${isSelected ? "is-selected" : ""}`}
                                            onClick={() => handleSelectBarber(barber)}
                                            role="listitem"
                                        >
                                            <div className="dashboard-mobile-barber-photo-wrap">
                                                <img
                                                    src={barber.avatar}
                                                    alt={barber.name}
                                                    className="dashboard-mobile-barber-photo"
                                                    loading="lazy"
                                                />
                                                {isSelected ? (
                                                    <span className="dashboard-mobile-barber-badge">
                                                        <FiCheck size={11} />
                                                    </span>
                                                ) : null}
                                            </div>
                                            <span>{barber.name}</span>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </section>

                    <section className="dashboard-mobile-metrics">
                        <article className="dashboard-mobile-metric-card">
                            <strong>{selectedMetrics.completed}</strong>
                            <span>Atendimentos realizados</span>
                        </article>
                        <article className="dashboard-mobile-metric-card">
                            <strong>{formatCurrency(selectedMetrics.revenue)}</strong>
                            <span>Lucro gerado</span>
                        </article>
                        <article className="dashboard-mobile-metric-card">
                            <strong>{selectedMetrics.appointments}</strong>
                            <span>Agendamentos</span>
                        </article>
                    </section>

                    <section className="dashboard-mobile-actions">
                        <button
                            type="button"
                            className="dashboard-mobile-button dashboard-mobile-button--primary"
                            onClick={() => {
                                setShowScheduleSection(true);
                                // scroll to schedule section
                                setTimeout(() => {
                                    agendaRef.current?.scrollIntoView({
                                        behavior: "smooth",
                                        block: "start",
                                    });
                                }, 80);
                            }}
                        >
                            VER AGENDA
                        </button>
                        <button
                            type="button"
                            className="dashboard-mobile-button dashboard-mobile-button--outline"
                            onClick={() => setShowDeactivateModal(true)}
                        >
                            DESATIVAR
                        </button>
                    </section>

                    <section className="dashboard-mobile-filter">
                        <div
                            className="dashboard-mobile-chip"
                            role="tablist"
                            aria-label="Selecionar métrica do gráfico"
                        >
                            <button
                                type="button"
                                className={`dashboard-mobile-chip-btn ${chartMode === "cuts" ? "is-active" : ""}`}
                                onClick={() => setChartMode("cuts")}
                            >
                                <FiScissors size={12} />
                                <span>Cortes Realizados</span>
                            </button>
                            <button
                                type="button"
                                className={`dashboard-mobile-chip-btn ${chartMode === "revenue" ? "is-active" : ""}`}
                                onClick={() => setChartMode("revenue")}
                            >
                                <span>Faturamento</span>
                            </button>
                        </div>
                    </section>

                    <section className="dashboard-mobile-chart-card">
                        <div className="dashboard-mobile-chart-bars">
                            {selectedChartData.map((item) => (
                                <div key={item.label} className="dashboard-mobile-chart-column">
                                    <strong>{item.value}</strong>
                                    <div className="dashboard-mobile-chart-track">
                                        <span
                                            className="dashboard-mobile-chart-bar"
                                            style={{
                                                height: `${Math.max((item.value / maxBarValue) * 100, 22)}%`,
                                            }}
                                        />
                                    </div>
                                    <span>{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {showScheduleSection && (
                        <section
                            className="dashboard-mobile-schedule"
                            aria-label="Agenda do barbeiro"
                        >
                            <h3 className="dashboard-mobile-schedule-title">
                                Agenda de {selectedBarber.name}
                            </h3>
                            {Array.isArray(selectedBarberDetails.schedule) &&
                                selectedBarberDetails.schedule.length > 0 ? (
                                <div className="dashboard-mobile-schedule-list">
                                    {selectedBarberDetails.schedule.map((apt) => (
                                        <div
                                            key={apt.id}
                                            className="dashboard-mobile-schedule-item"
                                        >
                                            <div className="dashboard-mobile-schedule-time">
                                                {String(apt.time || "").slice(0, 5)}
                                            </div>
                                            <div className="dashboard-mobile-schedule-info">
                                                <strong>{apt.userName || "Cliente"}</strong>
                                                <div className="dashboard-mobile-schedule-meta">
                                                    {apt.serviceName || "Serviço"} • {apt.date}
                                                </div>
                                            </div>
                                            <div
                                                className={`dashboard-mobile-schedule-status ${apt.status || ""}`}
                                            >
                                                {apt.status}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="dashboard-mobile-empty">
                                    Nenhum agendamento encontrado para este barbeiro.
                                </div>
                            )}
                        </section>
                    )}
                </main>

                <BottomNav active={activeNav} onNavigate={(id) => handleNavigate(id)} />
            </section>

            {showDeactivateModal ? (
                <div
                    className="dashboard-mobile-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="deactivate-title"
                >
                    <div className="dashboard-mobile-modal-card">
                        <h3 id="deactivate-title">Desativar barbeiro?</h3>
                        <p>
                            Deseja realmente desativar <strong>{selectedBarber.name}</strong>?
                        </p>

                        {actionState.error ? (
                            <div className="dashboard-mobile-modal-message is-error">
                                {actionState.error}
                            </div>
                        ) : null}
                        {actionState.success ? (
                            <div className="dashboard-mobile-modal-message is-success">
                                {actionState.success}
                            </div>
                        ) : null}

                        <div className="dashboard-mobile-modal-actions">
                            <button
                                type="button"
                                className="dashboard-mobile-modal-button"
                                onClick={() => setShowDeactivateModal(false)}
                            >
                                <FiX size={14} />
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="dashboard-mobile-modal-button is-danger"
                                onClick={handleDeactivateSelectedBarber}
                                disabled={actionState.loading}
                            >
                                <FiCheck size={14} />
                                {actionState.loading ? "Processando..." : "Confirmar"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
