import React from 'react';
import PrimaryButton from '../components/PrimaryButton';
import './Welcome.css';
import hero from '../assets/image.png'; 

export default function Welcome({ onCreateAccount, onLogin }) {
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
      </div>
  );
}