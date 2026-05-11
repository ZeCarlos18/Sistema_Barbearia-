const User = require('../models/User');

/**
 * UserController - Controlador de usuários
 * Gerencia as funções de perfil do usuário
 */
class UserController {
  /**
   * Atualizar perfil do usuário
   */
  static async updateProfile(req, res) {
    try {
      const userId = req.userId;
      const { name, email, phone, oldPassword, newPassword } = req.body;

      // Buscar usuário atual com senha
      const currentUser = await User.findByIdWithPassword(userId);
      if (!currentUser) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      // Preparar dados para atualização
      const updateData = {};

      if (name !== undefined) {
        if (!name.trim()) {
          return res.status(400).json({
            success: false,
            message: 'Nome não pode estar vazio'
          });
        }
        updateData.name = name.trim();
      }

      if (email !== undefined) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            success: false,
            message: 'Formato de email inválido'
          });
        }
        updateData.email = email.toLowerCase().trim();
      }

      if (phone !== undefined) {
        // Validar formato de telefone (exemplo: apenas números, 10-11 dígitos)
        const phoneRegex = /^\d{10,11}$/;
        if (phone && !phoneRegex.test(phone.replace(/\D/g, ''))) {
          return res.status(400).json({
            success: false,
            message: 'Formato de telefone inválido (deve conter 10-11 dígitos)'
          });
        }
        updateData.phone = phone ? phone.replace(/\D/g, '') : null;
      }

      // Se está tentando alterar senha
      if (newPassword) {
        // Verificar se forneceu senha antiga
        if (!oldPassword) {
          return res.status(400).json({
            success: false,
            message: 'Senha antiga é obrigatória para alterar a senha'
          });
        }

        // Verificar senha antiga
        const isOldPasswordValid = await User.comparePassword(oldPassword, currentUser.password);
        if (!isOldPasswordValid) {
          return res.status(400).json({
            success: false,
            message: 'Senha antiga incorreta'
          });
        }

        // Validar nova senha
        const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{6,})/;
        if (!passwordRegex.test(newPassword)) {
          return res.status(400).json({
            success: false,
            message: 'Nova senha deve ter no mínimo 6 caracteres, uma letra maiúscula e um caractere especial'
          });
        }

        updateData.password = newPassword;
      }

      // Verificar se há pelo menos um campo para atualizar
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Nenhum campo para atualizar'
        });
      }

      // Atualizar usuário
      const updatedUser = await User.update(userId, updateData);

      return res.status(200).json({
        success: true,
        message: 'Perfil atualizado com sucesso',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          updatedAt: updatedUser.updated_at
        }
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);

      if (error.message === 'USER_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      if (error.message === 'EMAIL_ALREADY_EXISTS') {
        return res.status(409).json({
          success: false,
          message: 'Este email já está sendo usado por outro usuário'
        });
      }

      if (error.message === 'PHONE_ALREADY_EXISTS') {
        return res.status(409).json({
          success: false,
          message: 'Este telefone já está sendo usado por outro usuário'
        });
      }

      if (error.message === 'NO_FIELDS_TO_UPDATE') {
        return res.status(400).json({
          success: false,
          message: 'Nenhum campo válido para atualizar'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar perfil',
        error: error.message
      });
    }
  }

  /**
   * Obter perfil do usuário autenticado
   * GET /api/users/profile
   */
  static async getProfile(req, res) {
    try {
      const userId = req.userId;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          createdAt: user.created_at
        }
      });
    } catch (error) {
      console.error('Erro ao obter perfil:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao obter perfil do usuário',
        error: error.message
      });
    }
  }
}

module.exports = UserController;