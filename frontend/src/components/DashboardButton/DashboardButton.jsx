import React from 'react';
import { FiLayout } from 'react-icons/fi';
import './DashboardButton.css';

/**
 * Botão de Dashboard - Componente reutilizável
 * Segue o design padrão do sistema com cores ouro e ícone de layout
 * 
 * Props:
 *  - onClick: function - Callback ao clicar no botão
 *  - position: string - Posição do botão: 'bottom-right' (padrão), 'top-right', 'inline'
 *  - ariaLabel: string - Label de acessibilidade
 */
export default function DashboardButton({ 
  onClick, 
  position = 'bottom-right', 
  ariaLabel = 'Ir para Dashboard'
}) {
  return (
    <button
      type="button"
      className={`dashboard-btn dashboard-btn--${position}`}
      onClick={onClick}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <FiLayout size={20} />
      <span>Dashboard</span>
    </button>
  );
}
