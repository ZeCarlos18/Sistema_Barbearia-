require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');
const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const availableTimesRoutes = require('./routes/availableTimesRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rotas básicas
app.get('/', (req, res) => {
  res.json({ message: 'API Barbearia funcionando!' });
});

// Rota para testar conexão com banco de dados
app.get('/api/test-db', async (req, res) => {
  try {
    const connection = await db.getConnection();
    const [rows] = await connection.query('SELECT 1 as test');
    connection.release();
    res.json({ 
      message: 'Conexão com MySQL funcionando!',
      test: rows[0]
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao conectar com banco de dados',
      details: error.message
    });
  }
});

// Rotas de Autenticação
app.use('/api/auth', authRoutes);

// Rotas de Serviços
app.use('/api/services', serviceRoutes);

// Rotas de Agendamentos
app.use('/api/appointments', appointmentRoutes);

// Rotas de Usuários
app.use('/api/users', userRoutes);

// Rotas de Administração
app.use('/api/admin', adminRoutes);

// Rotas de Horários Disponíveis
app.use('/api/available-times', availableTimesRoutes);

// Rota 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada'
  });
});

// Tratamento de erros global
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({
    success: false,
    message: 'Erro no servidor',
    error: err.message
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📝 Teste a conexão: http://localhost:${PORT}/api/test-db`);
  console.log(`🔐 API de Autenticação: http://localhost:${PORT}/api/auth`);
  console.log(`\n📚 Endpoints disponíveis:`);
  console.log(`  POST   /api/auth/register     - Cadastro de usuário`);
  console.log(`  POST   /api/auth/login        - Login`);
  console.log(`  POST   /api/auth/logout       - Logout (requer autenticação)`);
  console.log(`  GET    /api/auth/profile      - Perfil do usuário (requer autenticação)`);
  console.log(`  GET    /api/auth/users        - Listar todos os usuários`);
  console.log(`  POST   /api/admin/barbers     - Criar barbeiro (requer autenticação)`);
  console.log(`  GET    /api/admin/barbers     - Listar barbeiros (requer autenticação)`);
  console.log(`  GET    /api/admin/barbers/:id - Detalhes barbeiro (requer autenticação)`);
  console.log(`  DELETE /api/admin/barbers/:id - Excluir barbeiro (requer autenticação)`);
});
