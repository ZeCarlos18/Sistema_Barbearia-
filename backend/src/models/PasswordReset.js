const pool = require('../database');
const crypto = require('crypto');

/**
 * PasswordReset - Tokens de recuperação de senha enviados por e-mail
 *
 * Regras de segurança aplicadas:
 * - O token que vai no e-mail é aleatório (32 bytes) e NUNCA é salvo em texto puro.
 *   O banco guarda apenas o hash SHA-256, então um vazamento da tabela não permite
 *   redefinir a senha de ninguém.
 * - Cada token tem validade curta e é de uso único (used_at).
 * - Ao pedir um novo link, os links anteriores do mesmo usuário são invalidados.
 */
class PasswordReset {
  /**
   * Gera o hash usado para armazenar/consultar o token
   * @param {String} token - Token em texto puro (o que vai na URL do e-mail)
   * @returns {String} hash SHA-256 em hexadecimal
   */
  static hashToken(token) {
    return crypto.createHash('sha256').update(String(token)).digest('hex');
  }

  /**
   * Criar um token de recuperação para um usuário
   * @param {Number} userId - ID do usuário
   * @param {Number} expiresInMinutes - Tempo de validade em minutos
   * @returns {String} token em texto puro (para montar o link do e-mail)
   */
  static async create(userId, expiresInMinutes = 30) {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);

    const connection = await pool.getConnection();

    try {
      // Invalida links anteriores ainda válidos: só o mais recente deve funcionar
      await connection.query(
        'UPDATE password_resets SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL',
        [userId]
      );

      await connection.query(
        `INSERT INTO password_resets (user_id, token_hash, expires_at, created_at)
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE), NOW())`,
        [userId, tokenHash, expiresInMinutes]
      );

      return token;
    } finally {
      connection.release();
    }
  }

  /**
   * Buscar um token válido (não usado e não expirado) junto com os dados do usuário
   * @param {String} token - Token em texto puro vindo da URL
   * @returns {Object|null} {id, user_id, email, name} ou null se inválido/expirado
   */
  static async findValidByToken(token) {
    const tokenHash = this.hashToken(token);
    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.query(
        `SELECT pr.id, pr.user_id, u.email, u.name
         FROM password_resets pr
         INNER JOIN users u ON u.id = pr.user_id
         WHERE pr.token_hash = ?
           AND pr.used_at IS NULL
           AND pr.expires_at > NOW()
         LIMIT 1`,
        [tokenHash]
      );

      return rows.length > 0 ? rows[0] : null;
    } finally {
      connection.release();
    }
  }

  /**
   * Marcar um token como utilizado (uso único)
   * @param {Number} id - ID do registro em password_resets
   * @returns {Boolean}
   */
  static async markAsUsed(id) {
    const connection = await pool.getConnection();

    try {
      const [result] = await connection.query(
        'UPDATE password_resets SET used_at = NOW() WHERE id = ? AND used_at IS NULL',
        [id]
      );

      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  /**
   * Contar pedidos recentes de um usuário (proteção contra flood de e-mails)
   * @param {Number} userId - ID do usuário
   * @param {Number} windowSeconds - Janela de tempo em segundos
   * @returns {Number} quantidade de pedidos feitos dentro da janela
   */
  static async countRecentRequests(userId, windowSeconds = 60) {
    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.query(
        `SELECT COUNT(*) AS total
         FROM password_resets
         WHERE user_id = ?
           AND created_at > DATE_SUB(NOW(), INTERVAL ? SECOND)`,
        [userId, windowSeconds]
      );

      return Number(rows[0]?.total || 0);
    } finally {
      connection.release();
    }
  }

  /**
   * Remover tokens expirados/usados antigos (limpeza opcional de manutenção)
   * @returns {Number} quantidade de registros removidos
   */
  static async deleteExpired() {
    const connection = await pool.getConnection();

    try {
      const [result] = await connection.query(
        'DELETE FROM password_resets WHERE expires_at < DATE_SUB(NOW(), INTERVAL 7 DAY)'
      );

      return result.affectedRows;
    } finally {
      connection.release();
    }
  }
}

module.exports = PasswordReset;
