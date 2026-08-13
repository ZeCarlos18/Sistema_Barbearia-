const express = require('express');
const router = express.Router();
const AppointmentController = require('../controllers/AppointmentController');
const { authenticate, requireAdmin } = require('../middlewares/auth');

// Criar agendamento: exige login; o userId é sempre o do usuário autenticado (ver controller)
router.post('/', authenticate, AppointmentController.create);
router.post('/manual', authenticate, AppointmentController.createManual);
// Listar TODOS os agendamentos do sistema: apenas admin (dados sensíveis de todos os clientes)
router.get('/', authenticate, requireAdmin, AppointmentController.findAll);
router.get('/my', authenticate, AppointmentController.findMyAppointments);
router.get('/my/past-future', authenticate, AppointmentController.findMyPastAndFutureAppointments);
router.get('/barber/:barberId', authenticate, AppointmentController.findByBarber);
router.get('/date/:date', authenticate, AppointmentController.findByDate);
router.get('/available-times/:barberId', AppointmentController.getAvailableTimes);
router.get('/manual/available-times/:barberId', authenticate, AppointmentController.getManualAvailableTimes);
router.get('/schedule/:barberId/date/:date', authenticate, AppointmentController.getBarberSchedule);
router.get('/schedule/:barberId/range', authenticate, AppointmentController.getBarberScheduleByDateRange);
router.get('/:id', authenticate, AppointmentController.findById);
router.put('/:id/status', authenticate, AppointmentController.updateStatus);
router.post('/:id/confirm', authenticate, AppointmentController.confirm);
router.put('/:id/cancel', authenticate, AppointmentController.cancel);
router.delete('/:id/history', authenticate, AppointmentController.deleteFromHistory);
// Exclusão definitiva do registro: apenas admin (o fluxo normal é cancelar, não apagar)
router.delete('/:id', authenticate, requireAdmin, AppointmentController.delete);

module.exports = router;