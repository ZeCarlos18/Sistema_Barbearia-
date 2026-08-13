const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const EmailService = require('../services/EmailService');
const jwt = require('jsonwebtoken');
const { handleError } = require('../utils/errorHandler');

// Validade do link enviado por e-mail (em minutos)
const RESET_TOKEN_EXPIRES_IN_MINUTES = Number(process.env.RESET_TOKEN_EXPIRES_MINUTES || 30);

// Intervalo mínimo entre dois pedidos de link do mesmo usuário (em segundos)
const RESET_REQUEST_COOLDOWN_SECONDS = 60;

// Resposta única do "esqueci minha senha": nunca revelamos se o e-mail existe,
// para que ninguém consiga descobrir quais e-mails estão cadastrados no sistema.
const GENERIC_RECOVERY_MESSAGE =
  'Se este e-mail estiver cadastrado, enviamos um link de recuperação. Verifique sua caixa de entrada e o spam.';

/**
 * Monta a URL do formulário de nova senha no frontend
 * @param {String} token - Token de recuperação em texto puro
 * @returns {String} URL completa
 */
function buildResetUrl(token) {
  const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
  return `${baseUrl}/reset-password?token=${token}`;
}

/**
 * AuthController - Controlador de autenticação
 * Gerencia as funções de registro, login e logout
 */
