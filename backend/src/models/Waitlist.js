const pool = require('../database');

class Waitlist {
  static async create({ userId, barberId, serviceId, date, time }) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        `INSERT INTO waitlist_entries (user_id, barber_id, service_id, date, time, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'waiting', NOW(), NOW())`,
        [userId, barberId, serviceId, date, time]
      );
      return { id: result.insertId, userId, barberId, serviceId, date, time, status: 'waiting' };
    } finally {
      connection.release();
    }
  }

  static async findById(id) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(`
        SELECT w.*, u.name as user_name, u.email as user_email, u.phone as user_phone,
               b.name as barber_name, s.name as service_name
        FROM waitlist_entries w
        LEFT JOIN users u ON w.user_id = u.id
        LEFT JOIN users b ON w.barber_id = b.id
        LEFT JOIN services s ON w.service_id = s.id
        WHERE w.id = ?
      `, [id]);
      return rows.length > 0 ? rows[0] : null;
    } finally {
      connection.release();
    }
  }

  static async findByUserBarberDateTime(userId, barberId, date, time) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT * FROM waitlist_entries
         WHERE user_id = ? AND barber_id = ? AND date = ? AND time = ?
           AND status IN ('waiting', 'notified')`,
        [userId, barberId, date, time]
      );
      return rows.length > 0 ? rows[0] : null;
    } finally {
      connection.release();
    }
  }

  static async _getBarberPriority(connection, barberId) {
    const [rows] = await connection.query(
      'SELECT waitlist_priority FROM users WHERE id = ?',
      [barberId]
    );
    return rows[0]?.waitlist_priority || 'arrival_order';
  }

  // Checks whether any entry in this slot has manual_position set (means barber has manually ordered the queue)
  static async _hasManualOrder(connection, barberId, date, time) {
    const [rows] = await connection.query(
      `SELECT COUNT(*) as c FROM waitlist_entries
       WHERE barber_id = ? AND date = ? AND time = ? AND status = 'waiting' AND manual_position IS NOT NULL`,
      [barberId, date, time]
    );
    return rows[0].c > 0;
  }

  // Rule 8: list is locked once any entry has been notified/expired/converted
  static async isSlotLocked(barberId, date, time) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT COUNT(*) as c FROM waitlist_entries
         WHERE barber_id = ? AND date = ? AND time = ?
           AND status IN ('notified', 'expired', 'converted')`,
        [barberId, date, time]
      );
      return rows[0].c > 0;
    } finally {
      connection.release();
    }
  }

  static async getPositionInQueue(id) {
    const connection = await pool.getConnection();
    try {
      const [entryRows] = await connection.query(
        'SELECT * FROM waitlist_entries WHERE id = ?',
        [id]
      );
      if (!entryRows.length) return null;

      const { barber_id, date, time, id: entryId, user_id, manual_position } = entryRows[0];

      // If this entry has a manual_position, count entries with lower manual_position
      if (manual_position !== null && manual_position !== undefined) {
        const [countRows] = await connection.query(
          `SELECT COUNT(*) as ahead FROM waitlist_entries
           WHERE barber_id = ? AND date = ? AND time = ? AND status = 'waiting'
             AND manual_position IS NOT NULL AND manual_position < ?`,
          [barber_id, date, time, manual_position]
        );
        return countRows[0].ahead + 1;
      }

      // No manual position — use natural priority
      const priority = await Waitlist._getBarberPriority(connection, barber_id);

      if (priority === 'haircut_count') {
        const [myCutsRows] = await connection.query(
          `SELECT COUNT(*) as cuts FROM appointments
           WHERE user_id = ? AND barber_id = ? AND status = 'completed'`,
          [user_id, barber_id]
        );
        const myCuts = myCutsRows[0].cuts;

        // Ahead: more completed cuts, or same cuts but lower id (arrived earlier)
        const [countRows] = await connection.query(
          `SELECT COUNT(*) as ahead
           FROM (
             SELECT w2.id,
               (SELECT COUNT(*) FROM appointments
                WHERE user_id = w2.user_id AND barber_id = w2.barber_id
                  AND status = 'completed') as cuts
             FROM waitlist_entries w2
             WHERE w2.barber_id = ? AND w2.date = ? AND w2.time = ?
               AND w2.status = 'waiting' AND w2.id != ?
               AND w2.manual_position IS NULL
           ) ranked
           WHERE ranked.cuts > ? OR (ranked.cuts = ? AND ranked.id < ?)`,
          [barber_id, date, time, entryId, myCuts, myCuts, entryId]
        );
        // Also count all entries that have manual_position (they take priority slots)
        const [manualCount] = await connection.query(
          `SELECT COUNT(*) as c FROM waitlist_entries
           WHERE barber_id = ? AND date = ? AND time = ? AND status = 'waiting' AND manual_position IS NOT NULL`,
          [barber_id, date, time]
        );
        return manualCount[0].c + countRows[0].ahead + 1;
      }

      // Arrival order: count waiting entries with lower id
      const [countRows] = await connection.query(
        `SELECT COUNT(*) as ahead FROM waitlist_entries
         WHERE barber_id = ? AND date = ? AND time = ? AND status = 'waiting' AND id < ?
           AND manual_position IS NULL`,
        [barber_id, date, time, entryId]
      );
      const [manualCount] = await connection.query(
        `SELECT COUNT(*) as c FROM waitlist_entries
         WHERE barber_id = ? AND date = ? AND time = ? AND status = 'waiting' AND manual_position IS NOT NULL`,
        [barber_id, date, time]
      );
      return manualCount[0].c + countRows[0].ahead + 1;
    } finally {
      connection.release();
    }
  }

  static async getFirstWaiting(barberId, date, time) {
    const connection = await pool.getConnection();
    try {
      // If any entry has manual_position, use manual ordering
      const hasManual = await Waitlist._hasManualOrder(connection, barberId, date, time);
      if (hasManual) {
        const [rows] = await connection.query(`
          SELECT w.*, u.name as user_name, u.email as user_email, u.phone as user_phone
          FROM waitlist_entries w
          LEFT JOIN users u ON w.user_id = u.id
          WHERE w.barber_id = ? AND w.date = ? AND w.time = ? AND w.status = 'waiting'
            AND w.manual_position IS NOT NULL
          ORDER BY w.manual_position ASC, w.id ASC
          LIMIT 1
        `, [barberId, date, time]);
        return rows.length > 0 ? rows[0] : null;
      }

      const priority = await Waitlist._getBarberPriority(connection, barberId);

      if (priority === 'haircut_count') {
        const [rows] = await connection.query(`
          SELECT w.*,
            u.name as user_name, u.email as user_email, u.phone as user_phone,
            (SELECT COUNT(*) FROM appointments a
             WHERE a.user_id = w.user_id AND a.barber_id = w.barber_id
               AND a.status = 'completed') as haircut_count
          FROM waitlist_entries w
          LEFT JOIN users u ON w.user_id = u.id
          WHERE w.barber_id = ? AND w.date = ? AND w.time = ? AND w.status = 'waiting'
          ORDER BY haircut_count DESC, w.id ASC
          LIMIT 1
        `, [barberId, date, time]);
        return rows.length > 0 ? rows[0] : null;
      }

      // Arrival order
      const [rows] = await connection.query(`
        SELECT w.*, u.name as user_name, u.email as user_email, u.phone as user_phone
        FROM waitlist_entries w
        LEFT JOIN users u ON w.user_id = u.id
        WHERE w.barber_id = ? AND w.date = ? AND w.time = ? AND w.status = 'waiting'
        ORDER BY w.id ASC
        LIMIT 1
      `, [barberId, date, time]);
      return rows.length > 0 ? rows[0] : null;
    } finally {
      connection.release();
    }
  }

  // Rule 4: Full waitlist for barber view — returns ordered list with position, name, time in queue
  static async getFullWaitlist(barberId, date, time) {
    const connection = await pool.getConnection();
    try {
      const hasManual = await Waitlist._hasManualOrder(connection, barberId, date, time);
      const priority = await Waitlist._getBarberPriority(connection, barberId);

      let orderClause;
      if (hasManual) {
        orderClause = 'COALESCE(w.manual_position, 999999) ASC, w.id ASC';
      } else if (priority === 'haircut_count') {
        orderClause = 'haircut_count DESC, w.id ASC';
      } else {
        orderClause = 'w.id ASC';
      }

      const [rows] = await connection.query(`
        SELECT
          w.id,
          w.user_id,
          w.service_id,
          w.date,
          w.time,
          w.status,
          w.created_at,
          w.manual_position,
          w.pending_position,
          u.name as user_name,
          u.phone as user_phone,
          s.name as service_name,
          TIMESTAMPDIFF(MINUTE, w.created_at, NOW()) as minutes_waiting,
          (SELECT COUNT(*) FROM appointments a
           WHERE a.user_id = w.user_id AND a.barber_id = w.barber_id
             AND a.status = 'completed') as haircut_count
        FROM waitlist_entries w
        LEFT JOIN users u ON w.user_id = u.id
        LEFT JOIN services s ON w.service_id = s.id
        WHERE w.barber_id = ? AND w.date = ? AND w.time = ? AND w.status = 'waiting'
        ORDER BY ${orderClause}
      `, [barberId, date, time]);

      return rows.map((row, index) => ({ ...row, position: index + 1 }));
    } finally {
      connection.release();
    }
  }

  // Rule 5: Get all time slots that have waiting clients for a barber on a given date
  static async getWaitlistSlots(barberId, date) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT time, COUNT(*) as waiting_count
         FROM waitlist_entries
         WHERE barber_id = ? AND date = ? AND status = 'waiting'
         GROUP BY time
         ORDER BY time ASC`,
        [barberId, date]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  // Rules 6 & 7: Store pending position changes (not applied until confirmed)
  static async setPendingPositions(barberId, date, time, positions) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Clear existing pending positions for this slot
      await connection.query(
        `UPDATE waitlist_entries SET pending_position = NULL
         WHERE barber_id = ? AND date = ? AND time = ? AND status = 'waiting'`,
        [barberId, date, time]
      );

      // Set new pending positions
      for (const { id, position } of positions) {
        await connection.query(
          `UPDATE waitlist_entries SET pending_position = ?
           WHERE id = ? AND barber_id = ? AND date = ? AND time = ? AND status = 'waiting'`,
          [position, id, barberId, date, time]
        );
      }

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  // Rule 7: Apply pending positions to manual_position
  static async confirmPositionChanges(barberId, date, time) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        `UPDATE waitlist_entries
         SET manual_position = pending_position, pending_position = NULL, updated_at = NOW()
         WHERE barber_id = ? AND date = ? AND time = ? AND status = 'waiting'
           AND pending_position IS NOT NULL`,
        [barberId, date, time]
      );
      return result.affectedRows;
    } finally {
      connection.release();
    }
  }

  // Rule 7: Cancel pending changes without applying
  static async cancelPendingReorder(barberId, date, time) {
    const connection = await pool.getConnection();
    try {
      await connection.query(
        `UPDATE waitlist_entries SET pending_position = NULL
         WHERE barber_id = ? AND date = ? AND time = ? AND status = 'waiting'`,
        [barberId, date, time]
      );
    } finally {
      connection.release();
    }
  }

  static async findByUserId(userId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(`
        SELECT w.*, b.name as barber_name, s.name as service_name
        FROM waitlist_entries w
        LEFT JOIN users b ON w.barber_id = b.id
        LEFT JOIN services s ON w.service_id = s.id
        WHERE w.user_id = ?
        ORDER BY w.created_at DESC
      `, [userId]);
      return rows;
    } finally {
      connection.release();
    }
  }

  static async notifyEntry(id) {
    const connection = await pool.getConnection();
    try {
      await connection.query(
        `UPDATE waitlist_entries SET status = 'notified', notified_at = NOW(), updated_at = NOW() WHERE id = ?`,
        [id]
      );
      return await this.findById(id);
    } finally {
      connection.release();
    }
  }

  static async findExpiredNotified(timeoutMinutes) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(`
        SELECT * FROM waitlist_entries
        WHERE status = 'notified'
          AND notified_at IS NOT NULL
          AND notified_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)
      `, [timeoutMinutes]);
      return rows;
    } finally {
      connection.release();
    }
  }

  static async updateStatus(id, status) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        'UPDATE waitlist_entries SET status = ?, updated_at = NOW() WHERE id = ?',
        [status, id]
      );
      if (result.affectedRows === 0) return null;
      return await this.findById(id);
    } finally {
      connection.release();
    }
  }
}

module.exports = Waitlist;
