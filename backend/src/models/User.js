const pool = require('../database');
const bcryptjs = require('bcryptjs');

class User {
  /**
   * Criar novo usuário no banco de dados
   * @param {Object} userData - Dados do usuário {email, password, name}
   * @returns {Object} Dados do usuário criado
   */
  static async create(userData) {
    const { email, password, name } = userData;
    
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
        'INSERT INTO users (name, email, password, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
        [name, email, hashedPassword]
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
        'SELECT id, name, email, password FROM users WHERE email = ?',
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
        'SELECT id, name, email, created_at FROM users WHERE id = ?',
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
}

module.exports = User;
