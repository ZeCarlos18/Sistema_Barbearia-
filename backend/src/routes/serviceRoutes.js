const express = require('express');
const router = express.Router();
const ServiceController = require('../controllers/ServiceController');

// Rotas para serviços
router.post('/', ServiceController.create);
router.get('/', ServiceController.findAll);
router.get('/:id', ServiceController.findById);
router.put('/:id', ServiceController.update);
router.delete('/:id', ServiceController.delete);

module.exports = router;