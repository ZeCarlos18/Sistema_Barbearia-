/**
 * AppointmentCard - Componente que exibe um agendamento individual
 * 
 * Props:
 *  - appointment: object (obrigatório) - Dados do agendamento
 *    {
 *      id: number,
 *      serviceName: string,
 *      barberName: string,
 *      date: string (YYYY-MM-DD),
 *      time: string (HH:MM),
 *      status: string (confirmado | cancelado | concluído)
 *    }
 *  - onDelete: function (opcional) - Callback ao clicar em deletar
 * 
 * Exemplo:
 *  <AppointmentCard 
 *    appointment={appointment}
 *    onDelete={(id) => handleDelete(id)}
 *  />
 */

import React from 'react';
import { FiTrash2 } from 'react-icons/fi';
import StatusBadge from '../StatusBadge/StatusBadge';
import './AppointmentCard.css';

export default function AppointmentCard({ appointment, onDelete }) {
  const { id, serviceName, barberName, date, time, status } = appointment;

  /**
   * Função para formatar data de YYYY-MM-DD para formato legível
   * Ex: "2026-05-28" → "Ter, 28 de Maio"
   */
  function formatDate(dateString) {
    if (!dateString) return 'Data indefinida';
    
    // Garantir que estamos trabalhando com string
    const dateStr = String(dateString).trim();
    
    // Criar data usando split para evitar problemas de timezone
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    
    const date = new Date(year, parseInt(month) - 1, parseInt(day));
    
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const weekday = weekdays[date.getDay()];
    const dayNum = date.getDate();
    const monthName = months[date.getMonth()];

    return `${weekday}, ${dayNum} de ${monthName}`;
  }

  /**
   * Função para formatar hora de HH:MM:SS para HH:MM
   */
  function formatTime(timeString) {
    if (!timeString) return '--:--';
    // Pega apenas HH:MM da string HH:MM:SS
    return String(timeString).split(':').slice(0, 2).join(':');
  }

  return (
    <article className="appointment-card">
      {/* Seção superior: Status e botão deletar */}
      <div className="appointment-card__header">
        <StatusBadge status={status} />
        
        {/* Botão de deletar (opcional, apenas se callback fornecido) */}
        {onDelete && (
          <button
            className="appointment-card__delete"
            onClick={() => onDelete(id)}
            title="Cancelar agendamento"
            type="button"
          >
            <FiTrash2 size={18} />
          </button>
        )}
      </div>

      {/* Seção central: Informações do agendamento */}
      <div className="appointment-card__content">
        {/* Coluna esquerda: Serviço e Barbeiro */}
        <div className="appointment-card__info">
          <h3 className="appointment-card__service">{serviceName}</h3>
          <p className="appointment-card__barber">{barberName}</p>
        </div>

        {/* Coluna direita: Data e Hora */}
        <div className="appointment-card__time-info">
          <span className="appointment-card__date">
            {formatDate(date)}
          </span>
          <strong className="appointment-card__time">
            {formatTime(time)}
          </strong>
        </div>
      </div>
    </article>
  );
}