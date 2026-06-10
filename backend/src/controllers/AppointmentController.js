const Appointment = require('../models/Appointment');
const Service = require('../models/Service');
const Waitlist = require('../models/Waitlist');
const Notification = require('../models/Notification');
const { handleError } = require('../utils/errorHandler')

// Função auxiliar para gerar a grade de horários da barbearia
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 9; hour < 19; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  return slots;
};

class AppointmentController {
/**
   * Criar novo agendamento
   */
  static async create(req, res) {
    try {
      const { userId, barberId, serviceId, date, time } = req.body;

      if (!userId || !barberId || !serviceId || !date || !time) {
        return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios' });
      }

      const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
      const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

      if (!dateRegex.test(date) || !timeRegex.test(time)) {
        return res.status(400).json({ success: false, message: 'Data ou horário inválidos' });
      }

      const service = await Service.findById(serviceId);
      if (!service) return res.status(404).json({ success: false, message: 'Serviço não encontrado' });

      // NOVA REGRA: Permite múltiplos agendamentos, mas bloqueia se for no MESMO horário exato
      const userAppointmentsOnDate = await Appointment.findByUserAndDate(userId, date);
      const hasConflict = userAppointmentsOnDate.some(
        (apt) => apt.time.startsWith(time) && apt.status !== 'cancelled'
      );
      
      if (hasConflict) {
        return res.status(409).json({ success: false, message: 'Você já tem um agendamento marcado para este mesmo horário.' });
      }

      // Validação de data no passado
      const [year, month, day] = date.split('-').map(Number);
      const [hour, minute] = time.split(':').map(Number);
      const appointmentDateTime = new Date(year, month - 1, day, hour, minute, 0, 0);
      
      if (appointmentDateTime <= new Date()) {
        return res.status(400).json({ success: false, message: 'Não é possível agendar num horário passado.' });
      }

      // Validação se o barbeiro está livre
      const occupiedTimes = await Appointment.getOccupiedTimes(barberId, date);
      if (occupiedTimes.includes(time)) {
        return res.status(409).json({ success: false, message: 'Horário já está ocupado.' });
      }

      // Cria o agendamento
      const appointment = await Appointment.create({ userId, barberId, serviceId, date, time });
      res.status(201).json({ success: true, data: appointment });
    } catch (error) {
      handleError(res, error, 'Erro ao criar agendamento', 'AppointmentController');
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

  static async findMyPastAndFutureAppointments(req, res) {
    try {
      if (!req.userId) return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
      const appointments = await Appointment.findPastAndFutureByUserId(req.userId);
      res.json({ success: true, data: appointments });
    } catch (error) {
      handleError(res, error, 'Erro ao listar agendamentos (passados e futuros)');
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

      const allTimes = generateTimeSlots();
      const occupiedTimes = await Appointment.getOccupiedTimes(barberId, date);
      const availableTimes = allTimes.filter(time => !occupiedTimes.includes(time));

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
        return res.status(400).json({ success: false, message: 'Status inválido.' });
      }

      const appointment = await Appointment.updateStatus(id, status);
      if (!appointment) return res.status(404).json({ success: false, message: 'Agendamento não encontrado' });

      res.json({ success: true, data: appointment });
    } catch (error) {
      handleError(res, error, 'Erro ao atualizar status');
    }
  }

  static async cancel(req, res) {
    try {
      const { id } = req.params;
      const appointment = await Appointment.findById(id);
      if (!appointment) return res.status(404).json({ success: false, message: 'Agendamento não encontrado' });

      if (appointment.status !== 'confirmed' && appointment.status !== 'pending') {
        return res.status(409).json({ success: false, message: 'Este agendamento não pode ser cancelado.' });
      }

      let dateStr = appointment.date;
      if (appointment.date instanceof Date) {
        dateStr = appointment.date.toISOString().split('T')[0];
      }
      
      const appointmentDateTime = new Date(`${dateStr}T${appointment.time}`);
      const hoursUntilAppointment = (appointmentDateTime - new Date()) / (1000 * 60 * 60);

      // Verifica se o agendamento já passou (horas negativas ou zero)
      if (hoursUntilAppointment <= 0) {
        return res.status(400).json({ success: false, message: 'Este agendamento já passou e não pode ser cancelado.' });
      }

      // Verifica as 24 horas de antecedência
      if (hoursUntilAppointment < 24) {
        return res.status(409).json({ success: false, message: 'Não é possível cancelar com menos de 24 horas de antecedência.' });
      }

      const canceledAppointment = await Appointment.updateStatus(id, 'cancelled');

      // Notificar o próximo na fila de espera para este slot
      const appointmentTime = typeof appointment.time === 'string'
        ? appointment.time.substring(0, 5)
        : `${String(appointment.time.getHours()).padStart(2, '0')}:${String(appointment.time.getMinutes()).padStart(2, '0')}`;

      const nextInQueue = await Waitlist.getFirstWaiting(appointment.barber_id, dateStr, appointmentTime);
      if (nextInQueue) {
        const timeoutMinutes = parseInt(process.env.WAITLIST_TIMEOUT_MINUTES) || 15;
        await Waitlist.notifyEntry(nextInQueue.id);
        await Notification.create({
          userId: nextInQueue.user_id,
          barberId: appointment.barber_id,
          type: 'waitlist_notified',
          channel: 'push',
          title: 'Sua vez na fila de espera!',
          message: `Uma vaga abriu para as ${appointmentTime} do dia ${dateStr}. Você tem ${timeoutMinutes} minutos para confirmar ou recusar.`,
          relatedAppointmentId: null,
          status: 'unread'
        });
      }

      res.json({ success: true, message: 'Agendamento cancelado com sucesso.', data: canceledAppointment });
    } catch (error) {
      handleError(res, error, 'Erro ao cancelar agendamento');
    }
  }

  static async delete(req, res) {
    try {
      const deleted = await Appointment.delete(req.params.id);
      if (!deleted) return res.status(404).json({ success: false, message: 'Agendamento não encontrado' });
      res.json({ success: true, message: 'Agendamento deletado' });
    } catch (error) {
      handleError(res, error, 'Erro ao deletar agendamento');
    }
  }

  static async getBarberSchedule(req, res) {
    try {
      const { barberId } = req.params;
      let { date } = req.params;

      if (!barberId) return res.status(400).json({ success: false, message: 'ID do barbeiro é obrigatório' });
      if (!date) date = new Date().toISOString().split('T')[0];

      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ success: false, message: 'Data inválida' });
      }

