const mysql = require('mysql2/promise');
require('dotenv').config();
const { buildMysqlConfig } = require('./utils/mysqlConfig');

// Configuração da pool de conexão com MySQL
if (!process.env.DB_USER || process.env.DB_PASSWORD === undefined) {
  throw new Error('DB_USER e DB_PASSWORD devem ser definidos no ambiente');
}

const pool = mysql.createPool({
  ...buildMysqlConfig({ database: process.env.DB_NAME || 'barbearia_db' }),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true
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
