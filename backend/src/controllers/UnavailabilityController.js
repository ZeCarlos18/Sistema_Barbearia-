const Unavailability = require('../models/Unavailability');
const Notification = require('../models/Notification');
const Appointment = require('../models/Appointment');

class UnavailabilityController {
  static async create(req, res) {
    try {
      const { barberId, startDate, endDate, startTime, endTime, reason, action } = req.body;

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
      console.error('Erro ao criar indisponibilidade:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao criar indisponibilidade',
        error: error.message
      });
    }
  }

  static async handleConflictingAppointments(barberId, appointments, action) {
    for (const apt of appointments) {
      if (action === 'auto_cancel') {
        await Appointment.updateStatus(apt.id, 'cancelled');
        await Notification.create({
          userId: apt.user_id,
          barberId,
          type: 'appointment_cancelled',
          title: 'Seu agendamento foi cancelado',
          message: `Infelizmente, seu agendamento de ${apt.service_name} em ${apt.date} às ${apt.time} foi cancelado. Entraremos em contato em breve para remarcação.`,
          relatedAppointmentId: apt.id,
          status: 'unread'
        });
      } else if (action === 'suggest_reschedule') {
        await Notification.create({
          userId: apt.user_id,
          barberId,
          type: 'reschedule_suggestion',
          title: 'Sugestão de remarcação',
          message: `Seu agendamento de ${apt.service_name} em ${apt.date} às ${apt.time} precisa ser remarcado. Acesse o app para escolher uma nova data.`,
          relatedAppointmentId: apt.id,
          status: 'unread'
        });
      } else if (action === 'maintenance_warning') {
        await Notification.create({
          userId: apt.user_id,
          barberId,
          type: 'maintenance_notice',
          title: 'Aviso importante',
          message: `Seu agendamento de ${apt.service_name} em ${apt.date} às ${apt.time} está mantido. O barbeiro em breve entrará em contato com você.`,
          relatedAppointmentId: apt.id,
          status: 'unread'
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
      console.error('Erro ao atualizar indisponibilidade:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar indisponibilidade',
        error: error.message
      });
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

      const unavailabilities = await Unavailability.findByBarberId(barberId);

      res.json({
        success: true,
        data: unavailabilities
      });
    } catch (error) {
      console.error('Erro ao listar indisponibilidades:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao listar indisponibilidades',
        error: error.message
      });
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
      console.error('Erro ao verificar conflitos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao verificar conflitos',
        error: error.message
      });
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
      console.error('Erro ao deletar indisponibilidade:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao deletar indisponibilidade',
        error: error.message
      });
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
      console.error('Erro ao verificar disponibilidade:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao verificar disponibilidade',
        error: error.message
      });
    }
  }
}

module.exports = UnavailabilityController;
