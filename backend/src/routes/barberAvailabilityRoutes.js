const express = require('express');
const router = express.Router();
const BarberAvailabilityController = require('../controllers/BarberAvailabilityController');
const { authenticate } = require('../middlewares/auth');

router.put('/:barberId', authenticate, BarberAvailabilityController.updateSchedule);
router.get('/:barberId', BarberAvailabilityController.getSchedule);

module.exports = router;
