import React from 'react';
import Welcome from './views/Welcome';
import Register from './views/Register/Register';

function App(){
  const [screen, setScreen] = React.useState('welcome');

  const handleCreate = () => setScreen('register');
  const handleLogin = () => setScreen('register');
  const handleBack = () => setScreen('welcome');

  if (screen === 'register') {
    return <Register onBack={handleBack} />;
  }

  return <Welcome onCreateAccount={handleCreate} onLogin={handleLogin} />;
}

export default App;