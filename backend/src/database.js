const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuração da pool de conexão com MySQL
if (!process.env.DB_USER || !process.env.DB_PASSWORD) {
  throw new Error('DB_USER e DB_PASSWORD devem ser definidos no ambiente');
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'barbearia_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0
});

// Testar conexão com retry
let retries = 3;
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conectado ao MySQL com sucesso!');
    connection.release();
  } catch (err) {
    console.error('❌ Erro ao conectar ao MySQL:', err.message);
    
    if (retries > 0) {
      retries--;
      console.log(`⏳ Tentando novamente em 2 segundos... (${retries} tentativas restantes)`);
      setTimeout(testConnection, 2000);
    } else {
      console.error('\n⚠️  SOLUÇÃO RÁPIDA:');
      console.error('   1. Abra PowerShell nesta pasta');
      console.error('   2. Execute: node src/setup.js');
      console.error('   3. Depois: npm run dev');
    }
  }
};

// Testar conexão após 1 segundo (dar tempo para XAMPP iniciar)
setTimeout(testConnection, 1000);

module.exports = pool;
