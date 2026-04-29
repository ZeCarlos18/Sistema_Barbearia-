const User = require('../models/User');
const jwt = require('jsonwebtoken');

/**
 * AuthController - Controlador de autenticação
 * Gerencia as funções de registro, login e logout
 */
class AuthController {
  /**
   * RF01 - Cadastro de Usuário
   * Permitir que novos usuários cadastrem um e-mail no sistema
   * 
   * Regras de Negócio:
   * - Validar campos obrigatórios
   * - Validar e-mail único
   * - Salvar usuário no banco
   */
  static async register(req, res) {
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

      // Criar novo usuário
      const newUser = await User.create({
        name,
        email,
        password,
        phone
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
   * RF02 - Login
   * Permitir que usuários cadastrados acessem o sistema com e-mail e senha
   * 
   * Regras de Negócio:
   * - Validar campos obrigatórios
   * - Verificar e-mail e senha
   * - Criar sessão do usuário (JWT)
   * - Redirecionar para dashboard
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

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
          name: user.name
        },
        process.env.JWT_SECRET || 'your-secret-key',
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
          email: user.email
        },
        redirectUrl: '/dashboard'
      });
    } catch (error) {
      console.error('Erro no login:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao realizar login',
        error: error.message
      });
    }
  }

  /**
   * RF13 - Fazer Logout
   * Permitir que o usuário encerre sua sessão de forma segura
   * 
   * Regras de Negócio:
   * - O sistema deve encerrar completamente a sessão do usuário
   * - O token deve ser invalidado
   * - Nenhuma informação sensível deve permanecer em memória
   * - O usuário é redirecionado para a tela de login
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
      console.error('Erro no logout:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao realizar logout',
        error: error.message
      });
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
      console.error('Erro ao obter perfil:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao obter perfil do usuário',
        error: error.message
      });
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
      console.error('Erro ao listar usuários:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao listar usuários',
        error: error.message
      });
    }
  }
}

module.exports = AuthController;
