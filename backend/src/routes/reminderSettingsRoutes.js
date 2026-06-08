const express = require('express');
const router = express.Router();
const ReminderSettingController = require('../controllers/ReminderSettingController');
const { authenticate } = require('../middlewares/auth');

router.get('/', authenticate, ReminderSettingController.get);
router.put('/', authenticate, ReminderSettingController.update);

module.exports = router;
