const pool = require('../database');

class ReminderSetting {
  static async find() {
    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.query('SELECT * FROM reminder_settings ORDER BY id ASC LIMIT 1');
      return rows.length > 0 ? rows[0] : null;
    } finally {
      connection.release();
    }
  }

  static async createDefault() {
    const connection = await pool.getConnection();

    try {
      const [result] = await connection.query(
        'INSERT INTO reminder_settings (lead_time_minutes, channel, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
        [process.env.REMINDER_LEAD_TIME_MINUTES || 60, process.env.REMINDER_CHANNEL || 'email']
      );

      return {
        id: result.insertId,
        lead_time_minutes: Number(process.env.REMINDER_LEAD_TIME_MINUTES) || 60,
        channel: process.env.REMINDER_CHANNEL || 'email'
      };
    } finally {
      connection.release();
    }
  }

  static async update(data) {
    const { lead_time_minutes, channel } = data;
    const connection = await pool.getConnection();

    try {
      const current = await this.find();

      if (!current) {
        const [result] = await connection.query(
          'INSERT INTO reminder_settings (lead_time_minutes, channel, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
          [lead_time_minutes, channel]
        );

        return {
          id: result.insertId,
          lead_time_minutes,
          channel
        };
      }

      await connection.query(
        'UPDATE reminder_settings SET lead_time_minutes = ?, channel = ?, updated_at = NOW() WHERE id = ?',
        [lead_time_minutes, channel, current.id]
      );

      return {
        id: current.id,
        lead_time_minutes,
        channel
      };
    } finally {
      connection.release();
    }
  }
}

module.exports = ReminderSetting;
