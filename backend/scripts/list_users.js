const pool = require('../src/database');

(async () => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query('SELECT id, name, email, role, created_at FROM users ORDER BY id DESC LIMIT 50');
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('error', err);
  } finally {
    connection.release();
    process.exit(0);
  }
})();