      const appointments = await Appointment.findByBarberAndDate(barberId, date);
      res.json({
        success: true,
        data: { barberId, date, scheduledAppointments: appointments.length, appointments }
      });
    } catch (error) {
      handleError(res, error, 'Erro ao obter agenda do barbeiro');
    }
  }

  static async getBarberScheduleByDateRange(req, res) {
    try {
      const { barberId } = req.params;
      const { startDate, endDate } = req.query;

      if (!barberId || !startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'Faltam parâmetros' });
      }

      if (new Date(startDate) > new Date(endDate)) {
        return res.status(400).json({ success: false, message: 'startDate maior que endDate' });
      }

      const appointments = await Appointment.findByBarberDateRange(barberId, startDate, endDate);
      const appointmentsByDate = {};
      
      appointments.forEach(apt => {
        const dateStr = apt.date instanceof Date ? apt.date.toISOString().split('T')[0] : apt.date;
        if (!appointmentsByDate[dateStr]) appointmentsByDate[dateStr] = [];
        appointmentsByDate[dateStr].push(apt);
      });

      res.json({
        success: true,
        data: { barberId, startDate, endDate, totalAppointments: appointments.length, appointmentsByDate }
      });
    } catch (error) {
      handleError(res, error, 'Erro ao obter agenda (intervalo)');
    }
  }
}

module.exports = AppointmentController;