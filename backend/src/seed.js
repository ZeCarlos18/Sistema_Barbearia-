const mysql = require('mysql2/promise');
const bcryptjs = require('bcryptjs');
require('dotenv').config();
const { buildMysqlConfig } = require('./utils/mysqlConfig');

/**
 * Script para popular o banco de dados com dados de teste e configuração
 * Executa após o setup.js para adicionar dados iniciais
 */
async function seedDatabase() {
  console.log('🌱 Iniciando seed do banco de dados...\n');
  
  try {
    if (!process.env.DB_HOST || !process.env.DB_USER || process.env.DB_PASSWORD === undefined) {
      throw new Error('DB_USER e DB_PASSWORD devem ser definidos no ambiente');
    }

    const connection = await mysql.createConnection(
      buildMysqlConfig({ database: process.env.DB_NAME || 'barbearia_db' })
    );

    console.log('✅ Conectado ao banco de dados\n');

    // Hash da senha padrão: password123
    const passwordHash = await bcryptjs.hash('password123', 10);

    // ============ SERVIÇOS ============
    console.log('📋 Inserindo serviços...');
    const services = [
      { name: 'Barba', description: 'Aparação e modelagem de barba', price: 25.00, duration: 30 },
      { name: 'Corte Degradê', description: 'Corte com degradê profissional', price: 50.00, duration: 45 },
      { name: 'Corte Social', description: 'Corte clássico e social', price: 40.00, duration: 40 }
    ];

    let servicesInserted = 0;
    for (const service of services) {
      // Verificar se o serviço já existe
      const [existing] = await connection.query(
        'SELECT id FROM services WHERE name = ?',
        [service.name]
      );
      
      if (existing.length === 0) {
        await connection.query(
          'INSERT INTO services (name, description, price, duration, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
          [service.name, service.description, service.price, service.duration]
        );
        servicesInserted++;
      }
    }
    console.log(`✅ ${servicesInserted} novo(s) serviço(s) inserido(s)\n`);

    // ============ BARBEIROS ============
    console.log('💈 Inserindo barbeiros...');
    const barbers = [
      { name: 'Lucas', email: 'lucas@barber.com', phone: '11988888888' },
      { name: 'Felipe', email: 'felipe@barber.com', phone: '11977777777' },
      { name: 'Rafael', email: 'rafael@barber.com', phone: '11966666666' }
    ];

    let barbersInserted = 0;
    for (const barber of barbers) {
      // Verificar se o email já existe
      const [existing] = await connection.query(
        'SELECT id FROM users WHERE email = ?',
        [barber.email]
      );
      
      if (existing.length === 0) {
        await connection.query(
          'INSERT INTO users (name, email, password, phone, role, created_at, updated_at) VALUES (?, ?, ?, ?, "barber", NOW(), NOW())',
          [barber.name, barber.email, passwordHash, barber.phone]
        );
        barbersInserted++;
      }
    }
    console.log(`✅ ${barbersInserted} novo(s) barbeiro(s) inserido(s)\n`);

    // ============ USUÁRIOS DE TESTE ============
    console.log('👥 Inserindo usuários de teste...');
    const clients = [
      { name: 'teste2', email: 'teste2@test.com', phone: '11999999999' },
      { name: 'Cliente Teste', email: 'cliente@test.com', phone: '11988888800' }
    ];

    let clientsInserted = 0;
    for (const client of clients) {
      // Verificar se o email já existe
      const [existing] = await connection.query(
        'SELECT id FROM users WHERE email = ?',
        [client.email]
      );
      
      if (existing.length === 0) {
        await connection.query(
          'INSERT INTO users (name, email, password, phone, role, created_at, updated_at) VALUES (?, ?, ?, ?, "client", NOW(), NOW())',
          [client.name, client.email, passwordHash, client.phone]
        );
        clientsInserted++;
      }
    }
    console.log(`✅ ${clientsInserted} novo(s) cliente(s) inserido(s)\n`);

    // ============ RESUMO ============
    console.log('═══════════════════════════════════════════');
    console.log('✅ Seed concluído com sucesso!\n');
    console.log('📊 Dados inseridos:');
    console.log(`   • ${services.length} Serviços`);
    console.log(`   • ${barbers.length} Barbeiros`);
    console.log(`   • ${clients.length} Usuários de teste\n`);
    
    console.log('🔐 Credenciais de acesso:');
    console.log('   Barbeiros:');
    barbers.forEach(b => {
      console.log(`      📧 ${b.email} | 🔑 password123`);
    });
    console.log('   Clientes:');
    clients.forEach(c => {
      console.log(`      📧 ${c.email} | 🔑 password123`);
    });
    console.log('\n═══════════════════════════════════════════\n');

    await connection.end();
    
  } catch (error) {
    console.error('❌ Erro ao fazer seed do banco de dados:');
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
    console.error('   1. Rode "node src/setup.js" primeiro para criar as tabelas');
    console.error('   2. Verifique se o MySQL do XAMPP está rodando');
    console.error('   3. Verifique o arquivo .env está correto');
    process.exit(1);
  }
}

// Executar seed se for chamado diretamente
if (require.main === module) {
  seedDatabase().catch(error => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = seedDatabase;
