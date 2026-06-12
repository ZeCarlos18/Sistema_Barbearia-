import React from 'react';
import { FiLayout } from 'react-icons/fi';
import './ChiefDashboardButton.css';

export default function ChiefDashboardButton({
  onClick,
  disabled = false,
  ariaLabel = 'Ir para Dashboard'
}) {
  return (
    <button
      type="button"
      className="chief-dashboard-btn"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <FiLayout size={18} />
      <span>Dashboard</span>
    </button>
  );
}

