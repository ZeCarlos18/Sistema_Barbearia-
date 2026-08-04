import React from 'react';
import { useLocation } from 'react-router-dom';
import { FiHome, FiLayout, FiPlus, FiCalendar, FiUser } from 'react-icons/fi';
import { getStoredUser } from '../../utils/authHelper';
import './BottomNav.css';

export default function BottomNav({ active = 'home', onNavigate }) {
  const location = useLocation();

  const hiddenPaths = ['/', '/login', '/register', '/recover', '/reset-password'];
  if (hiddenPaths.includes(location.pathname)) return null;

  const role = getStoredUser()?.role || null;

  const baseItems = [
    { id: 'home', label: 'Home', Icon: FiHome },
    { id: 'dashboard', label: 'Dashboard', Icon: FiLayout },
    { id: 'create', label: '', Icon: FiPlus },
    { id: 'calendar', label: 'Agenda', Icon: FiCalendar },
    { id: 'profile', label: 'Perfil', Icon: FiUser }
  ];

  const items = role === 'client' ? baseItems.filter((it) => it.id !== 'dashboard' && it.id !== 'create') : baseItems;

  return (
    <nav className="bottom-nav" aria-label="Navegação inferior">
      {items.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className={`bottom-nav__item bottom-nav__item--${id} ${id === 'create' ? 'bottom-nav__item--create' : ''} ${active === id ? 'is-active' : ''}`}
          onClick={() => onNavigate?.(id)}
        >
          <Icon size={20} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}