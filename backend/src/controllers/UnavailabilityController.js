const Unavailability = require('../models/Unavailability');
const Notification = require('../models/Notification');
const Appointment = require('../models/Appointment');
const { handleError } = require('../utils/errorHandler');

class UnavailabilityController {
  static async create(req, res) {
    try {
      const { barberId, startDate, endDate, startTime, endTime, reason, action } = req.body;

      // autorização: apenas barbeiro dono da agenda ou admin
      if (!req.userId || !req.userRole) return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
      if (req.userRole !== 'admin' && req.userRole !== 'barber') return res.status(403).json({ success: false, message: 'Acesso negado' });
      if (req.userRole === 'barber' && String(req.userId) !== String(barberId)) {
        return res.status(403).json({ success: false, message: 'Barbeiro só pode gerenciar sua própria disponibilidade' });
      }

      if (!barberId || !startDate || !endDate || !action) {
        return res.status(400).json({
          success: false,
          message: 'barberId, startDate, endDate e action são obrigatórios'
        });
      }

      const validActions = ['auto_cancel', 'suggest_reschedule', 'maintenance_warning'];
      if (!validActions.includes(action)) {
        return res.status(400).json({
          success: false,
          message: 'Action deve ser: auto_cancel, suggest_reschedule ou maintenance_warning'
        });
      }

      const conflictingAppointments = await Unavailability.findConflictingAppointments(
        barberId,
        startDate,
        endDate,
        startTime,
        endTime
      );

      if (conflictingAppointments.length > 0) {
        await this.handleConflictingAppointments(barberId, conflictingAppointments, action);
      }

      const unavailability = await Unavailability.create({
        barberId,
        startDate,
        endDate,
        startTime,
        endTime,
        reason,
        action
      });

      res.status(201).json({
        success: true,
        data: unavailability,
        affectedAppointments: conflictingAppointments.length
      });
    } catch (error) {
      handleError(res, error, 'Erro ao criar indisponibilidade:', 'UnavailabilityController');
    }
  }

  static async handleConflictingAppointments(barberId, appointments, action) {
    for (const apt of appointments) {
      const dateStr = apt.date instanceof Date ? apt.date.toISOString().split('T')[0] : apt.date;
      const timeStr = typeof apt.time === 'string' ? apt.time.substring(0, 5) : apt.time;
      
      if (action === 'auto_cancel') {
        await Appointment.updateStatus(apt.id, 'cancelled');
        await Notification.create({
          userId: apt.user_id,
          barberId,
          type: 'appointment_cancelled',
          title: 'Seu agendamento foi cancelado',
          message: `Infelizmente, seu agendamento de ${apt.service_name} em ${dateStr} às ${timeStr} foi cancelado. Status do agendamento: cancelado. Entraremos em contato em breve para remarcação.`,
          relatedAppointmentId: apt.id
        });
      } else if (action === 'suggest_reschedule') {
        await Notification.create({
          userId: apt.user_id,
          barberId,
          type: 'reschedule_suggestion',
          title: 'Sugestão de remarcação',
          message: `Seu agendamento de ${apt.service_name} em ${dateStr} às ${timeStr} precisa ser remarcado. Status do agendamento: confirmado (aguardando sua ação). Acesse o app para escolher uma nova data ou contacte o barbeiro.`,
          relatedAppointmentId: apt.id
        });
      } else if (action === 'maintenance_warning') {
        await Notification.create({
          userId: apt.user_id,
          barberId,
          type: 'maintenance_notice',
          title: 'Aviso importante',
          message: `Seu agendamento de ${apt.service_name} em ${dateStr} às ${timeStr} está mantido. Status do agendamento: confirmado. O barbeiro em breve entrará em contato com você.`,
          relatedAppointmentId: apt.id
        });
      }
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const { startDate, endDate, startTime, endTime, reason, action } = req.body;

      const unavailability = await Unavailability.findById(id);
      if (!unavailability) {
        return res.status(404).json({
          success: false,
          message: 'Indisponibilidade não encontrada'
        });
      }

      // autorização: apenas barbeiro dono da agenda ou admin
      if (!req.userId || !req.userRole) return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
      if (req.userRole !== 'admin' && req.userRole !== 'barber') return res.status(403).json({ success: false, message: 'Acesso negado' });
      if (req.userRole === 'barber' && String(req.userId) !== String(unavailability.barber_id || unavailability.barberId)) {
        return res.status(403).json({ success: false, message: 'Barbeiro só pode alterar sua própria indisponibilidade' });
      }
      const updated = await Unavailability.update(id, {
        startDate,
        endDate,
        startTime,
        endTime,
        reason,
        action
      });

      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      handleError(res, error, 'Erro ao atualizar indisponibilidade:', 'UnavailabilityController');
    }
  }

