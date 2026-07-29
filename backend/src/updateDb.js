// backend/src/updateDb.js
const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateDatabase() {
  console.log('🔧 Iniciando a atualização do banco de dados...');
  
  try {
    if (!process.env.DB_USER || !process.env.DB_PASSWORD) {
      throw new Error('DB_USER e DB_PASSWORD devem ser definidos no ambiente');
    }

    // Conectar ao banco usando as credenciais do .env
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'barbearia_db'
    });

    console.log('✅ Conectado ao MySQL!');

    // Vamos tentar adicionar as colunas uma a uma.
    // Usamos blocos try/catch individuais para que, se você rodar o script duas vezes 
    // e a coluna já existir, ele não quebre e continue para a próxima.

    console.log('⏳ Adicionando novas colunas à tabela users...');

    try {
      await connection.query('ALTER TABLE users ADD COLUMN active TINYINT(1) NOT NULL DEFAULT 1;');
      console.log('✅ Coluna "active" adicionada com sucesso.');
    } catch (e) {
      console.log('⚠️ Aviso: "active" (Provavelmente já existe) - Detalhe:', e.message);
    }

    try {
      await connection.query('ALTER TABLE users ADD COLUMN available_days VARCHAR(50) DEFAULT NULL;');
      console.log('✅ Coluna "available_days" adicionada com sucesso.');
    } catch (e) {
      console.log('⚠️ Aviso: "available_days" (Provavelmente já existe) - Detalhe:', e.message);
    }

    try {
      await connection.query('ALTER TABLE users ADD COLUMN start_time TIME DEFAULT NULL;');
      console.log('✅ Coluna "start_time" adicionada com sucesso.');
    } catch (e) {
      console.log('⚠️ Aviso: "start_time" (Provavelmente já existe) - Detalhe:', e.message);
    }

    try {
      await connection.query('ALTER TABLE users ADD COLUMN end_time TIME DEFAULT NULL;');
      console.log('✅ Coluna "end_time" adicionada com sucesso.');
    } catch (e) {
      console.log('⚠️ Aviso: "end_time" (Provavelmente já existe) - Detalhe:', e.message);
    }

    try {
      await connection.query('ALTER TABLE users ADD COLUMN photo_url LONGTEXT DEFAULT NULL;');
      console.log('✅ Coluna "photo_url" adicionada com sucesso.');
    } catch (e) {
      console.log('⚠️ Aviso: "photo_url" (Provavelmente já existe) - Detalhe:', e.message);
    }

    console.log('⏳ Adicionando novas colunas à tabela appointments...');

    try {
      await connection.query('ALTER TABLE appointments ADD COLUMN hidden_from_history TINYINT(1) NOT NULL DEFAULT 0;');
      console.log('✅ Coluna "hidden_from_history" adicionada com sucesso.');
    } catch (e) {
      console.log('⚠️ Aviso: "hidden_from_history" (Provavelmente já existe) - Detalhe:', e.message);
    }

    await connection.end();
    console.log('\n🎉 Atualização do banco de dados concluída!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro ao conectar ou atualizar o banco de dados:');
    console.error(error.message);
    process.exit(1);
  }
}

updateDatabase();