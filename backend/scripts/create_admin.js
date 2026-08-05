const pool = require('../src/database');
const bcrypt = require('bcryptjs');

(async () => {
  const email = 'admin@gmail.com';
  const name = 'Admin';
  const password = 'admin123';

  const connection = await pool.getConnection();
  try {
    const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
    const hashed = await bcrypt.hash(password, 10);
    if (existing.length > 0) {
      await connection.query('UPDATE users SET name = ?, password = ?, role = ?, updated_at = NOW() WHERE email = ?', [name, hashed, 'admin', email]);
      console.log(`Updated admin user: ${email}`);
    } else {
      await connection.query('INSERT INTO users (name, email, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())', [name, email, hashed, 'admin']);
      console.log(`Created admin user: ${email}`);
    }

    const [rows] = await connection.query('SELECT id, name, email, role FROM users WHERE email = ?', [email]);
    console.log(JSON.stringify(rows[0], null, 2));
  } catch (err) {
    console.error('Error creating admin:', err);
  } finally {
    connection.release();
    process.exit(0);
  }
})();
