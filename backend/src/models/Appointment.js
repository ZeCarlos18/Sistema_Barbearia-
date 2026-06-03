const pool = require('../database');

class Appointment {
  /**
   * Criar novo agendamento
   * @param {Object} appointmentData - Dados do agendamento {userId, barberId, serviceId, date, time}
   * @returns {Object} Dados do agendamento criado
   */
  static async create(appointmentData) {
    const { userId, barberId, serviceId, date, time } = appointmentData;
    
    const connection = await pool.getConnection();
    
    try {
      const [result] = await connection.query(
        'INSERT INTO appointments (user_id, barber_id, service_id, date, time, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, "confirmed", NOW(), NOW())',
        [userId, barberId, serviceId, date, time]
      );
      
      return {
        id: result.insertId,
        userId,
        barberId,
        serviceId,
        date,
        time,
        status: 'confirmed',
        createdAt: new Date()
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Buscar todos os agendamentos
   * @returns {Array} Lista de agendamentos
   */
  static async findAll() {
    const connection = await pool.getConnection();
    
    try {
      const [rows] = await connection.query(`
        SELECT a.*, u.name as user_name, u.email as user_email, 
                b.name as barber_name, s.name as service_name
        FROM appointments a
        LEFT JOIN users u ON a.user_id = u.id
        LEFT JOIN users b ON a.barber_id = b.id
        LEFT JOIN services s ON a.service_id = s.id
        ORDER BY a.date DESC, a.time DESC
      `);
      
      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Buscar agendamento por ID
   * @param {Number} id - ID do agendamento
   * @returns {Object} Dados do agendamento ou null
   */
  static async findById(id) {
    const connection = await pool.getConnection();
    
    try {
      const [rows] = await connection.query(`
        SELECT a.*, u.name as user_name, u.email as user_email, 
                b.name as barber_name, s.name as service_name
        FROM appointments a
        LEFT JOIN users u ON a.user_id = u.id
        LEFT JOIN users b ON a.barber_id = b.id
        LEFT JOIN services s ON a.service_id = s.id
        WHERE a.id = ?
      `, [id]);
      
      return rows.length > 0 ? rows[0] : null;
    } finally {
      connection.release();
    }
  }

  /**
   * Buscar agendamentos por usuário
   * @param {Number} userId - ID do usuário
   * @returns {Array} Lista de agendamentos do usuário
   */
  static async findByUserId(userId) {
    const connection = await pool.getConnection();
    
    try {
      const [rows] = await connection.query(`
        SELECT a.*, b.name as barber_name, s.name as service_name, s.duration
        FROM appointments a
        LEFT JOIN users b ON a.barber_id = b.id
        LEFT JOIN services s ON a.service_id = s.id
        WHERE a.user_id = ?
        ORDER BY a.date DESC, a.time DESC
      `, [userId]);
      
      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Buscar agendamentos por barbeiro
   * @param {Number} barberId - ID do barbeiro
   * @returns {Array} Lista de agendamentos do barbeiro
   */
  static async findByBarberId(barberId) {
    const connection = await pool.getConnection();
    
    try {
      const [rows] = await connection.query(`
        SELECT a.*, s.price as service_price, u.name as user_name, u.email as user_email, s.name as service_name
        FROM appointments a
        LEFT JOIN users u ON a.user_id = u.id
        LEFT JOIN services s ON a.service_id = s.id
        WHERE a.barber_id = ?
        ORDER BY a.date DESC, a.time DESC
      `, [barberId]);
      
      return rows;
    } finally {
      connection.release();
    }
  }

/**
   * Buscar agendamentos ativos do usuário
   * @param {Number} userId - ID do usuário
   * @returns {Array} Lista de agendamentos ativos (pending ou confirmed)
   */
  static async findActiveByUserId(userId) {
    const connection = await pool.getConnection();
    
    try {
      const [rows] = await connection.query(`
        SELECT a.*, b.name as barber_name, s.name as service_name
        FROM appointments a
        LEFT JOIN users b ON a.barber_id = b.id
        LEFT JOIN services s ON a.service_id = s.id
        WHERE a.user_id = ? 
          AND a.status IN ('pending', 'confirmed')
          AND a.date >= CURDATE()
        ORDER BY a.date ASC, a.time ASC
      `, [userId]);
      
      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Buscar horários ocupados por barbeiro em uma data específica
   * Considera apenas agendamentos confirmados ou completados
   * @param {Number} barberId - ID do barbeiro
   * @param {String} date - Data no formato YYYY-MM-DD
   * @returns {Array} Lista de horários ocupados
   */
  static async getOccupiedTimes(barberId, date) {
    const connection = await pool.getConnection();
    
    try {
      const [rows] = await connection.query(
        'SELECT time FROM appointments WHERE barber_id = ? AND date = ? AND status IN ("confirmed", "completed")',
        [barberId, date]
      );
      
      // Normalizar formato do horário 
      return rows.map(row => {
        const time = row.time;
        if (typeof time === 'string') {
          return time.substring(0, 5); 
        }
        // Se for objeto Date do MySQL
        const hours = String(time.getHours()).padStart(2, '0');
        const minutes = String(time.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      });
    } finally {
      connection.release();
    }
  }

  /**
   * Buscar agendamentos por data
   * @param {String} date - Data no formato YYYY-MM-DD
   * @returns {Array} Lista de agendamentos na data
   */
  static async findByDate(date) {
    const connection = await pool.getConnection();
    
    try {
      const [rows] = await connection.query(`
        SELECT a.*, u.name as user_name, u.email as user_email, 
                b.name as barber_name, s.name as service_name
        FROM appointments a
        LEFT JOIN users u ON a.user_id = u.id
        LEFT JOIN users b ON a.barber_id = b.id
        LEFT JOIN services s ON a.service_id = s.id
        WHERE a.date = ?
        ORDER BY a.time ASC
      `, [date]);
      
      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Buscar agendamentos de um usuário em uma data específica
   * @param {Number} userId - ID do usuário
   * @param {String} date - Data no formato YYYY-MM-DD
   * @returns {Array} Lista de agendamentos do usuário na data
   */
  static async findByUserAndDate(userId, date) {
    const connection = await pool.getConnection();
    
    try {
      const [rows] = await connection.query(`
        SELECT a.*, b.name as barber_name, s.name as service_name
        FROM appointments a
        LEFT JOIN users b ON a.barber_id = b.id
        LEFT JOIN services s ON a.service_id = s.id
        WHERE a.user_id = ? AND a.date = ?
        ORDER BY a.time ASC
      `, [userId, date]);
      
      return rows;
    } finally {
      connection.release();
    }
  }

/**
   * Buscar agendamentos ativos do usuário
   * @param {Number} userId - ID do usuário
   * @returns {Array} Lista de agendamentos ativos (pending ou confirmed)
   */
  static async findActiveByUserId(userId) {
    const connection = await pool.getConnection();
    
    try {
      const [rows] = await connection.query(`
        SELECT a.*, b.name as barber_name, s.name as service_name
        FROM appointments a
        LEFT JOIN users b ON a.barber_id = b.id
        LEFT JOIN services s ON a.service_id = s.id
        WHERE a.user_id = ? 
          AND a.status IN ('pending', 'confirmed')
          AND a.date >= CURDATE()
        ORDER BY a.date ASC, a.time ASC
      `, [userId]);
      
      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Buscar agendamentos passados e futuros do usuário
   * Seguindo RF23 - Visualizar Agendamentos Futuros e Passados
   * @param {Number} userId - ID do usuário
   * @returns {Object} { past: [], future: [] } agendamentos organizados por tipo
   */
  static async findPastAndFutureByUserId(userId) {
    const connection = await pool.getConnection();
    
    try {
      const [rows] = await connection.query(`
        SELECT a.*, b.name as barber_name, s.name as service_name
        FROM appointments a
        LEFT JOIN users b ON a.barber_id = b.id
        LEFT JOIN services s ON a.service_id = s.id
        WHERE a.user_id = ?
          AND a.status IN ('confirmed', 'completed', 'cancelled')
        ORDER BY a.date ASC, a.time ASC
      `, [userId]);

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const past = [];
      const future = [];

      rows.forEach(appointment => {
        const appointmentDate = new Date(appointment.date);
        appointmentDate.setHours(0, 0, 0, 0);

        if (appointmentDate < now || (appointmentDate.getTime() === now.getTime() && appointment.time < new Date().toTimeString().slice(0, 5))) {
          past.push(appointment);
        } else {
          future.push(appointment);
        }
      });

      return {
        past: past.reverse(), // Mostrar mais recentes primeiro nos passados
        future: future
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Atualizar status do agendamento
   * @param {Number} id - ID do agendamento
   * @param {String} status - Novo status
   * @returns {Object} Dados do agendamento atualizado
   */
  static async updateStatus(id, status) {
    const connection = await pool.getConnection();
    
    try {
      const [result] = await connection.query(
        'UPDATE appointments SET status = ?, updated_at = NOW() WHERE id = ?',
        [status, id]
      );
      
      if (result.affectedRows === 0) {
        return null;
      }
      
      return await this.findById(id);
    } finally {
      connection.release();
    }
  }

  /**
   * Cancelar agendamento
   * @param {Number} id - ID do agendamento
   * @returns {Boolean} True se cancelado com sucesso
   */
  static async cancel(id) {
    return await this.updateStatus(id, 'cancelled');
  }

  /**
   * Deletar agendamento
   * @param {Number} id - ID do agendamento
   * @returns {Boolean} True se deletado com sucesso
   */
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      const [result] = await connection.query(
        'DELETE FROM appointments WHERE id = ?',
        [id]
      );
      
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  static async findByBarberAndDate(barberId, date) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(`
        SELECT a.*, s.price as service_price, u.name as user_name, u.phone as user_phone, u.email as user_email,
               s.name as service_name, s.duration as service_duration
        FROM appointments a
        LEFT JOIN users u ON a.user_id = u.id
        LEFT JOIN services s ON a.service_id = s.id
        WHERE a.barber_id = ? AND a.date = ? AND a.status IN ('confirmed', 'completed')
        ORDER BY a.time ASC
      `, [barberId, date]);
      return rows;
    } finally {
      connection.release();
    }
  }

  static async findByBarberDateRange(barberId, startDate, endDate) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(`
        SELECT a.*, s.price as service_price, u.name as user_name, u.phone as user_phone, u.email as user_email,
               s.name as service_name, s.duration as service_duration
        FROM appointments a
        LEFT JOIN users u ON a.user_id = u.id
        LEFT JOIN services s ON a.service_id = s.id
        WHERE a.barber_id = ? AND a.date BETWEEN ? AND ? AND a.status IN ('confirmed', 'completed')
        ORDER BY a.date ASC, a.time ASC
      `, [barberId, startDate, endDate]);
      return rows;
    } finally {
      connection.release();
    }
  }
}

module.exports = Appointment;