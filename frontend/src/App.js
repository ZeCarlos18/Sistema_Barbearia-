import React from 'react';
import Welcome from './views/Welcome';
import Register from './views/Register/Register';
import Login from './views/Login/Login';
import Home from './views/Home/Home';
import RecoverPassword from './views/RecoverPassword/RecoverPassword';
import Booking from './views/Booking/Booking';

function App() {
  const [screen, setScreen] = React.useState('welcome');

  React.useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      setScreen('home');
    }
  }, []);

  const handleCreate = () => setScreen('register');
  const handleLogin = () => setScreen('login');
  const handleRecover = () => setScreen('recover');
  const handleBack = () => setScreen('welcome');
  const handleLogout = () => setScreen('welcome');
  const handleStartBooking = () => setScreen('booking');
  const handleLoginSuccess = () => setScreen('home');

  if (screen === 'home') {
    return <Home onLogout={handleLogout} onStartBooking={handleStartBooking} />;
  }

  if (screen === 'booking') {
    return <Booking onBack={() => setScreen('home')} />;
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