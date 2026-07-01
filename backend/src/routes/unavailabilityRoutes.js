const express = require('express');
const router = express.Router();
const UnavailabilityController = require('../controllers/UnavailabilityController');
const { authenticate } = require('../middlewares/auth');

router.post('/', authenticate, UnavailabilityController.create);
router.get('/barber/:barberId', authenticate, UnavailabilityController.getByBarber);
router.get('/check/conflicts', authenticate, UnavailabilityController.checkConflicts);
router.get('/check/availability', authenticate, UnavailabilityController.isUnavailable);
router.put('/:id', authenticate, UnavailabilityController.update);
router.delete('/:id', authenticate, UnavailabilityController.delete);

module.exports = router;
