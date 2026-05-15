import React from 'react';
import Welcome from './views/Welcome';
import Register from './views/Register/Register';
import Login from './views/Login/Login';
import Home from './views/Home/Home';
import RecoverPassword from './views/RecoverPassword/RecoverPassword';
import Booking from './views/Booking/Booking';
import ClientSettings from './views/ClientSettings/ClientSettings';
import BarberChief from './views/BarberChief/BarberChief';
import BarberCreate from './views/BarberCreate/BarberCreate';

function getStoredUser() {
  const stored = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored);
  } catch (error) {
    return null;
  }
}

function App() {
  const [screen, setScreen] = React.useState('welcome');

  React.useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      return;
    }

    const user = getStoredUser();
    if (user?.role === 'admin' || user?.role === 'barber') {
      setScreen('barber-chief');
    } else {
      setScreen('home');
    }
  }, []);

  const handleCreate = () => setScreen('register');
  const handleLogin = () => setScreen('login');
  const handleRecover = () => setScreen('recover');
  const handleBack = () => setScreen('welcome');
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setScreen('welcome');
  };
  const handleStartBooking = () => setScreen('booking');
  const handleLoginSuccess = (user) => {
    if (user?.role === 'admin' || user?.role === 'barber') {
      setScreen('barber-chief');
    } else {
      setScreen('home');
    }
  };

  const handleClientNavigate = (page) => {
    if (page === 'home') {
      setScreen('home');
    }

    if (page === 'profile') {
      setScreen('client-settings');
    }

    if (page === 'calendar') {
      setScreen('booking');
    }
  };

  const handleBarberNavigate = (page) => {
    if (page === 'home') {
      setScreen('barber-chief');
    }
  };

  if (screen === 'home') {
    return (
      <Home
        onLogout={handleLogout}
        onStartBooking={handleStartBooking}
        onNavigate={handleClientNavigate}
      />
    );
  }

  if (screen === 'booking') {
    return <Booking onBack={() => setScreen('home')} />;
  }

  if (screen === 'client-settings') {
    return <ClientSettings onNavigate={handleClientNavigate} onLogout={handleLogout} />;
  }

  if (screen === 'barber-chief') {
    return (
      <BarberChief
        onOpenCreate={() => setScreen('barber-create')}
        onNavigate={handleBarberNavigate}
        onLogout={handleLogout}
      />
    );
  }

  if (screen === 'barber-create') {
    return <BarberCreate onBack={() => setScreen('barber-chief')} />;
  }

  if (screen === 'register') {
    return <Register onBack={handleBack} />;
  }

  if (screen === 'recover') {
    return <RecoverPassword onBackToLogin={() => setScreen('login')} />;
  }

  if (screen === 'login') {
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onGoToRegister={handleCreate}
        onGoToRecover={handleRecover}
      />
    );
  }

  return <Welcome onCreateAccount={handleCreate} onLogin={handleLogin} />;
}

export default App;