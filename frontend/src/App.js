import React from 'react';
import Welcome from './views/Welcome';
import Register from './views/Register/Register';
import Login from './views/Login/Login';
import Home from './views/Home/Home';

function App(){
  const [screen, setScreen] = React.useState('welcome');

  React.useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      setScreen('home');
    }
  }, []);

  const handleCreate = () => setScreen('register');
  const handleLogin = () => setScreen('login');
  const handleBack = () => setScreen('welcome');
  const handleLogout = () => {
    setScreen('welcome');
  };

  const handleLoginSuccess = () => {
    setScreen('home');
  };

  if (screen === 'home') {
    return <Home onLogout={handleLogout} />;
  }

  if (screen === 'register') {
    return <Register onBack={handleBack} />;
  }

  if (screen === 'login') {
    return <Login onLoginSuccess={handleLoginSuccess} onGoToRegister={handleCreate} />;
  }

  return <Welcome onCreateAccount={handleCreate} onLogin={handleLogin} />;
}

export default App;