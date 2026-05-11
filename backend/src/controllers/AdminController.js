const User = require('../models/User');

/**
 * AdminController - Controlador de administração
 * Gerencia funções administrativas como gestão de barbeiros
 */
class AdminController {
  /**
   * Criar novo barbeiro
   * POST /api/admin/barbers
   */
  static async createBarber(req, res) {
    try {
      const { name, email, password, phone } = req.body;

      // Validar campos obrigatórios
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Nome, email e senha são obrigatórios'
        });
      }

      // Validar email único
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Este email já está registrado no sistema'
        });
      }

      // Criar barbeiro com role 'barber'
      const newBarber = await User.create({
        name,
        email,
        password,
        phone,
        role: 'barber'
      });

      return res.status(201).json({
        success: true,
        message: 'Barbeiro criado com sucesso',
        barber: {
          id: newBarber.id,
          name: newBarber.name,
          email: newBarber.email,
          phone: newBarber.phone,
          role: 'barber'
        }
      });
    } catch (error) {
      console.error('Erro ao criar barbeiro:', error);

      if (error.message === 'EMAIL_ALREADY_EXISTS') {
        return res.status(409).json({
          success: false,
          message: 'Este email já está registrado no sistema'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erro ao criar barbeiro',
        error: error.message
      });
    }
  }

  /**
   * Listar todos os barbeiros
   * GET /api/admin/barbers
   */
  static async getBarbers(req, res) {
    try {
      const barbers = await User.findByRole('barber');

      return res.status(200).json({
        success: true,
        total: barbers.length,
        barbers: barbers.map(barber => ({
          id: barber.id,
          name: barber.name,
          email: barber.email,
          phone: barber.phone,
          createdAt: barber.created_at
        }))
      });
    } catch (error) {
      console.error('Erro ao listar barbeiros:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao listar barbeiros',
        error: error.message
      });
    }
  }

  /**
   * Obter detalhes de um barbeiro específico
   * GET /api/admin/barbers/:id
   */
  static async getBarberById(req, res) {
    try {
      const { id } = req.params;

      const barber = await User.findById(id);

      if (!barber) {
        return res.status(404).json({
          success: false,
          message: 'Barbeiro não encontrado'
        });
      }

      // Verificar se é realmente um barbeiro
      if (barber.role !== 'barber') {
        return res.status(404).json({
          success: false,
          message: 'Usuário encontrado não é um barbeiro'
        });
      }

      return res.status(200).json({
        success: true,
        barber: {
          id: barber.id,
          name: barber.name,
          email: barber.email,
          phone: barber.phone,
          role: barber.role,
          createdAt: barber.created_at
        }
      });
    } catch (error) {
      console.error('Erro ao obter barbeiro:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao obter barbeiro',
        error: error.message
      });
    }
  }

  /**
   * Excluir barbeiro
   * DELETE /api/admin/barbers/:id
   */
  static async deleteBarber(req, res) {
    try {
      const { id } = req.params;

      // Verificar se o barbeiro existe e é realmente um barbeiro
      const barber = await User.findById(id);
      if (!barber) {
        return res.status(404).json({
          success: false,
          message: 'Barbeiro não encontrado'
        });
      }

      if (barber.role !== 'barber') {
        return res.status(400).json({
          success: false,
          message: 'Este usuário não é um barbeiro'
        });
      }

      // Excluir barbeiro
      const deleted = await User.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Barbeiro não encontrado'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Barbeiro excluído com sucesso'
      });
    } catch (error) {
      console.error('Erro ao excluir barbeiro:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao excluir barbeiro',
        error: error.message
      });
    }
  }
}

module.exports = AdminController;