import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getActiveNavItem } from '../utils/navHelper';
import PrimaryButton from '../components/PrimaryButton';
import BottomNav from '../components/BottomNav/BottomNav';
import './Welcome.css';
import hero from '../assets/image.png'; 

export default function Welcome({ onCreateAccount, onLogin }) {
  const location = useLocation();
  return (
    <div className="welcome-root">
          <div className="hero-card" style={{ backgroundImage: `url(${hero})` }}>
              <div className="hero-overlay" />
              <div className="hero-content">
                  <h1 className="hero-title">BARBER PRO</h1>
                  <p className="hero-sub">Estilo e precisão em cada detalhe</p>
                  <div className="hero-actions">
                      <PrimaryButton onClick={onCreateAccount}>CRIAR CONTA</PrimaryButton>
                      <PrimaryButton onClick={onLogin}>ENTRAR</PrimaryButton>
                  </div>
              </div>
          </div>

      <BottomNav 
        active={getActiveNavItem(location.pathname)}
        onNavigate={(page) => {
          if (page === 'home') onCreateAccount();
          else if (page === 'dashboard') onLogin();
          else if (page === 'calendar') onLogin();
          else if (page === 'profile') onLogin();
        }}
      />
      </div>
  );
}