import React from 'react';
import Welcome from './views/Welcome';

function App(){
  const handleCreate = ()=>{ /* navegar para cadastro */ };
  const handleLogin = ()=>{ /* navegar para login */ };

  return <Welcome onCreateAccount={handleCreate} onLogin={handleLogin} />;
}

export default App;