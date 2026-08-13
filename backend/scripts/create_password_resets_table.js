// backend/scripts/create_password_resets_table.js
//
// Migração isolada: cria apenas a tabela "password_resets" no banco já existente.
// Use este script quando o banco já está em produção e você não quer rodar o setup completo.
//
// Uso: node scripts/create_password_resets_table.js

const mysql = require('mysql2/promise');
require('dotenv').config();
const { buildMysqlConfig } = require('../src/utils/mysqlConfig');

async function createPasswordResetsTable() {
  console.log('🔧 Criando tabela "password_resets"...');

  let connection;

  try {
    connection = await mysql.createConnection(
      buildMysqlConfig({ database: process.env.DB_NAME || 'barbearia_db' })
    );

    console.log('✅ Conectado ao MySQL');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token_hash CHAR(64) NOT NULL COMMENT 'SHA-256 do token enviado por e-mail',
        expires_at DATETIME NOT NULL,
        used_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_token_hash (token_hash),
        INDEX idx_user (user_id),
        INDEX idx_expires (expires_at),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Tabela "password_resets" criada/verificada com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar a tabela "password_resets":');
    console.error('   Erro:', error?.message || error);
    if (error?.sqlMessage) {
      console.error('   Detalhe MySQL:', error.sqlMessage);
    }
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  createPasswordResetsTable();
}

module.exports = createPasswordResetsTable;
