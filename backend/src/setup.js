const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Script para inicializar o banco de dados
 * Executa apenas uma vez durante o setup
 */
async function setupDatabase() {
  console.log('🔧 Inicializando banco de dados...');
  
  try {
    // Conectar sem especificar banco de dados
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    console.log('✅ Conectado ao MySQL');

    // Criar banco de dados
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'barbearia_db'}`
    );
    console.log(`✅ Banco de dados criado/verificado: ${process.env.DB_NAME || 'barbearia_db'}`);

    // Usar o banco
    await connection.query(`USE ${process.env.DB_NAME || 'barbearia_db'}`);

    // Criar tabela de usuários
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role ENUM('client', 'barber', 'admin') DEFAULT 'client',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela "users" criada/verificada');

    await connection.end();
    console.log('✅ Setup do banco de dados concluído!\n');
    
  } catch (error) {
    console.error('❌ Erro ao fazer setup do banco de dados:');
    console.error('   Erro:', error.message);
    console.error('\n   Dicas:');
    console.error('   1. Verifique se o MySQL do XAMPP está rodando');
    console.error('   2. Verifique o arquivo .env está correto');
    console.error('   3. Usuário/senha MySQL estão corretos');
    process.exit(1);
  }
}

// Executar setup se for chamado diretamente
if (require.main === module) {
  setupDatabase().then(() => {
    console.log('🎉 Banco pronto! Agora você pode rodar: npm run dev');
    process.exit(0);
  });
}

module.exports = setupDatabase;
