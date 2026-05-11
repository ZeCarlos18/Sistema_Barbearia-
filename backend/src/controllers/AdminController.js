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
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'O campo nome é obrigatório e não pode estar em branco'
        });
      }

      if (!email || !email.trim()) {
        return res.status(400).json({
          success: false,
          message: 'O campo email é obrigatório'
        });
      }

      if (!phone || !phone.trim()) {
        return res.status(400).json({
          success: false,
          message: 'O campo telefone é obrigatório'
        });
      }

      // Validar nome apenas letras e espaços
      const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ ]+$/;
      if (!nameRegex.test(name.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Nome inválido: apenas letras e espaços são permitidos'
        });
      }

      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Formato de email inválido'
        });
      }

      // Normalizar telefone
      const formattedPhone = phone.replace(/\D/g, '');
      const phoneRegex = /^\d{10,11}$/;
      if (!phoneRegex.test(formattedPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Telefone inválido: deve conter DDD e apenas números (10 ou 11 dígitos)'
        });
      }

      // Validar email duplicado
      const existingByEmail = await User.findByEmail(email.trim().toLowerCase());
      if (existingByEmail) {
        return res.status(409).json({
          success: false,
          message: 'Este email já está registrado no sistema'
        });
      }

      // Validar telefone duplicado
      const existingByPhone = await User.findByPhone(formattedPhone);
      if (existingByPhone) {
        return res.status(409).json({
          success: false,
          message: 'Este telefone já está registrado no sistema'
        });
      }

      // Gerar senha temporária caso não seja informada
      const randomPassword = password && password.trim() ? password : AdminController.generateTemporaryPassword();

      // Criar barbeiro com role 'barber'
      const newBarber = await User.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: randomPassword,
        phone: formattedPhone,
        role: 'barber'
      });

      const responsePayload = {
        success: true,
        message: 'Barbeiro criado com sucesso',
        barber: {
          id: newBarber.id,
          name: newBarber.name,
          email: newBarber.email,
          phone: formattedPhone,
          role: 'barber'
        }
      };

      if (!password || !password.trim()) {
        responsePayload.generatedPassword = randomPassword;
      }

      return res.status(201).json(responsePayload);
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

  static generateTemporaryPassword() {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const specials = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const all = upper + lower + digits + specials;

    const getRandom = (chars) => chars[Math.floor(Math.random() * chars.length)];

    let password = '';
    password += getRandom(upper);
    password += getRandom(lower);
    password += getRandom(digits);
    password += getRandom(specials);

    for (let i = 4; i < 10; i += 1) {
      password += getRandom(all);
    }

    return password;
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