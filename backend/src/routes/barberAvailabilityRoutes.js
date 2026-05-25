const express = require('express');
const router = express.Router();
const BarberAvailabilityController = require('../controllers/BarberAvailabilityController');

router.put('/:barberId', BarberAvailabilityController.updateSchedule);
router.get('/:barberId', BarberAvailabilityController.getSchedule);

module.exports = router;
