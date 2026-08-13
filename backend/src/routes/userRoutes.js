const express = require('express');
const router = express.Router();
const User = require('../models/User');
const UserController = require('../controllers/UserController');
const { authenticate, requireAdmin } = require('../middlewares/auth');

// Buscar todos os barbeiros (requer login; usado na tela de agendamento)
router.get('/barbers', authenticate, async (req, res) => {
  try {
    const barbers = await User.findByRole('barber');
    
    res.json({
      success: true,
      data: barbers
    });
  } catch (error) {
    console.error('Erro ao buscar barbeiros:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar barbeiros',
      error: error.message
    });
  }
});

/**
 * Rota para obter perfil do usuário autenticado
 */
router.get('/profile',
  authenticate,
  UserController.getProfile
);

/**
 * Rota para atualizar perfil do usuário
 *
 * Headers requeridos:
 * Authorization: Bearer JWT_TOKEN
 *
 * Body esperado (campos opcionais):
 * {
 *   "name": "Novo Nome",
 *   "email": "novoemail@example.com",
 *   "phone": "11999999999",
 *   "oldPassword": "senhaAntiga", // obrigatório se newPassword fornecido
 *   "newPassword": "NovaSenha123!"
 * }
 */
router.put('/profile',
  authenticate,
  UserController.updateProfile
);

// Buscar usuário por ID (dados de outra pessoa: restrito a administradores)
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar usuário',
      error: error.message
    });
  }
});

module.exports = router;