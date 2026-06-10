const ReminderSetting = require('../models/ReminderSetting');
const { handleError } = require('../utils/errorHandler');

class ReminderSettingController {
  static async get(req, res) {
    try {
      const settings = await ReminderSetting.find();
      if (!settings) {
        const defaultSettings = await ReminderSetting.createDefault();
        return res.json({ success: true, data: defaultSettings });
      }
      res.json({ success: true, data: settings });
    } catch (error) {
      handleError(res, error, 'Erro ao buscar configurações de lembrete:', 'ReminderSettingController');
    }
  }

  static async update(req, res) {
    try {
      const { leadTimeMinutes, channel } = req.body;
      const parsedLeadTime = Number(leadTimeMinutes);

      if (!Number.isInteger(parsedLeadTime) || parsedLeadTime <= 0) {
        return res.status(400).json({ success: false, message: 'leadTimeMinutes deve ser um número inteiro maior que zero' });
      }

      if (!['email', 'push'].includes(channel)) {
        return res.status(400).json({ success: false, message: 'channel deve ser "email" ou "push"' });
      }

      const updated = await ReminderSetting.update({ lead_time_minutes: parsedLeadTime, channel });
      res.json({ success: true, data: updated });
    } catch (error) {
      handleError(res, error, 'Erro ao atualizar configurações de lembrete:', 'ReminderSettingController');
    }
  }
}

module.exports = ReminderSettingController;
