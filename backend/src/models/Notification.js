const pool = require('../database');

class Notification {
  static async create(data) {
    const { userId, barberId, type, title, message, relatedAppointmentId, status } = data;
    const connection = await pool.getConnection();
    
    try {
      const [result] = await connection.query(
        `INSERT INTO notifications (user_id, barber_id, type, title, message, related_appointment_id, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [userId, barberId, type, title, message, relatedAppointmentId, status || 'unread']
      );
      
      return {
        id: result.insertId,
        userId,
        barberId,
        type,
        title,
        message,
        relatedAppointmentId,
        status: status || 'unread'
      };
    } finally {
      connection.release();
    }
  }

  static async findByUserId(userId) {
    const connection = await pool.getConnection();
    
    try {
      const [rows] = await connection.query(
        'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  static async findUnread(userId) {
    const connection = await pool.getConnection();
    
    try {
      const [rows] = await connection.query(
        'SELECT * FROM notifications WHERE user_id = ? AND status = "unread" ORDER BY created_at DESC',
        [userId]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  static async markAsRead(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.query(
        'UPDATE notifications SET status = "read", updated_at = NOW() WHERE id = ?',
        [id]
      );
      return true;
    } finally {
      connection.release();
    }
  }

  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      const [result] = await connection.query(
        'DELETE FROM notifications WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }
}

module.exports = Notification;
