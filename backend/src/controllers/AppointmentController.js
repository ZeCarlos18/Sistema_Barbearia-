const Appointment = require('../models/Appointment');
const Service = require('../models/Service');

// Função auxiliar para evitar repetição nos blocos catch
const handleError = (res, error, defaultMessage) => {
  console.error(`[AppointmentController] ${defaultMessage}:`, error);
  return res.status(500).json({
    success: false,
    message: defaultMessage,
    error: error.message
  });
};

class AppointmentController {
  static async create(req, res) {
    try {
      const { userId, barberId, serviceId, date, time } = req.body;

      if (!userId || !barberId || !serviceId || !date || !time) {
        return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios: userId, barberId, serviceId, date, time' });
      }

      const service = await Service.findById(serviceId);
      if (!service) return res.status(404).json({ success: false, message: 'Serviço não encontrado' });

      const activeAppointments = await Appointment.findActiveByUserId(userId);
      if (activeAppointments.length > 0) {
        return res.status(409).json({ success: false, message: 'Você já possui um agendamento ativo. Cancele o agendamento anterior antes de fazer um novo.' });
      }

      const occupiedTimes = await Appointment.getOccupiedTimes(barberId, date);
      if (occupiedTimes.includes(time)) {
        return res.status(409).json({ success: false, message: 'Horário já está ocupado para este barbeiro nesta data' });
      }

      const appointment = await Appointment.create({ userId, barberId, serviceId, date, time });
      res.status(201).json({ success: true, data: appointment });
    } catch (error) {
      handleError(res, error, 'Erro ao criar agendamento');
    }
  }

  static async findAll(req, res) {
    try {
      const appointments = await Appointment.findAll();
      res.json({ success: true, data: appointments });
    } catch (error) {
      handleError(res, error, 'Erro ao listar agendamentos');
    }
  }

  static async findById(req, res) {
    try {
      const appointment = await Appointment.findById(req.params.id);
      if (!appointment) return res.status(404).json({ success: false, message: 'Agendamento não encontrado' });
      
      res.json({ success: true, data: appointment });
    } catch (error) {
      handleError(res, error, 'Erro ao buscar agendamento');
    }
  }

  static async findMyAppointments(req, res) {
    try {
      if (!req.userId) return res.status(401).json({ success: false, message: 'Usuário não autenticado' });

      const appointments = await Appointment.findByUserId(req.userId);
      res.json({ success: true, data: appointments });
    } catch (error) {
      handleError(res, error, 'Erro ao listar agendamentos do usuário');
    }
  }

  static async findByBarber(req, res) {
    try {
      const appointments = await Appointment.findByBarberId(req.params.barberId);
      res.json({ success: true, data: appointments });
    } catch (error) {
      handleError(res, error, 'Erro ao listar agendamentos do barbeiro');
    }
  }

  static async getAvailableTimes(req, res) {
    try {
      const { barberId } = req.params;
      const { date } = req.query;

      if (!barberId || !date) {
        return res.status(400).json({ success: false, message: 'BarberId e date são obrigatórios' });
      }

      const allTimes = [];
      for (let hour = 9; hour < 19; hour++) {
        allTimes.push(`${hour.toString().padStart(2, '0')}:00`);
        allTimes.push(`${hour.toString().padStart(2, '0')}:30`);
      }

      const occupiedTimes = await Appointment.getOccupiedTimes(barberId, date);
      const availableTimes = allTimes.filter(time => !occupiedTimes.includes(time));

      res.json({ success: true, data: { barberId, date, availableTimes, occupiedTimes } });
    } catch (error) {
      handleError(res, error, 'Erro ao buscar horários disponíveis');
    }
  }

  static async getAvailableSlots(req, res) {
    try {
      const { barberId } = req.params;
      const { date } = req.query;

      if (!barberId || !date) {
        return res.status(400).json({
          success: false,
          message: 'BarberId e date são obrigatórios'
        });
      }

      const availableTimes = await AvailabilityService.getAvailableSlots(barberId, date);

      res.json({ success: true, data: { barberId, date, availableTimes, occupiedTimes } });
    } catch (error) {
      handleError(res, error, 'Erro ao buscar horários disponíveis');
    }
  }

