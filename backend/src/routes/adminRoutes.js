const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/AdminController');
const { authenticate, requireAdmin } = require('../middlewares/auth');

/**
 * Rotas de Administração - Painel do Barbeiro Chefe
 * Todas as rotas requerem autenticação e autorização de administrador
 */

/**
 * Criar novo barbeiro
 */
router.post('/barbers',
  authenticate,
  requireAdmin,
  AdminController.createBarber
);

/**
 * Listar todos os barbeiros
 */
router.get('/barbers',
  authenticate,
  requireAdmin,
  AdminController.getBarbers
);

/**
 * Obter detalhes de um barbeiro específico
 * GET /api/admin/barbers/:id
 */
router.get('/barbers/:id',
  authenticate,
  requireAdmin,
  AdminController.getBarberById
);

/**
 * Excluir barbeiro
 * DELETE /api/admin/barbers/:id
 */
router.delete('/barbers/:id',
  authenticate,
  requireAdmin,
  AdminController.deleteBarber
);

module.exports = router;