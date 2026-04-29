const express = require('express');
const router = express.Router();
const AppointmentController = require('../controllers/AppointmentController');

// Rotas para agendamentos
router.post('/', AppointmentController.create);
router.get('/', AppointmentController.findAll);
router.get('/my', AppointmentController.findMyAppointments);
router.get('/barber/:barberId', AppointmentController.findByBarber);
router.get('/date/:date', AppointmentController.findByDate);
router.get('/available-times/:barberId', AppointmentController.getAvailableTimes);
router.get('/:id', AppointmentController.findById);
router.put('/:id/status', AppointmentController.updateStatus);
router.put('/:id/cancel', AppointmentController.cancel);
router.delete('/:id', AppointmentController.delete);

module.exports = router;