const express = require('express');
const router = express.Router();
const AppointmentController = require('../controllers/AppointmentController');
const { authenticate } = require('../middlewares/auth');

router.post('/', AppointmentController.create);
router.get('/', AppointmentController.findAll);
router.get('/my', authenticate, AppointmentController.findMyAppointments);
router.get('/my/past-future', authenticate, AppointmentController.findMyPastAndFutureAppointments);
router.get('/barber/:barberId', AppointmentController.findByBarber);
router.get('/date/:date', AppointmentController.findByDate);
router.get('/available-times/:barberId', AppointmentController.getAvailableTimes);
router.get('/available-slots/:barberId', AppointmentController.getAvailableSlots);
router.get('/schedule/:barberId/date/:date', AppointmentController.getBarberSchedule);
router.get('/schedule/:barberId/range', AppointmentController.getBarberScheduleByDateRange);
router.get('/:id', AppointmentController.findById);
router.put('/:id/status', AppointmentController.updateStatus);
router.put('/:id/cancel', AppointmentController.cancel);
router.delete('/:id', AppointmentController.delete);

module.exports = router;