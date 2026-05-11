import React from 'react';
import { FiHome, FiSearch, FiCalendar, FiUser } from 'react-icons/fi';
import './BottomNav.css';

export default function BottomNav({ active = 'home', onNavigate }) {
  const items = [
    { id: 'home', label: 'Home', Icon: FiHome },
    { id: 'search', label: 'Buscar', Icon: FiSearch },
    { id: 'calendar', label: 'Agenda', Icon: FiCalendar },
    { id: 'profile', label: 'Perfil', Icon: FiUser }
  ];

  return (
    <nav className="bottom-nav" aria-label="Navegação inferior">
      {items.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className={`bottom-nav__item ${active === id ? 'is-active' : ''}`}
          onClick={() => onNavigate?.(id)}
        >
          <Icon size={20} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}