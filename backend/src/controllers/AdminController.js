const User = require('../models/User');
const BarberService = require('../services/BarberService');
const { handleError } = require('../utils/errorHandler');

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
// Receber todos os dados do corpo da requisição
      const { name, email, password, phone, availableDays, startTime, endTime, photoUrl } = req.body;

      // 1. Validação de Preenchimento Obrigatório (Nome, Email, Telefone)
      if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'O nome é obrigatório.' });
      if (!email || !email.trim()) return res.status(400).json({ success: false, message: 'O email é obrigatório.' });
      if (!phone || !phone.trim()) return res.status(400).json({ success: false, message: 'O telefone é obrigatório.' });

      // 2. Dias e Horários Obrigatórios e Lógicos
      if (!availableDays || !Array.isArray(availableDays) || availableDays.length === 0) {
        return res.status(400).json({ success: false, message: 'Selecione pelo menos um dia de atendimento.' });
      }
      
      if (!startTime || !startTime.trim() || startTime === '00:00') {
        return res.status(400).json({ success: false, message: 'O horário de início é inválido ou não pode ser 00:00.' });
      }
      
      if (!endTime || !endTime.trim() || endTime === '00:00') {
        return res.status(400).json({ success: false, message: 'O horário de término é inválido ou não pode ser 00:00.' });
      }

      if (startTime >= endTime) {
        return res.status(400).json({ success: false, message: 'O horário de término deve ser posterior ao horário de início.' });
      }

      // 3. Validação: Apenas letras e espaços no nome
      const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/;
      if (!nameRegex.test(name.trim())) {
        return res.status(400).json({ success: false, message: 'Nome inválido: utilize apenas letras e espaços.' });
      }

      // 4. Validação: Formato de Email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ success: false, message: 'Formato de email inválido.' });
      }

      // 5. Validação: Telefone apenas números e validação de DDD (10 ou 11 dígitos)
      const formattedPhone = phone.replace(/\D/g, ''); // Remove tudo o que não for número
      if (formattedPhone.length < 10 || formattedPhone.length > 11) {
        return res.status(400).json({ success: false, message: 'Telefone inválido: deve conter DDD e o número.' });
      }

      // 6. Validação de Duplicatas (Nome, Email e Telefone)
      const existingByName = await User.findByName(name.trim());
      if (existingByName) {
        return res.status(409).json({ success: false, message: 'Já existe um profissional registado com este nome exato.' });
      }

      const existingByEmail = await User.findByEmail(email.trim().toLowerCase());
      if (existingByEmail) {
        return res.status(409).json({ success: false, message: 'Este email já está registado no sistema.' });
      }

      const existingByPhone = await User.findByPhone(formattedPhone);
      if (existingByPhone) {
        return res.status(409).json({ success: false, message: 'Este telefone já está registado no sistema.' });
      }

      // 7. Se uma senha manual for informada, ela precisa seguir a mesma política das demais
      if (password && password.trim()) {
        const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{6,})/;
        if (!passwordRegex.test(password)) {
          return res.status(400).json({
            success: false,
            message: 'Senha deve ter no mínimo 6 caracteres, uma letra maiúscula e um caractere especial.'
          });
        }
      }

      // Criar senha temporária se não for enviada
      const randomPassword = password && password.trim() ? password : AdminController.generateTemporaryPassword();

      // 8. Salvar na Base de Dados
      const newBarber = await User.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: randomPassword,
        phone: formattedPhone,
        role: 'barber',
        availableDays: availableDays ? JSON.stringify(availableDays) : null,
        startTime: startTime || null,
        endTime: endTime || null,
        photoUrl: photoUrl || null // Aqui guardamos o Base64 da imagem
      });

      const responsePayload = {
        success: true,
        message: 'Barbeiro criado com sucesso!',
        barber: newBarber
      };

      if (!password || !password.trim()) responsePayload.generatedPassword = randomPassword;

      return res.status(201).json(responsePayload);
    } catch (error) {
      handleError(res, error, 'Erro ao criar barbeiro:', 'AdminController');
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
      const barbers = await BarberService.getAdminBarberList();

      return res.status(200).json({
        success: true,
        total: barbers.length,
        barbers
      });
    } catch (error) {
      handleError(res, error, 'Erro ao listar barbeiros:', 'AdminController');
    }
  }

  /**
   * Obter detalhes de um barbeiro específico
   * GET /api/admin/barbers/:id
   */
  static async getBarberById(req, res) {
    try {
      const { id } = req.params;
      const barberDetails = await BarberService.getBarberDetails(id);

      if (!barberDetails) {
        return res.status(404).json({
          success: false,
          message: 'Barbeiro não encontrado'
        });
      }

      return res.status(200).json({
        success: true,
        data: barberDetails
      });
    } catch (error) {
      handleError(res, error, 'Erro ao obter barbeiro:', 'AdminController');
    }
  }

  /**
   * Desativar barbeiro
   * PUT /api/admin/barbers/:id/deactivate
   */
  static async deactivateBarber(req, res) {
    try {
      const { id } = req.params;
      const { confirm } = req.body;

      if (confirm !== true && confirm !== 'true') {
        return res.status(400).json({
          success: false,
          message: 'Confirmação obrigatória para desativar o barbeiro'
        });
      }

      const barber = await BarberService.deactivateBarber(id);
      if (!barber) {
        return res.status(404).json({
          success: false,
          message: 'Barbeiro não encontrado'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Barbeiro desativado com sucesso',
        barber
      });
    } catch (error) {
      handleError(res, error, 'Erro ao desativar barbeiro:', 'AdminController');
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
      handleError(res, error, 'Erro ao excluir barbeiro:', 'AdminController');
    }
  }
}

module.exports = AdminController;