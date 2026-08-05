import React from 'react';
import { FiBell } from 'react-icons/fi';
import ReminderSettings from '../../components/ReminderSettings/ReminderSettings';
import FilterTabs from '../../components/FilterTabs/FilterTabs';
import AppointmentCard from '../../components/AppointmentCard/AppointmentCard';
import EmptyState from '../../components/EmptyState/EmptyState';
import BottomNav from '../../components/BottomNav/BottomNav';
import RemoveFromHistoryModal from '../../components/Modal/RemoveFromHistoryModal';
import { getMyAppointments, cancelAppointment, deleteFromHistory } from '../../services/appointmentService';
import { getStoredUser } from '../../utils/authHelper';
import '../../styles/Client/Appointments.css';
import { isPastAppointment } from "../../utils/dateHelper";

const TABS = ['Todos', 'Próximos', 'Histórico'];

export default function Appointments({ onNavigate, onLogout }) {
  const [activeTab, setActiveTab] = React.useState('Todos');
  const [appointments, setAppointments] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const user = getStoredUser();
  const [reminderOpen, setReminderOpen] = React.useState(false);
  const [reminderSettings, setReminderSettings] = React.useState(() => {
    try {
      const raw = localStorage.getItem('reminderSettings');
      return raw ? JSON.parse(raw) : { lead: '1h', appChannel: true, emailChannel: false };
    } catch (e) {
      return { lead: '1h', appChannel: true, emailChannel: false };
    }
  });

  /**
   * Efeito: Buscar agendamentos ao carregar a página
   */
  React.useEffect(() => {
    async function loadAppointments() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getMyAppointments();
        
        // Transformar dados da API para o formato esperado pelo frontend
        const transformedData = data.map(apt => ({
          id: apt.id,
          serviceName: apt.service_name || 'Serviço',
          barberName: apt.barber_name || 'Barbeiro',
          date: apt.date,
          time: apt.time,
          status: transformStatus(apt.status)
        }));
        
        setAppointments(transformedData);
      } catch (err) {
        console.error('Erro ao carregar agendamentos:', err);
        setError(err.message || 'Erro ao carregar agendamentos');
      } finally {
        setIsLoading(false);
      }
    }

    loadAppointments();
  }, []);

  function transformStatus(apiStatus) {
    const statusMap = {
      'confirmed': 'confirmado',
      'completed': 'concluído',
      'cancelled': 'cancelado'
    };
    return statusMap[apiStatus] || 'confirmado';
  }

  const filteredAppointments = React.useMemo(() => {
    const getDateTime = (date, time) => {
      const cleanDate = String(date).trim().substring(0, 10);
      const cleanTime = time ? String(time).trim().substring(0, 8) : '00:00:00';
      const parsed = new Date(`${cleanDate}T${cleanTime}`);
      return isNaN(parsed.getTime()) ? new Date(0) : parsed;
    };

    switch (activeTab) {
      case 'Próximos':
        return appointments
          .filter(apt => !isPastAppointment(apt.date, apt.time) && apt.status === 'confirmado')
          .sort((a, b) => getDateTime(a.date, a.time) - getDateTime(b.date, b.time)); 

      case 'Histórico':
        return appointments
          .filter(apt => isPastAppointment(apt.date, apt.time) || apt.status !== 'confirmado')
          .sort((a, b) => getDateTime(b.date, b.time) - getDateTime(a.date, a.time)); 

      default: 
        return [...appointments].sort((a, b) => getDateTime(b.date, b.time) - getDateTime(a.date, a.time));
    }
  }, [activeTab, appointments]);

  async function handleDeleteAppointment(appointmentId) {
    if (!window.confirm('Tem certeza que deseja cancelar este agendamento?')) return;
    try {
      await cancelAppointment(appointmentId);
      setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
    } catch (err) {
      alert(`Erro ao cancelar: ${err.message}`);
    }
  }

  // --- Remover do histórico (RF28) ---
  const [removeModalOpen, setRemoveModalOpen] = React.useState(false);
  const [selectedToRemove, setSelectedToRemove] = React.useState(null);

  function openRemoveModal(appointmentId) {
    const apt = appointments.find(a => a.id === appointmentId);
    if (!apt) return;

    const dontAsk = localStorage.getItem('dontAskRemoveHistory') === '1';
    if (dontAsk) {
      // apagar sem perguntar
      handleConfirmRemove(appointmentId);
      return;
    }

    setSelectedToRemove(apt);
    setRemoveModalOpen(true);
  }

  async function handleConfirmRemove(appointmentId) {
    try {
      await deleteFromHistory(appointmentId);
      // Atualiza lista localmente: oculta do histórico do usuário
      setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
    } catch (err) {
      // Trate erros específicos do backend (403/409)
      const msg = err?.message || 'Erro ao remover do histórico';
      alert(msg);
    }
  }

  return (
    <div className="appointments-page">
      <div className="appointments-phone">
        <div className="appointments-shell">
          <header className="appointments-header">
            <div className="appointments-profile">
              <div className="appointments-avatar" aria-hidden="true" />
              <div className="appointments-greeting">
                <span className="appointments-username">{user?.name || 'Usuário'}</span>
                <span className="appointments-title">Meus Agendamentos</span>
              </div>
            </div>

            <button
              className="appointments-notification-btn"
              onClick={() => setReminderOpen(true)}
              type="button"
              aria-label="Notificações"
              title="Notificações"
            >
              <FiBell size={22} />
            </button>
            <ReminderSettings
              isOpen={reminderOpen}
              onClose={() => setReminderOpen(false)}
              initial={reminderSettings}
              onSave={(cfg) => setReminderSettings(cfg)}
            />
          </header>

          <main className="appointments-main">
            <FilterTabs
              tabs={TABS}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            <section className="appointments-section">
              {isLoading ? (
                <EmptyState title="Carregando..." description="Buscando seus agendamentos" />
              ) : error ? (
                <EmptyState
                  title="Erro ao carregar"
                  description={error}
                  buttonLabel="Tentar novamente"
                  onButtonClick={() => window.location.reload()}
                />
              ) : filteredAppointments.length > 0 ? (
                <div className="appointments-list">
                  {filteredAppointments.map(appointment => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      onDelete={handleDeleteAppointment}
                      onRemoveFromHistory={openRemoveModal}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Nenhum agendamento"
                  description={
                    activeTab === 'Próximos'
                      ? 'Você não tem agendamentos confirmados. Agende seu próximo corte!'
                      : activeTab === 'Histórico'
                      ? 'Você não tem histórico de agendamentos.'
                      : 'Comece a agendar seus cortes!'
                  }
                  buttonLabel={activeTab !== 'Histórico' ? 'Agendar agora' : undefined}
                  onButtonClick={activeTab !== 'Histórico' ? () => onNavigate('calendar') : undefined}
                />
              )}
            </section>
            {/* Modal para remoção do histórico */}
            <RemoveFromHistoryModal
              isOpen={removeModalOpen}
              onClose={() => setRemoveModalOpen(false)}
              onConfirm={handleConfirmRemove}
              appointment={selectedToRemove}
            />
          </main>

          <BottomNav active="calendar" onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  );
}