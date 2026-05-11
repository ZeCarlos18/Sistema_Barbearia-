const pool = require('../database');
const bcryptjs = require('bcryptjs');

class User {
  /**
   * Criar novo usuário no banco de dados
   * @param {Object} userData - Dados do usuário {email, password, name, phone, role}
   * @returns {Object} Dados do usuário criado
   */
  static async create(userData) {
    const { email, password, name, phone = null, role = 'client' } = userData;
    
    const connection = await pool.getConnection();
    
    try {
      // Verificar se o email já existe
      const [existingUser] = await connection.query(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );
      
      if (existingUser.length > 0) {
        throw new Error('EMAIL_ALREADY_EXISTS');
      }
      
      // Hash da senha
      const hashedPassword = await bcryptjs.hash(password, 10);
      
      // Inserir novo usuário
      const [result] = await connection.query(
        'INSERT INTO users (name, email, password, phone, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
        [name, email, hashedPassword, phone, role]
      );
      
      return {
        id: result.insertId,
        name,
        email,
        createdAt: new Date()
      };
    } finally {
      connection.release();
    }
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
   * Buscar usuário por ID
   * @param {Number} id - ID do usuário
   * @returns {Object} Dados do usuário ou null
   */
  static async findById(id) {
    const connection = await pool.getConnection();
    
    try {
      const [users] = await connection.query(
        'SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?',
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
  static async findByRole(role) {
    const connection = await pool.getConnection();
    
    try {
      const [users] = await connection.query(
        'SELECT id, name, email, phone, role, created_at FROM users WHERE role = ?',
        [role]
      );
      
      return users;
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
