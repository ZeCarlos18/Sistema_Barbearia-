const path = require('path');
const mysql = require('mysql2/promise');
const bcryptjs = require('bcryptjs');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

async function ensureAdmin() {
  const name = process.argv[2] || 'Barbeiro Chefe';
  const email = process.argv[3];
  const password = process.argv[4];
  const phone = process.argv[5] || null;

  if (!email || !password) {
    console.error('Usage: node src/createAdmin.js "Name" email password [phone]');
    process.exit(1);
  }

  const dbName = process.env.DB_NAME || 'barbearia_db';
  if (!process.env.DB_USER) {
    console.error('Missing DB_USER in environment variables');
    process.exit(1);
  }

  if (process.env.DB_PASSWORD === undefined) {
    console.error('Missing DB_PASSWORD in environment variables (use DB_PASSWORD= for no password)');
    process.exit(1);
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
  await connection.query(`USE ${dbName}`);

  const hashedPassword = await bcryptjs.hash(password, 10);

  const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);

  if (existing.length > 0) {
    await connection.query(
      'UPDATE users SET name = ?, password = ?, role = ?, updated_at = NOW() WHERE id = ?',
      [name, hashedPassword, 'admin', existing[0].id]
    );
    console.log('Admin updated');
  } else {
    await connection.query(
      'INSERT INTO users (name, email, password, phone, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      [name, email, hashedPassword, phone, 'admin']
    );
    console.log('Admin created');
  }

  await connection.end();
}

ensureAdmin().catch((error) => {
  console.error('Error creating admin:', error.message);
  process.exit(1);
});
