const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { handleError } = require('../utils/errorHandler');

const RECOVERY_TOKEN_EXPIRES_IN = '15m';

function getRecoverySecret() {
  if (process.env.RECOVERY_JWT_SECRET) {
    return process.env.RECOVERY_JWT_SECRET;
  }

  if (process.env.JWT_SECRET) {
    console.warn('[AuthController] RECOVERY_JWT_SECRET não configurado. Usando JWT_SECRET como fallback temporário.');
    return process.env.JWT_SECRET;
  }

  return null;
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
   * Verifica se o e-mail existe para iniciar o fluxo de recuperação
   */
  static async checkRecoverEmail(req, res) {
    try {
      const normalizedEmail = String(req.body.email || '').toLowerCase().trim();

      if (!normalizedEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email é obrigatório'
        });
      }

      const user = await User.findByEmail(normalizedEmail);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'E-mail não encontrado no sistema'
        });
      }

      const recoverySecret = getRecoverySecret();
      if (!recoverySecret) {
        return res.status(500).json({
          success: false,
          message: 'RECOVERY_JWT_SECRET não configurado no ambiente'
        });
      }

      const recoveryToken = jwt.sign(
        {
          purpose: 'password_recovery',
          email: user.email,
          userId: user.id
        },
        recoverySecret,
        {
          expiresIn: RECOVERY_TOKEN_EXPIRES_IN
        }
      );

      return res.status(200).json({
        success: true,
        message: 'E-mail encontrado. Você já pode redefinir a senha.',
        recoveryToken,
        expiresIn: RECOVERY_TOKEN_EXPIRES_IN,
        redirectUrl: '/reset-password'
      });
    } catch (error) {
      handleError(res, error, 'Erro ao verificar e-mail de recuperação:', 'AuthController');
    }
  }

  /**
   * Redefine senha por e-mail no fluxo de recuperação
   */
  static async resetPasswordByEmail(req, res) {
    try {
      const normalizedEmail = String(req.body.email || '').toLowerCase().trim();
      const { recoveryToken } = req.body;
      const { newPassword, confirmPassword } = req.body;

      if (!recoveryToken || !newPassword || !confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Sessão de recuperação, nova senha e confirmação são obrigatórias'
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

      const recoverySecret = getRecoverySecret();
      if (!recoverySecret) {
        return res.status(500).json({
          success: false,
          message: 'RECOVERY_JWT_SECRET não configurado no ambiente'
        });
      }

      let decodedRecoveryToken;
      try {
        decodedRecoveryToken = jwt.verify(recoveryToken, recoverySecret);
      } catch (tokenError) {
        return res.status(401).json({
          success: false,
          message: 'Sessão de recuperação inválida ou expirada'
        });
      }

      if (decodedRecoveryToken?.purpose !== 'password_recovery' || !decodedRecoveryToken?.email) {
        return res.status(401).json({
          success: false,
          message: 'Sessão de recuperação inválida'
        });
      }

      const tokenEmail = String(decodedRecoveryToken.email).toLowerCase().trim();
      if (normalizedEmail && normalizedEmail !== tokenEmail) {
        return res.status(400).json({
          success: false,
          message: 'O e-mail informado não corresponde à sessão de recuperação'
        });
      }

      const user = await User.findByEmail(tokenEmail);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'E-mail não encontrado no sistema'
        });
      }

      const updated = await User.updatePasswordByEmail(tokenEmail, newPassword);
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
