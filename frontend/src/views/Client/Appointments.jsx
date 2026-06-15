/**
 * Appointments - Página de agendamentos do cliente
 * * Responsabilidades:
 * - Gerenciar estado dos agendamentos
 * - Filtrar agendamentos (Todos, Próximos, Histórico)
 * - Ordenar agendamentos cronologicamente (Data e Hora)
 * - Exibir cards de agendamento
 * - Permitir deleção de agendamentos
 * * Props:
 * - onNavigate: function - Callback para navegação
 * - onLogout: function - Callback para logout
 */

import React from 'react';
import { FiBell } from 'react-icons/fi';
import ReminderSettings from '../../components/ReminderSettings/ReminderSettings';
import FilterTabs from '../../components/FilterTabs/FilterTabs';
import AppointmentCard from '../../components/AppointmentCard/AppointmentCard';
import EmptyState from '../../components/EmptyState/EmptyState';
import BottomNav from '../../components/BottomNav/BottomNav';
import { getMyAppointments, cancelAppointment } from '../../services/appointmentService';
import '../../styles/Client/Appointments.css';
import { isPastAppointment } from "../../utils/dateHelper";

/**
 * Constantes de abas
 */
const TABS = ['Todos', 'Próximos', 'Histórico'];

export default function Appointments({ onNavigate, onLogout }) {
  // Estado: qual aba está selecionada
  const [activeTab, setActiveTab] = React.useState('Todos');

  // Estado: lista de agendamentos (carregados da API)
  const [appointments, setAppointments] = React.useState([]);

  // Estado: carregamento
  const [isLoading, setIsLoading] = React.useState(true);

  // Estado: erro
  const [error, setError] = React.useState(null);

  // Recuperar dados do usuário armazenado
  const getStoredUser = () => {
    const stored = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch (error) {
      return null;
    }
  };

  const user = getStoredUser();

  // Reminder settings modal
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

  /**
   * Transformar status da API (confirmed, completed, cancelled) para formato exibido
   */
  function transformStatus(apiStatus) {
    const statusMap = {
      'confirmed': 'confirmado',
      'completed': 'concluído',
      'cancelled': 'cancelado'
    };
    return statusMap[apiStatus] || 'confirmado';
  }

/**
   * Filtrar agendamentos baseado na aba ativa
   * Usa useMemo para não recalcular a cada render
   */
  const filteredAppointments = React.useMemo(() => {
    // 🚀 Função auxiliar blindada para ordenação cronológica exata
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

  /**
   * Função para cancelar um agendamento
   * Faz requisição à API e atualiza o estado local
   */
  async function handleDeleteAppointment(appointmentId) {
    // Confirmar antes de deletar
    if (window.confirm('Tem certeza que deseja cancelar este agendamento?')) {
      try {
        await cancelAppointment(appointmentId);
        
        // Remover do estado local após sucesso
        setAppointments(prevAppointments =>
          prevAppointments.filter(apt => apt.id !== appointmentId)
        );
      } catch (err) {
        console.error('Erro ao cancelar agendamento:', err);
        alert(`Erro ao cancelar: ${err.message}`);
      }
    }
  }

  return (
    <div className="appointments-page">
      <div className="appointments-phone">
        <div className="appointments-shell">
          {/* --- HEADER --- */}
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

          {/* --- MAIN CONTENT --- */}
          <main className="appointments-main">
            {/* Abas de filtro */}
            <FilterTabs
              tabs={TABS}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            {/* Seção de agendamentos */}
            <section className="appointments-section">
              {/* Se está carregando */}
              {isLoading ? (
                <EmptyState
                  title="Carregando..."
                  description="Buscando seus agendamentos"
                />
              ) : error ? (
                /* Se houver erro */
                <EmptyState
                  title="Erro ao carregar"
                  description={error}
                  buttonLabel="Tentar novamente"
                  onButtonClick={() => window.location.reload()}
                />
              ) : filteredAppointments.length > 0 ? (
                /* Se houver agendamentos, mostrar cards */
                <div className="appointments-list">
                  {filteredAppointments.map(appointment => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      onDelete={handleDeleteAppointment}
                    />
                  ))}
                </div>
              ) : (
                /* Senão, mostrar estado vazio */
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
                  onButtonClick={
                    activeTab !== 'Histórico'
                      ? () => onNavigate('calendar')
                      : undefined
                  }
                />
              )}
            </section>
          </main>

          {/* --- BOTTOM NAV --- */}
          <BottomNav active="calendar" onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  );
}