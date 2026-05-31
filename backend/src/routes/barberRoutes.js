const express = require('express');
const router = express.Router();
const BarberController = require('../controllers/BarberController');

/**
 * Rotas do Barbeiro
 * Base: /api/barber
 */

/**
 * GET /api/barber/:id/dashboard
 * Retorna todos os dados consolidados do barbeiro
 * - Dados pessoais
 * - Agendamentos (hoje, próximos, estatísticas)
 * - Indisponibilidades ativas
 * - Serviços disponíveis
 */
router.get('/:id/dashboard', BarberController.dashboard);

/**
 * PUT /api/barber/:id/avatar
 * Atualizar avatar/foto do barbeiro
 * Body: { avatar: "data:image/png;base64,..." }
 */
router.put('/:id/avatar', BarberController.updateAvatar);

module.exports = router;
