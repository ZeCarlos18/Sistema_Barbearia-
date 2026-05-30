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

module.exports = router;
