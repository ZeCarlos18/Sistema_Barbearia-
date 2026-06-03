const Notification = require('../models/Notification');
const { handleError } = require('../utils/errorHandler');

class NotificationController {
  static async getByUser(req, res) {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const notifications = await Notification.findByUserId(userId);

      res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      console.error('Erro ao buscar notificações:', 'NotificationController');
    }
  }

  static async getUnread(req, res) {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const notifications = await Notification.findUnread(userId);

      res.json({
        success: true,
        unreadCount: notifications.length,
        data: notifications
      });
    } catch (error) {
      handleError(res, error, 'Erro ao buscar notificações não lidas:', 'NotificationController');
    }
  }

  static async markAsRead(req, res) {
    try {
      const { id } = req.params;

      await Notification.markAsRead(id);

      res.json({
        success: true,
        message: 'Notificação marcada como lida'
      });
    } catch (error) {
      handleError(res, error, 'Erro ao marcar notificação como lida:', 'NotificationController');
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;

      const deleted = await Notification.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Notificação não encontrada'
        });
      }

      res.json({
        success: true,
        message: 'Notificação removida'
      });
    } catch (error) {
      handleError(res, error, 'Erro ao deletar notificação:', 'NotificationController');
    }
  }
}

module.exports = NotificationController;