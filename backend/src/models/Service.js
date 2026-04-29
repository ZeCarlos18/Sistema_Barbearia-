const pool = require('../database');

class Service {
  /**
   * Criar novo serviço no banco de dados
   * @param {Object} serviceData - Dados do serviço {name, description, price, duration}
   * @returns {Object} Dados do serviço criado
   */
  static async create(serviceData) {
    const { name, description, price, duration } = serviceData;
    
    const connection = await pool.getConnection();
    
    try {
      const [result] = await connection.query(
        'INSERT INTO services (name, description, price, duration, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
        [name, description, price, duration]
      );
      
      return {
        id: result.insertId,
        name,
        description,
        price,
        duration,
        createdAt: new Date()
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Buscar todos os serviços
   * @returns {Array} Lista de serviços
   */
  static async findAll() {
    const connection = await pool.getConnection();
    
    try {
      const [rows] = await connection.query(
        'SELECT * FROM services ORDER BY name ASC'
      );
      
      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Buscar serviço por ID
   * @param {Number} id - ID do serviço
   * @returns {Object} Dados do serviço ou null
   */
  static async findById(id) {
    const connection = await pool.getConnection();
    
    try {
      const [rows] = await connection.query(
        'SELECT * FROM services WHERE id = ?',
        [id]
      );
      
      return rows.length > 0 ? rows[0] : null;
    } finally {
      connection.release();
    }
  }

  /**
   * Atualizar serviço
   * @param {Number} id - ID do serviço
   * @param {Object} serviceData - Dados atualizados do serviço
   * @returns {Object} Dados do serviço atualizado
   */
  static async update(id, serviceData) {
    const { name, description, price, duration } = serviceData;
    
    const connection = await pool.getConnection();
    
    try {
      const [result] = await connection.query(
        'UPDATE services SET name = ?, description = ?, price = ?, duration = ?, updated_at = NOW() WHERE id = ?',
        [name, description, price, duration, id]
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
   * Deletar serviço
   * @param {Number} id - ID do serviço
   * @returns {Boolean} True se deletado com sucesso
   */
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      const [result] = await connection.query(
        'DELETE FROM services WHERE id = ?',
        [id]
      );
      
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }
}

module.exports = Service;