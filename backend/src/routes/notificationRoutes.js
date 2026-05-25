const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/NotificationController');
const { authenticate } = require('../middlewares/auth');

router.get('/', authenticate, NotificationController.getByUser);
router.get('/unread', authenticate, NotificationController.getUnread);
router.put('/:id/read', authenticate, NotificationController.markAsRead);
router.delete('/:id', authenticate, NotificationController.delete);

module.exports = router;
