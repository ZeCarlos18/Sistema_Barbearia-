const pool = require('../database');

class Unavailability {
  static async create(data) {
    const { barberId, startDate, endDate, startTime, endTime, reason, action } = data;
    const connection = await pool.getConnection();
    
    try {
      const [result] = await connection.query(
        `INSERT INTO unavailabilities (barber_id, start_date, end_date, start_time, end_time, reason, action, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [barberId, startDate, endDate, startTime, endTime, reason, action]
      );
      
      return {
        id: result.insertId,
        barberId,
        startDate,
        endDate,
        startTime,
        endTime,
        reason,
        action
      };
    } finally {
      connection.release();
    }
  }

  static async findById(id) {
    const connection = await pool.getConnection();
    
    try {
      const [rows] = await connection.query(
        'SELECT * FROM unavailabilities WHERE id = ?',
        [id]
      );
      return rows.length > 0 ? rows[0] : null;
    } finally {
      connection.release();
    }
  }

  static async findByBarberId(barberId) {
    const connection = await pool.getConnection();
    
    try {
      const [rows] = await connection.query(
        'SELECT * FROM unavailabilities WHERE barber_id = ? ORDER BY start_date DESC, start_time DESC',
        [barberId]
      );
      return rows;
    } catch (error) {
      if (error.code === 'ER_NO_SUCH_TABLE') {
        return [];
      }

      throw error;
    } finally {
      connection.release();
    }
  }

  static async findConflictingAppointments(barberId, startDate, endDate, startTime, endTime) {
    const connection = await pool.getConnection();
    
    try {
      let query = `
        SELECT a.id, a.user_id, a.date, a.time, u.name as user_name, u.email as user_email, s.name as service_name
        FROM appointments a
        LEFT JOIN users u ON a.user_id = u.id
        LEFT JOIN services s ON a.service_id = s.id
        WHERE a.barber_id = ? AND a.status IN ('confirmed', 'completed')
      `;
      
      const params = [barberId];
      
      if (startDate === endDate) {
        query += ` AND a.date = ?`;
        params.push(startDate);
        
        if (startTime && endTime && startTime !== endTime) {
          query += ` AND TIME(a.time) BETWEEN ? AND ?`;
          params.push(startTime, endTime);
        } else if (startTime && endTime && startTime === endTime) {
          query += ` AND TIME(a.time) = ?`;
          params.push(startTime);
        }
      } else {
        query += ` AND a.date BETWEEN ? AND ?`;
        params.push(startDate, endDate);
      }
      
      const [rows] = await connection.query(query, params);
      return rows;
    } finally {
      connection.release();
    }
  }

  static async update(id, data) {
    const { startDate, endDate, startTime, endTime, reason, action } = data;
    const connection = await pool.getConnection();
    
    try {
      await connection.query(
        `UPDATE unavailabilities SET start_date = ?, end_date = ?, start_time = ?, end_time = ?, reason = ?, action = ?, updated_at = NOW()
         WHERE id = ?`,
        [startDate, endDate, startTime, endTime, reason, action, id]
      );
      
      return await this.findById(id);
    } finally {
      connection.release();
    }
  }

  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      const [result] = await connection.query(
        'DELETE FROM unavailabilities WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  static async findActiveUnavailabilities(barberId, date, time) {
    const connection = await pool.getConnection();
    
    try {
      let query = `SELECT * FROM unavailabilities WHERE barber_id = ? AND start_date <= ? AND end_date >= ?`;
      const params = [barberId, date, date];

      if (time !== undefined && time !== null) {
        query += ` AND ((start_time IS NULL AND end_time IS NULL) OR (start_time IS NOT NULL AND end_time IS NOT NULL AND TIME(?) BETWEEN TIME(start_time) AND TIME(end_time)))`;
        params.push(time);
      } else {
        // when time not provided, return all unavailabilities for the day (full-day and time-ranged)
        // no extra params needed
      }

      const [rows] = await connection.query(query, params);
      return rows;
    } finally {
      connection.release();
    }
  }
}

module.exports = Unavailability;
