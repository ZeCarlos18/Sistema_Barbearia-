import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Importação das Views
import Welcome from './views/Welcome';
import Register from './views/Register/Register';
import Login from './views/Login/Login';
import Home from './views/Home/Home';
import RecoverPassword from './views/RecoverPassword/RecoverPassword';
import Booking from './views/Booking/Booking';
import ClientSettings from './views/ClientSettings/ClientSettings';
import BarberDashboard from './views/BarberDashboard/BarberDashboard';
import BarberChief from './views/BarberChief/BarberChief';
import BarberCreate from './views/BarberCreate/BarberCreate';
import Appointments from './views/Appointments/Appointments';


function getStoredUser() {
  const stored = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch (error) {
    return null;
  }
}

// 🛡️ Guardião de Rotas (Impede acesso sem login ou permissão)
function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const user = getStoredUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Se for cliente tentando acessar painel de barbeiro, volta para a home
    return <Navigate to="/" replace />; 
  }

  return children;
}

// 🗺️ Configuração das Rotas
function AppRoutes() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const user = getStoredUser();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    navigate('/');
  };

  const handleClientNavigate = (page) => {
    if (page === 'home') navigate('/home');
    if (page === 'calendar') navigate('/appointments');
    if (page === 'profile') navigate('/profile');
  };

  const handleBarberNavigate = (page) => {
    if (page === 'home') navigate('/barber-dashboard');
  };

  return (
    <Routes>
      {/* --- ROTAS PÚBLICAS --- */}
      <Route path="/" element={
        token && user ? (
          <Navigate to={user.role === 'admin' || user.role === 'barber' ? '/barber-dashboard' : '/home'} replace />
        ) : (
          <Welcome onCreateAccount={() => navigate('/register')} onLogin={() => navigate('/login')} />
        )
      } />
      
      <Route path="/login" element={
        <Login
          onLoginSuccess={(userData) => {
            if (userData?.role === 'admin' || userData?.role === 'barber') navigate('/barber-dashboard');
            else navigate('/home');
          }}
          onGoToRegister={() => navigate('/register')}
          onGoToRecover={() => navigate('/recover')}
        />
      } />
      <Route path="/register" element={<Register onBack={() => navigate('/')} />} />
      <Route path="/recover" element={<RecoverPassword onBackToLogin={() => navigate('/login')} />} />

      {/* --- ROTAS PRIVADAS (CLIENTES) --- */}
      <Route path="/home" element={
        <ProtectedRoute allowedRoles={['client']}>
          <Home onLogout={handleLogout} onStartBooking={() => navigate('/booking')} onNavigate={handleClientNavigate} />
        </ProtectedRoute>
      } />
      <Route path="/booking" element={
        <ProtectedRoute allowedRoles={['client']}>
          <Booking onBack={() => navigate('/home')} />
        </ProtectedRoute>
      } />
      <Route path="/appointments" element={
        <ProtectedRoute allowedRoles={['client']}>
          <Appointments onNavigate={handleClientNavigate} onLogout={handleLogout} />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute allowedRoles={['client']}>
          <ClientSettings onNavigate={handleClientNavigate} onLogout={handleLogout} />
        </ProtectedRoute>
      } />

      {/* --- ROTAS PRIVADAS (BARBEIROS E ADMIN) --- */}
      <Route path="/barber-dashboard" element={
        <ProtectedRoute allowedRoles={['barber', 'admin']}>
          <BarberDashboard onNavigate={handleBarberNavigate} />
        </ProtectedRoute>
      } />
      <Route path="/barber-create" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <BarberCreate onBack={() => navigate('/barber-dashboard')} />
        </ProtectedRoute>
      } />

      {/* Rota Fallback (Página 404 - Redireciona para o início) */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// 🚀 Ponto de Entrada da Aplicação
function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;