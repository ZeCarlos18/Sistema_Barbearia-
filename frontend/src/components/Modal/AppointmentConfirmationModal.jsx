/**
 * AppointmentConfirmationModal - Modal de confirmação de agendamento
 * 
 * Responsabilidades:
 * - Exibir confirmação após agendamento bem-sucedido
 * - Mostrar detalhes do agendamento (barbeiro, serviço, data, hora)
 * - Permitir fechar o modal
 * - Bloquear interação com fundo
 * 
 * Props:
 *  - isOpen: boolean (obrigatório) - Controla visibilidade
 *  - onClose: function (obrigatório) - Callback ao fechar
 *  - appointmentData: object (obrigatório) - Dados do agendamento
 *    {
 *      barberName: string,
 *      serviceName: string,
 *      date: string (YYYY-MM-DD),
 *      time: string (HH:MM ou HH:MM:SS)
 *    }
 * 
 * Exemplo:
 *  <AppointmentConfirmationModal
 *    isOpen={showConfirmation}
 *    onClose={() => setShowConfirmation(false)}
 *    appointmentData={{
 *      barberName: "Rafael",
 *      serviceName: "Corte Degradê",
 *      date: "2026-05-18",
 *      time: "14:30"
 *    }}
 *  />
 */

import React from 'react';
import PropTypes from 'prop-types';
import './AppointmentConfirmationModal.css';

export default function AppointmentConfirmationModal({ isOpen, onClose, appointmentData }) {
  // Se o modal não está aberto, não renderiza nada
  if (!isOpen || !appointmentData) {
    return null;
  }

  /**
   * Formatar data de YYYY-MM-DD para "Dia, DD de Mês"
   * Exemplo: "2026-05-18" → "Dom, 18 de Maio"
   */
  function formatDate(dateString) {
    if (!dateString) return 'Data indefinida';
    
    const [year, month, day] = String(dateString).split('-');
    const date = new Date(year, parseInt(month) - 1, parseInt(day));
    
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    return `${weekdays[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]}`;
  }

  /**
   * Formatar hora de HH:MM:SS para HH:MM
   * Exemplo: "14:30:00" → "14:30"
   */
  function formatTime(timeString) {
    if (!timeString) return '--:--';
    return String(timeString).split(':').slice(0, 2).join(':');
  }

  return (
    <>
      {/* Backdrop - fundo semi-transparente que bloqueia interação */}
      <div className="confirmation-modal__backdrop" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="confirmation-modal">
        
        {/* Ícone de Confirmação */}
        <div className="confirmation-modal__icon">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* Título */}
        <h1 className="confirmation-modal__title">
          Agendamento Confirmado
        </h1>

        {/* Seção de Detalhes */}
        <div className="confirmation-modal__details">
          
          {/* Linha 1: Barbeiro | Serviço */}
          <div className="confirmation-modal__detail-row">
            <div className="confirmation-modal__detail-item">
              <span className="confirmation-modal__label">Barbeiro:</span>
              <span className="confirmation-modal__value">
                {appointmentData.barberName}
              </span>
            </div>
            <div className="confirmation-modal__detail-item">
              <span className="confirmation-modal__label">Serviço</span>
              <span className="confirmation-modal__value">
                {appointmentData.serviceName}
              </span>
            </div>
          </div>

          {/* Linha 2: Data | Horário */}
          <div className="confirmation-modal__detail-row">
            <div className="confirmation-modal__detail-item">
              <span className="confirmation-modal__label">Data</span>
              <span className="confirmation-modal__value">
                {formatDate(appointmentData.date)}
              </span>
            </div>
            <div className="confirmation-modal__detail-item">
              <span className="confirmation-modal__label">Horário</span>
              <span className="confirmation-modal__value">
                {formatTime(appointmentData.time)}
              </span>
            </div>
          </div>

        </div>

        {/* Botão Fechar */}
        <button
          className="confirmation-modal__button"
          onClick={onClose}
          type="button"
        >
          Fechar
        </button>

      </div>
    </>
  );
}

/**
 * Validação de Props com PropTypes
 * Garante que os props corretos estão sendo passados
 */
AppointmentConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  appointmentData: PropTypes.shape({
    barberName: PropTypes.string.isRequired,
    serviceName: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    time: PropTypes.string.isRequired
  }).isRequired
};