  static async findByDate(req, res) {
    try {
      const appointments = await Appointment.findByDate(req.params.date);
      res.json({ success: true, data: appointments });
    } catch (error) {
      handleError(res, error, 'Erro ao listar agendamentos por data');
    }
  }

  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Status inválido. Use: pending, confirmed, completed, cancelled' });
      }

      const appointment = await Appointment.updateStatus(id, status);
      if (!appointment) return res.status(404).json({ success: false, message: 'Agendamento não encontrado' });

      res.json({ success: true, data: appointment });
    } catch (error) {
      handleError(res, error, 'Erro ao atualizar status');
    }
  }

  /**
   * Cancelamento (RF10):
   * Requer status 'confirmed' e antecedência mínima de 24h.
   */
  static async cancel(req, res) {
    try {
      const { id } = req.params;
      const appointment = await Appointment.findById(id);
      
      if (!appointment) return res.status(404).json({ success: false, message: 'Agendamento não encontrado' });
      if (appointment.status !== 'confirmed') {
        return res.status(409).json({ success: false, message: 'Apenas agendamentos confirmados podem ser cancelados.' });
      }

      const dateStr = appointment.date instanceof Date ? appointment.date.toISOString().split('T')[0] : appointment.date;
      const appointmentDateTime = new Date(`${dateStr}T${appointment.time}`);
      const hoursUntilAppointment = (appointmentDateTime - new Date()) / (1000 * 60 * 60);

      if (hoursUntilAppointment < 24) {
        return res.status(409).json({ success: false, message: 'Não é possível cancelar com menos de 24 horas de antecedência.' });
      }

      const canceledAppointment = await Appointment.updateStatus(id, 'cancelled');

      // Hook de notificação
      console.log(`\n🔔 [NOTIFICAÇÃO SISTEMA]\n   Para: Barbeiro ID ${appointment.barber_id} (${appointment.barber_name})\n   Mensagem: O cliente ${appointment.user_name || 'Cliente'} cancelou o serviço marcado para o dia ${dateStr} às ${String(appointment.time).slice(0, 5)}.\n`);

      res.json({ success: true, message: 'Agendamento cancelado com sucesso.', data: canceledAppointment });
    } catch (error) {
      handleError(res, error, 'Erro ao cancelar agendamento');
    }
  }

  /**
   * Confirmação (RF08):
   * Requer status 'pending', disponibilidade do horário e do cliente.
   */
  static async confirm(req, res) {
    try {
      const { id } = req.params;
      const appointment = await Appointment.findById(id);
      
      if (!appointment) return res.status(404).json({ success: false, message: 'Agendamento não encontrado' });
      if (appointment.status !== 'pending') {
        return res.status(409).json({ success: false, message: `Agendamento não pode ser confirmado. Status atual: ${appointment.status}` });
      }

      const occupiedTimes = await Appointment.getOccupiedTimes(appointment.barber_id, appointment.date);
      if (occupiedTimes.includes(appointment.time)) {
        return res.status(409).json({ success: false, message: 'Horário já não está mais disponível para este barbeiro' });
      }

      const userAppointmentsOnDate = await Appointment.findByUserAndDate(appointment.user_id, appointment.date);
      const conflictingAppointment = userAppointmentsOnDate.find(
        (apt) => apt.time === appointment.time && Number(apt.id) !== Number(id) && apt.status !== 'cancelled'
      );
      
      if (conflictingAppointment) {
        return res.status(409).json({ success: false, message: 'Cliente já possui outro agendamento neste horário' });
      }

      const confirmedAppointment = await Appointment.updateStatus(id, 'confirmed');
      res.json({ success: true, message: 'Agendamento confirmado com sucesso', data: confirmedAppointment });
    } catch (error) {
      handleError(res, error, 'Erro ao confirmar agendamento');
    }
  }

  static async delete(req, res) {
    try {
      const deleted = await Appointment.delete(req.params.id);
      if (!deleted) return res.status(404).json({ success: false, message: 'Agendamento não encontrado' });

      res.json({ success: true, message: 'Agendamento deletado com sucesso' });
    } catch (error) {
      handleError(res, error, 'Erro ao deletar agendamento');
    }
  }
}

module.exports = AppointmentController;