  static async getByBarber(req, res) {
    try {
      const { barberId } = req.params;

      if (!barberId) {
        return res.status(400).json({
          success: false,
          message: 'barberId é obrigatório'
        });
      }

      // autorização: apenas barbeiro dono da agenda ou admin
      if (!req.userId || !req.userRole) return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
      if (req.userRole !== 'admin' && req.userRole !== 'barber') return res.status(403).json({ success: false, message: 'Acesso negado' });
      if (req.userRole === 'barber' && String(req.userId) !== String(barberId)) {
        return res.status(403).json({ success: false, message: 'Barbeiro só pode visualizar sua própria indisponibilidade' });
      }

      const unavailabilities = await Unavailability.findByBarberId(barberId);

      res.json({
        success: true,
        data: unavailabilities
      });
    } catch (error) {
      handleError(res, error, 'Erro ao listar indisponibilidades:', 'UnavailabilityController');
    }
  }

  static async checkConflicts(req, res) {
    try {
      const { barberId, startDate, endDate, startTime, endTime } = req.query;

      if (!barberId || !startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'barberId, startDate e endDate são obrigatórios'
        });
      }

      // autorização: apenas barbeiro dono ou admin
      if (!req.userId || !req.userRole) return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
      if (req.userRole !== 'admin' && req.userRole !== 'barber') return res.status(403).json({ success: false, message: 'Acesso negado' });
      if (req.userRole === 'barber' && String(req.userId) !== String(barberId)) {
        return res.status(403).json({ success: false, message: 'Barbeiro só pode verificar conflitos da própria agenda' });
      }

      const conflicts = await Unavailability.findConflictingAppointments(
        barberId,
        startDate,
        endDate,
        startTime,
        endTime
      );

      res.json({
        success: true,
        data: {
          hasConflicts: conflicts.length > 0,
          conflictCount: conflicts.length,
          appointments: conflicts
        }
      });
    } catch (error) {
      handleError(res, error, 'Erro ao verificar conflitos:', 'UnavailabilityController');
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;

      const deleted = await Unavailability.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Indisponibilidade não encontrada'
        });
      }

      res.json({
        success: true,
        message: 'Indisponibilidade removida'
      });
    } catch (error) {
      handleError(res, error, 'Erro ao deletar indisponibilidade:', 'UnavailabilityController');
    }
  }

  static async isUnavailable(req, res) {
    try {
      const { barberId, date, time } = req.query;

      if (!barberId || !date || !time) {
        return res.status(400).json({
          success: false,
          message: 'barberId, date e time são obrigatórios'
        });
      }

      const unavailabilities = await Unavailability.findActiveUnavailabilities(barberId, date, time);

      res.json({
        success: true,
        data: {
          isUnavailable: unavailabilities.length > 0,
          unavailabilities
        }
      });
    } catch (error) {
      handleError(res, error, 'Erro ao verificar disponibilidade:', 'UnavailabilityController');
    }
  }
}

module.exports = UnavailabilityController;
