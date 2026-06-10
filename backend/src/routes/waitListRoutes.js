const express = require('express');
const router = express.Router();
const WaitlistController = require('../controllers/WaitlistController');
const { authenticate } = require('../middlewares/auth');

// ─── Client routes ────────────────────────────────────────────────────────────
router.post('/', authenticate, WaitlistController.join);
router.get('/my', authenticate, WaitlistController.getMyWaitlist);
router.get('/:id/position', authenticate, WaitlistController.getPosition);
router.put('/:id/accept', authenticate, WaitlistController.accept);
router.put('/:id/refuse', authenticate, WaitlistController.refuse);
router.put('/:id/cancel', authenticate, WaitlistController.cancel);

// ─── Barber management routes ─────────────────────────────────────────────────
// Rule 5: list all time slots with waiting clients for a date
router.get('/barber/:barberId/date/:date/slots', authenticate, WaitlistController.getWaitlistSlots);

// Rule 4: full ordered waitlist for a specific time slot
router.get('/barber/:barberId/date/:date/time/:time', authenticate, WaitlistController.getSlotWaitlist);

// Rules 3 & 6: save pending position changes (draft, not yet applied)
router.post('/barber/:barberId/date/:date/time/:time/reorder', authenticate, WaitlistController.setPendingPositions);

// Rule 7: confirm pending changes and apply them to the queue
router.post('/barber/:barberId/date/:date/time/:time/confirm-reorder', authenticate, WaitlistController.confirmReorder);

// Rule 7: discard pending changes without applying
router.delete('/barber/:barberId/date/:date/time/:time/pending', authenticate, WaitlistController.cancelPendingReorder);

module.exports = router;
