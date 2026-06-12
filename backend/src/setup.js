const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Script para inicializar o banco de dados
 * Executa apenas uma vez durante o setup
 */
async function setupDatabase() {
  console.log('🔧 Inicializando banco de dados...');

  try {
    if (!process.env.DB_HOST || !process.env.DB_USER || process.env.DB_PASSWORD === undefined) {
      throw new Error('DB_USER e DB_PASSWORD devem ser definidos no ambiente');
    }

    // Conectar sem especificar banco de dados
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
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
        active TINYINT(1) NOT NULL DEFAULT 1,
        avatar LONGBLOB NULL COMMENT 'Imagem do barbeiro em base64',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela "users" criada/verificada');

    //await connection.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS active TINYINT(1) NOT NULL DEFAULT 1');

    // Criar tabela de serviços
    await connection.query(`
      CREATE TABLE IF NOT EXISTS services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        duration INT NOT NULL COMMENT 'Duração em minutos',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela "services" criada/verificada');

    // Criar tabela de agendamentos
    await connection.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        barber_id INT NOT NULL,
        service_id INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL COMMENT 'Preço do serviço no momento do agendamento',
        date DATE NOT NULL,
        time TIME NOT NULL,
        status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_date (date),
        INDEX idx_barber (barber_id),
        INDEX idx_user (user_id),
        INDEX idx_date_barber (date, barber_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (barber_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela "appointments" criada/verificada');

    // Criar tabela de indisponibilidades (RF12)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS unavailabilities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        barber_id INT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        start_time TIME,
        end_time TIME,
        reason VARCHAR(255),
        action ENUM('auto_cancel', 'suggest_reschedule', 'maintenance_warning') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_barber (barber_id),
        INDEX idx_dates (start_date, end_date),
        FOREIGN KEY (barber_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela "unavailabilities" criada/verificada');

    // Criar tabela de notificações
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        barber_id INT NOT NULL,
        type VARCHAR(100) NOT NULL,
        channel VARCHAR(50) NOT NULL DEFAULT 'push',
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        related_appointment_id INT,
        status ENUM('unread', 'read') DEFAULT 'unread',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user (user_id),
        INDEX idx_status (status),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (barber_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (related_appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela "notifications" criada/verificada');

    //await connection.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS channel VARCHAR(50) NOT NULL DEFAULT 'push'`);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS waitlist_entries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        barber_id INT NOT NULL,
        service_id INT NOT NULL,
        date DATE NOT NULL,
        time TIME NOT NULL,
        status ENUM('waiting', 'notified', 'cancelled', 'converted', 'expired') DEFAULT 'waiting',
        notified_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user (user_id),
        INDEX idx_barber_date_time (barber_id, date, time),
        INDEX idx_status (status),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (barber_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela "waitlist_entries" criada/verificada');

    //await connection.query(`ALTER TABLE waitlist_entries ADD COLUMN IF NOT EXISTS notified_at TIMESTAMP NULL DEFAULT NULL`);
    await connection.query(`
  ALTER TABLE waitlist_entries
  MODIFY COLUMN status
  ENUM('waiting', 'notified', 'cancelled', 'converted', 'expired')
  DEFAULT 'waiting'
`);
    // Colunas adicionais em "waitlist_entries" (compatível com qualquer versão do MySQL)
    // O MySQL nem sempre suporta "ADD COLUMN IF NOT EXISTS"; por isso verificamos via INFORMATION_SCHEMA.

    // manual_position
    const [manualPositionColumn] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'waitlist_entries'
        AND COLUMN_NAME = 'manual_position'
    `, [process.env.DB_NAME || 'barbearia_db']);

    if (!manualPositionColumn || manualPositionColumn.length === 0) {
      await connection.query(`
        ALTER TABLE waitlist_entries
        ADD COLUMN manual_position INT NULL DEFAULT NULL
      `);
    }

    // pending_position
    const [pendingPositionColumn] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'waitlist_entries'
        AND COLUMN_NAME = 'pending_position'
    `, [process.env.DB_NAME || 'barbearia_db']);

    if (!pendingPositionColumn || pendingPositionColumn.length === 0) {
      await connection.query(`
        ALTER TABLE waitlist_entries
        ADD COLUMN pending_position INT NULL DEFAULT NULL
      `);
    }

    // waitlist_priority em users
    const [waitlistPriorityColumn] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'waitlist_priority'
    `, [process.env.DB_NAME || 'barbearia_db']);

    if (!waitlistPriorityColumn || waitlistPriorityColumn.length === 0) {
      await connection.query(`
        ALTER TABLE users
        ADD COLUMN waitlist_priority ENUM('arrival_order', 'haircut_count') DEFAULT 'arrival_order'
      `);
    }

    console.log(
      '✅ Colunas adicionais da fila de espera criadas/verificadas'
    );

    await connection.query(`
      CREATE TABLE IF NOT EXISTS reminder_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lead_time_minutes INT NOT NULL DEFAULT 60,
        channel ENUM('email', 'push') NOT NULL DEFAULT 'email',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela "reminder_settings" criada/verificada');

    const [settingsRows] = await connection.query('SELECT id FROM reminder_settings LIMIT 1');
    if (settingsRows.length === 0) {
      await connection.query(
        'INSERT INTO reminder_settings (lead_time_minutes, channel, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
        [process.env.REMINDER_LEAD_TIME_MINUTES || 60, process.env.REMINDER_CHANNEL || 'email']
      );
      console.log('✅ Configuração padrão de lembretes inserida');
    }

    await connection.end();
    console.log('✅ Setup do banco de dados concluído!\n');

  } catch (error) {
    console.error('❌ Erro ao fazer setup do banco de dados:');
    console.error('   Erro:', error?.message || error);
    if (error?.code) {
      console.error('   Código:', error.code);
    }
    if (error?.sqlMessage) {
      console.error('   Detalhe MySQL:', error.sqlMessage);
    }
    if (error?.stack) {
      console.error('\n   Stack:\n', error.stack);
    }
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
