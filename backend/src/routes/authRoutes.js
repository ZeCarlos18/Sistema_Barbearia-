const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const {
  authenticate,
  requireAdmin,
  validateRequiredFields,
  validateEmail,
  validatePassword
} = require('../middlewares/auth');

/**
 * Rota para Registro de Usuário (RF01)
 * POST /api/auth/register
 * 
 * Body esperado:
 * {
 *   "name": "João Silva",
 *   "email": "joao@example.com",
 *   "password": "senha123"
 * }
 */
router.post('/register', 
  validateRequiredFields(['name', 'email', 'password']),
  validateEmail,
  validatePassword,
  AuthController.register
);

/**
 * Rota para Login (RF02)
 * POST /api/auth/login
 * 
 * Body esperado:
 * {
 *   "email": "joao@example.com",
 *   "password": "senha123"
 * }
 * 
 * Response com sucesso:
 * {
 *   "success": true,
 *   "token": "JWT_TOKEN",
 *   "user": {...},
 *   "redirectUrl": "/dashboard"
 * }
 */
router.post('/login',
  validateRequiredFields(['email', 'password']),
  validateEmail,
  AuthController.login
);

/**
 * Rota para Logout (RF13)
 * POST /api/auth/logout
 * 
 * Headers requeridos:
 * Authorization: Bearer JWT_TOKEN
 * 
 * Regras de Negócio:
 * - Encerra completamente a sessão do usuário
 * - Remove o token de autenticação
 * - Redireciona para a tela de login
 * - Nenhuma informação sensível permanece em memória
 */
router.post('/logout',
  authenticate,
  AuthController.logout
);

/**
 * Rota para obter informações do usuário autenticado
 * GET /api/auth/profile
 * 
 * Headers requeridos:
 * Authorization: Bearer JWT_TOKEN
 */
router.get('/profile',
  authenticate,
  AuthController.getProfile
);

/**
 * Rota para listar todos os usuários (para testes)
 * GET /api/auth/users
 */
router.get('/users', authenticate, requireAdmin, AuthController.getAllUsers);

/**
 * Solicitar link de recuperação de senha por e-mail
 * POST /api/auth/forgot-password
 *
 * Body esperado:
 * {
 *   "email": "joao@example.com"
 * }
 *
 * Responde sempre 200 com mensagem genérica, mesmo que o e-mail não exista,
 * para não permitir descobrir quais e-mails estão cadastrados.
 */
router.post('/forgot-password',
  validateRequiredFields(['email']),
  validateEmail,
  AuthController.forgotPassword
);

/**
 * Validar o token do link antes de exibir o formulário de nova senha
 * GET /api/auth/reset-password/:token
 */
router.get('/reset-password/:token',
  AuthController.validateResetToken
);

/**
 * Redefinir a senha com o token recebido por e-mail
 * POST /api/auth/reset-password
 *
 * Body esperado:
 * {
 *   "token": "TOKEN_DO_LINK",
 *   "newPassword": "NovaSenha!1",
 *   "confirmPassword": "NovaSenha!1"
 * }
 */
router.post('/reset-password',
  validateRequiredFields(['token', 'newPassword', 'confirmPassword']),
  AuthController.resetPassword
);

module.exports = router;
