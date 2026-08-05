const pool = require('../src/database');

(async () => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`SELECT id, user_id, barber_id, service_id, date, time, status, created_at FROM appointments ORDER BY id DESC LIMIT 30`);
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('error', err);
  } finally {
    connection.release();
    process.exit(0);
  }
})();