class AuthController {
  /**
   * Permitir que novos usuários cadastrem um e-mail no sistema
   */
static async register(req, res) {
    try {
      const { name, email, password, phone } = req.body;

      // 1. Validar campos obrigatórios (agora exigindo o telefone)
      if (!name || !email || !password || !phone) {
        return res.status(400).json({
          success: false,
          message: 'Nome, email, senha e telefone são obrigatórios'
        });
      }

      // 2. Tratar e validar formato do Telefone (DDD + Número)
      const formattedPhone = phone.replace(/\D/g, ''); // Remove tudo o que não for número
      if (formattedPhone.length < 10 || formattedPhone.length > 11) {
        return res.status(400).json({
          success: false,
          message: 'Telefone inválido: deve conter DDD e o número (10 a 11 dígitos).'
        });
      }

      // 3. Validar email único
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Este email já está registrado no sistema'
        });
      }

      // 4. Validar telefone único (Não permitir duplicatas)
      const existingPhone = await User.findByPhone(formattedPhone);
      if (existingPhone) {
        return res.status(409).json({
          success: false,
          message: 'Este telefone já está registrado no sistema'
        });
      }

      // 5. Criar novo usuário com o telefone formatado
      const newUser = await User.create({
        name,
        email,
        password,
        phone: formattedPhone
      });

      return res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email
        }
      });
    } catch (error) {
      console.error('Erro no registro:', error);
      
      if (error.message === 'EMAIL_ALREADY_EXISTS') {
        return res.status(409).json({
          success: false,
          message: 'Este email já está registrado no sistema'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erro ao cadastrar usuário',
        error: error.message
      });
    }
  }
  /**
   * Permitir que usuários cadastrados acessem o sistema com e-mail e senha
   */
  static async login(req, res) {
    try {
      const email = String(req.body.email || '').toLowerCase().trim();
      const { password } = req.body;

      // Validar campos obrigatórios
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email e senha são obrigatórios'
        });
      }

      // Buscar usuário por email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Email ou senha inválidos'
        });
      }

      // Verificar senha
      const isPasswordValid = await User.comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Email ou senha inválidos'
        });
      }

      // Gerar JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        process.env.JWT_SECRET,
        {
          expiresIn: '24h'
        }
      );

      // Resposta com token e dados do usuário
      return res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        redirectUrl: '/dashboard'
      });
    } catch (error) {
      handleError(res, error, 'Erro no login:', 'AuthController');
    }
  }

  /**
   * Permitir que o usuário encerre sua sessão de forma segura
   */
  static async logout(req, res) {
    try {
      // No JWT, o logout é feito no cliente removendo o token
      // No servidor apenas confirmamos a operação
      
      const userId = req.userId;
      const userEmail = req.userEmail;

      console.log(`Usuário ${userEmail} (ID: ${userId}) fez logout`);

      return res.status(200).json({
        success: true,
        message: 'Logout realizado com sucesso',
        instructions: {
          tokenRemoval: 'Token removido do localStorage/sessionStorage do cliente',
          sessionEnd: 'Sessão do usuário encerrada completamente',
          sensitiveDataCleared: 'Todas as informações sensíveis foram limpas',
          redirectUrl: '/login'
        }
      });
    } catch (error) {
      handleError(res, error, 'Erro no logout:', 'AuthController');
    }
  }

  /**
   * Obter informações do usuário autenticado
   * Rota protegida para validar se o usuário está logado
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
        user
      });
    } catch (error) {
      handleError(res ,error, 'Erro ao obter perfil:', 'AuthController');
    }
  }

  /**
   * Listar todos os usuários (para testes/admin)
   */
  static async getAllUsers(req, res) {
    try {
      const users = await User.getAll();
      return res.status(200).json({
        success: true,
        total: users.length,
        users
      });
    } catch (error) {
      handleError(res, error, 'Erro ao listar usuários:', 'AuthController');
    }
  }

  /**
   * Solicitar recuperação de senha: envia um link por e-mail
   * POST /api/auth/forgot-password
   *
   * A resposta é sempre a mesma (200 + mensagem genérica), exista o e-mail ou não.
   * Isso impede que alguém use esta rota para descobrir quem tem conta no sistema.
   */
  static async forgotPassword(req, res) {
    try {
      const normalizedEmail = String(req.body.email || '').toLowerCase().trim();

      if (!normalizedEmail) {
        return res.status(400).json({
          success: false,
          message: 'E-mail é obrigatório'
        });
      }

      const user = await User.findByEmail(normalizedEmail);

      // E-mail não cadastrado: responde igual ao caso de sucesso, sem enviar nada.
      if (!user) {
        return res.status(200).json({
          success: true,
          message: GENERIC_RECOVERY_MESSAGE
        });
      }

      // Evita disparo em massa de e-mails para o mesmo usuário.
      const recentRequests = await PasswordReset.countRecentRequests(
        user.id,
        RESET_REQUEST_COOLDOWN_SECONDS
      );

      if (recentRequests > 0) {
        console.warn(`[AuthController] Pedido de recuperação ignorado (cooldown) para o usuário ${user.id}`);
        return res.status(200).json({
          success: true,
          message: GENERIC_RECOVERY_MESSAGE
        });
      }

      const token = await PasswordReset.create(user.id, RESET_TOKEN_EXPIRES_IN_MINUTES);
      const resetUrl = buildResetUrl(token);

      try {
        await EmailService.sendPasswordResetEmail({
          to: user.email,
          name: user.name,
          resetUrl,
          expiresInMinutes: RESET_TOKEN_EXPIRES_IN_MINUTES
        });
      } catch (emailError) {
        // O e-mail falhou, mas não expomos isso ao cliente (evita enumeração de contas).
        console.error('[AuthController] Falha ao enviar e-mail de recuperação:', emailError);
      }

      return res.status(200).json({
        success: true,
        message: GENERIC_RECOVERY_MESSAGE
      });
    } catch (error) {
      handleError(res, error, 'Erro ao solicitar recuperação de senha:', 'AuthController');
    }
  }

  /**
   * Validar o token do link antes de mostrar o formulário de nova senha
   * GET /api/auth/reset-password/:token
   */
  static async validateResetToken(req, res) {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token de recuperação é obrigatório'
        });
      }

      const resetRequest = await PasswordReset.findValidByToken(token);

      if (!resetRequest) {
        return res.status(400).json({
          success: false,
          message: 'Link de recuperação inválido ou expirado. Solicite um novo.'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Link válido',
        email: resetRequest.email
      });
    } catch (error) {
      handleError(res, error, 'Erro ao validar token de recuperação:', 'AuthController');
    }
  }

  /**
   * Redefinir a senha usando o token recebido por e-mail
   * POST /api/auth/reset-password
   */
  static async resetPassword(req, res) {
    try {
      const { token, newPassword, confirmPassword } = req.body;

      if (!token || !newPassword || !confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Token, nova senha e confirmação são obrigatórios'
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'A confirmação de senha não corresponde à nova senha'
        });
      }

      const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{6,})/;
      if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
          success: false,
          message: 'Nova senha deve ter no mínimo 6 caracteres, uma letra maiúscula e um caractere especial'
        });
      }

      const resetRequest = await PasswordReset.findValidByToken(token);

      if (!resetRequest) {
        return res.status(400).json({
          success: false,
          message: 'Link de recuperação inválido ou expirado. Solicite um novo.'
        });
      }

      // Consome o token ANTES de trocar a senha: se duas requisições chegarem juntas,
      // apenas a primeira consegue marcar o token como usado.
      const consumed = await PasswordReset.markAsUsed(resetRequest.id);
      if (!consumed) {
        return res.status(400).json({
          success: false,
          message: 'Link de recuperação inválido ou expirado. Solicite um novo.'
        });
      }

      const updated = await User.updatePasswordByEmail(resetRequest.email, newPassword);
      if (!updated) {
        return res.status(500).json({
          success: false,
          message: 'Não foi possível atualizar a senha'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Senha alterada com sucesso',
        redirectUrl: '/login'
      });
    } catch (error) {
      handleError(res, error, 'Erro ao redefinir senha:', 'AuthController');
    }
  }
}

module.exports = AuthController;
