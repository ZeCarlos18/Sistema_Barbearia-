const express = require('express');
const router = express.Router();
const ServiceController = require('../controllers/ServiceController');
const { authenticate, requireAdmin } = require('../middlewares/auth');

// Consulta de serviços: pública (necessária para a tela de agendamento)
router.get('/', ServiceController.findAll);
router.get('/:id', ServiceController.findById);

// Gestão de serviços (nome, preço, duração): apenas admin
router.post('/', authenticate, requireAdmin, ServiceController.create);
router.put('/:id', authenticate, requireAdmin, ServiceController.update);
router.delete('/:id', authenticate, requireAdmin, ServiceController.delete);

module.exports = router;