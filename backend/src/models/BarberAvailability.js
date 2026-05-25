const pool = require('../database');

class BarberAvailability {
  static async setSchedule(barberId, data) {
    const { availableDays, startTime, endTime } = data;
    const connection = await pool.getConnection();
    
    try {
      await connection.query(
        `UPDATE users SET available_days = ?, start_time = ?, end_time = ?, updated_at = NOW()
         WHERE id = ?`,
        [availableDays, startTime, endTime, barberId]
      );
      return true;
    } finally {
      connection.release();
    }
  }

  static async getSchedule(barberId) {
    const connection = await pool.getConnection();
    
    try {
      const [rows] = await connection.query(
        'SELECT id, name, available_days, start_time, end_time FROM users WHERE id = ? AND role = "barber"',
        [barberId]
      );
      return rows.length > 0 ? rows[0] : null;
    } finally {
      connection.release();
    }
  }
}

module.exports = BarberAvailability;
