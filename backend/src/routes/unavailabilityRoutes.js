const express = require('express');
const router = express.Router();
const UnavailabilityController = require('../controllers/UnavailabilityController');

router.post('/', UnavailabilityController.create);
router.get('/barber/:barberId', UnavailabilityController.getByBarber);
router.get('/check/conflicts', UnavailabilityController.checkConflicts);
router.get('/check/availability', UnavailabilityController.isUnavailable);
router.put('/:id', UnavailabilityController.update);
router.delete('/:id', UnavailabilityController.delete);

module.exports = router;
