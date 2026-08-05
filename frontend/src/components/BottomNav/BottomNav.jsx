import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiLayout, FiPlus, FiCalendar, FiUser } from 'react-icons/fi';
import { getStoredUser } from '../../utils/authHelper';
import './BottomNav.css';

export default function BottomNav({ active = 'home', onNavigate }) {
  const location = useLocation();
  const navigate = useNavigate();

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

  // Keep the create button visible for all roles; clients won't see the dashboard button
  const items = role === 'client' ? baseItems.filter((it) => it.id !== 'dashboard') : baseItems;

  function handleClick(id) {
    console.log('BottomNav click:', id, 'role:', role);
    if (id === 'create') {
      // prefer parent handler when provided
      if (onNavigate) return onNavigate(id);
      // fallback navigation based on role
      if (role === 'client') return navigate('/booking');
      if (role === 'admin') return navigate('/barber-create');
      return navigate('/barber-manual');
    }
    if (onNavigate) return onNavigate(id);
    // default fallbacks for other ids
    if (id === 'home') return navigate(role === 'client' ? '/home' : '/barber-dashboard');
    if (id === 'dashboard') return navigate(role === 'client' ? '/home' : '/dashboard-barbeiro');
    if (id === 'calendar') return navigate(role === 'client' ? '/appointments' : '/barber-chief?section=agenda');
    if (id === 'profile') return navigate(role === 'client' ? '/profile' : '/barber-chief?section=menu');
  }

  return (
    <nav className="bottom-nav" aria-label="Navegação inferior">
      {items.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className={`bottom-nav__item bottom-nav__item--${id} ${id === 'create' ? 'bottom-nav__item--create' : ''} ${active === id ? 'is-active' : ''}`}
          onClick={() => handleClick(id)}
        >
          <Icon size={20} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}