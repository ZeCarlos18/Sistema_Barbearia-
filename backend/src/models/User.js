const pool = require('../database');
const bcryptjs = require('bcryptjs');
const crypto = require('crypto');

class User {
  /**
   * Criar novo usuário no banco de dados
   * @param {Object} userData - Dados do usuário {email, password, name, phone, role, availableDays, startTime, endTime, photoUrl}
   * @returns {Object} Dados do usuário criado
   */

  static async create(userData) {
    const { 
      email, 
      password, 
      name, 
      phone = null, 
      role = 'client',
      availableDays = null,
      startTime = null,
      endTime = null,
      photoUrl = null
    } = userData;
    
    const connection = await pool.getConnection();
    
    try {
      const [existingUser] = await connection.query(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );
      
      if (existingUser.length > 0) throw new Error('EMAIL_ALREADY_EXISTS');
      
      const hashedPassword = await bcryptjs.hash(password, 10);
      
      const [result] = await connection.query(
        `INSERT INTO users 
        (name, email, password, phone, role, available_days, start_time, end_time, photo_url, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [name, email, hashedPassword, phone, role, availableDays, startTime, endTime, photoUrl]
      );
      
      return { id: result.insertId, name, email, phone, role, createdAt: new Date() };
    } finally {
      connection.release();
    }
  }

  /**
   * Buscar um cliente existente pelo telefone ou criar um cadastro mínimo para ele.
   * Usado no registro manual de agendamentos (RF26), quando o cliente agenda por
   * telefone, WhatsApp ou presencialmente e pode não possuir conta no sistema.
   * @param {Object} data - {name, phone}
   * @returns {Object} { user, created } - usuário encontrado/criado e se foi criado agora
   */
  static async findOrCreateClient({ name, phone }) {
    const connection = await pool.getConnection();
    try {
      if (phone) {
        const [existing] = await connection.query(
          'SELECT id, name, email, phone, role FROM users WHERE phone = ?',
          [phone]
        );

        if (existing.length > 0) {
          return { user: existing[0], created: false };
        }
      }
    } finally {
      connection.release();
    }

    // Cliente não encontrado: cria um cadastro mínimo (login por senha não é o objetivo aqui,
    // já que o agendamento foi feito fora do sistema pelo próprio barbeiro).
    const placeholderEmail = phone ? `cliente.${phone}.${Date.now()}@barbearia.local` : `cliente.${Date.now()}@barbearia.local`;
    const randomPassword = crypto.randomBytes(16).toString('hex');

    const created = await this.create({
      name,
      email: placeholderEmail,
      password: randomPassword,
      phone,
      role: 'client'
    });

    return {
      user: { id: created.id, name: created.name, email: created.email, phone, role: 'client' },
      created: true
    };
  }

  /**
   * Buscar usuário por email
   * @param {String} email - Email do usuário
   * @returns {Object} Dados do usuário ou null
   */
  static async findByEmail(email) {
    const connection = await pool.getConnection();
    
    try {
      const [users] = await connection.query(
        'SELECT id, name, email, password, role FROM users WHERE email = ?',
        [email]
      );
      
      return users.length > 0 ? users[0] : null;
    } finally {
      connection.release();
    }
  }

  /**
   * Buscar usuário por nome exato
   * @param {String} name - Nome do usuário
   * @returns {Object} Dados do usuário ou null
   */
  static async findByName(name) {
    const connection = await pool.getConnection();
    
    try {
      const [users] = await connection.query(
        'SELECT id, name FROM users WHERE name = ?',
        [name]
      );
      
      return users.length > 0 ? users[0] : null;
    } finally {
      connection.release();
    }
  }
  
  /**
   * Buscar usuário por ID
   * @param {Number} id - ID do usuário
   * @returns {Object} Dados do usuário ou null
   */
  static async findById(id) {
    const connection = await pool.getConnection();
    
    try {
      const [users] = await connection.query(
        'SELECT id, name, email, phone, role, active, created_at FROM users WHERE id = ?',
        [id]
      );
      
      return users.length > 0 ? users[0] : null;
    } finally {
      connection.release();
    }
  }

  /**
   * Verificar password do usuário
   * @param {String} password - Senha em texto plano
   * @param {String} hashedPassword - Senha com hash
   * @returns {Boolean}
   */
  static async comparePassword(password, hashedPassword) {
    return await bcryptjs.compare(password, hashedPassword);
  }

  /**
   * Obter todos os usuários (apenas para testes/admin)
   * @returns {Array} Lista de usuários
   */
  static async getAll() {
    const connection = await pool.getConnection();
    
    try {
      const [users] = await connection.query(
        'SELECT id, name, email, created_at FROM users'
      );
      
      return users;
    } finally {
      connection.release();
    }
  }

  /**
   * Buscar usuários por role
   * @param {String} role - Role do usuário (barber, client, admin)
   * @returns {Array} Lista de usuários com a role especificada
   */
  static async findByRole(role, options = {}) {
    const connection = await pool.getConnection();
    
    try {
      let sql = 'SELECT id, name, email, phone, role, active, created_at FROM users WHERE role = ?';
      const params = [role];

      if (role === 'barber' && !options.includeInactive) {
        sql += ' AND active = 1';
      }

      const [users] = await connection.query(sql, params);
      return users;
    } finally {
      connection.release();
    }
  }

  static async updateActive(id, active) {
    const connection = await pool.getConnection();

    try {
      const [result] = await connection.query(
        'UPDATE users SET active = ?, updated_at = NOW() WHERE id = ?',
        [active ? 1 : 0, id]
      );

      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  /**
   * Buscar usuário por telefone
   * @param {String} phone - Telefone do usuário
   * @returns {Object} Dados do usuário ou null
   */
  static async findByPhone(phone) {
    const connection = await pool.getConnection();

    try {
      const [users] = await connection.query(
        'SELECT id, name, email, phone FROM users WHERE phone = ?',
        [phone]
      );

      return users.length > 0 ? users[0] : null;
    } finally {
      connection.release();
    }
  }

  /**
   * Atualizar dados do usuário
   * @param {Number} id - ID do usuário
   * @param {Object} updateData - Dados para atualizar {name, email, phone, password}
   * @returns {Object} Dados atualizados do usuário
   */
  static async update(id, updateData) {
    const { name, email, phone, password } = updateData;
    
    const connection = await pool.getConnection();
    
    try {
      // Verificar se o usuário existe
      const [existingUser] = await connection.query(
        'SELECT id, name, email, phone FROM users WHERE id = ?',
        [id]
      );
      
      if (existingUser.length === 0) {
        throw new Error('USER_NOT_FOUND');
      }
      
      // Verificar duplicatas para email e phone, excluindo o próprio usuário
      if (email) {
        const [emailCheck] = await connection.query(
          'SELECT id FROM users WHERE email = ? AND id != ?',
          [email, id]
        );
        if (emailCheck.length > 0) {
          throw new Error('EMAIL_ALREADY_EXISTS');
        }
      }
      
      if (phone) {
        const [phoneCheck] = await connection.query(
          'SELECT id FROM users WHERE phone = ? AND id != ?',
          [phone, id]
        );
        if (phoneCheck.length > 0) {
          throw new Error('PHONE_ALREADY_EXISTS');
        }
      }
      
      // Preparar query de update
      let updateFields = [];
      let updateValues = [];
      
      if (name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(name);
      }
      
      if (email !== undefined) {
        updateFields.push('email = ?');
        updateValues.push(email);
      }
      
      if (phone !== undefined) {
        updateFields.push('phone = ?');
        updateValues.push(phone);
      }
      
      if (password) {
        const hashedPassword = await bcryptjs.hash(password, 10);
        updateFields.push('password = ?');
        updateValues.push(hashedPassword);
      }
      
      if (updateFields.length === 0) {
        throw new Error('NO_FIELDS_TO_UPDATE');
      }
      
      updateFields.push('updated_at = NOW()');
      updateValues.push(id);
      
      const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
      
      await connection.query(query, updateValues);
      
      // Retornar dados atualizados
      const [updatedUser] = await connection.query(
        'SELECT id, name, email, phone, updated_at FROM users WHERE id = ?',
        [id]
      );
      
      return updatedUser[0];
    } finally {
      connection.release();
    }
  }

  /**
   * Buscar usuário completo por ID (incluindo password para verificação)
   * @param {Number} id - ID do usuário
   * @returns {Object} Dados completos do usuário
   */
  static async findByIdWithPassword(id) {
    const connection = await pool.getConnection();
    
    try {
      const [users] = await connection.query(
        'SELECT id, name, email, password, phone FROM users WHERE id = ?',
        [id]
      );
      
      return users.length > 0 ? users[0] : null;
    } finally {
      connection.release();
    }
  }

  /**
   * Atualizar senha usando e-mail (fluxo de recuperação)
   * @param {String} email - E-mail do usuário
   * @param {String} newPassword - Nova senha em texto plano
   * @returns {Boolean} true quando atualizar com sucesso
   */
  static async updatePasswordByEmail(email, newPassword) {
    const connection = await pool.getConnection();

    try {
      const hashedPassword = await bcryptjs.hash(newPassword, 10);
      const [result] = await connection.query(
        'UPDATE users SET password = ?, updated_at = NOW() WHERE email = ?',
        [hashedPassword, email]
      );

      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  /**
   * Excluir usuário por ID
   * @param {Number} id - ID do usuário
   * @returns {Boolean} True se excluído, false se não encontrado
   */
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      const [result] = await connection.query(
        'DELETE FROM users WHERE id = ?',
        [id]
      );
      
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }
}

module.exports = User;