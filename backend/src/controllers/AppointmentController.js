const Appointment = require('../models/Appointment');
const Service = require('../models/Service');

// Função auxiliar para tratamento de erros padronizado
const handleError = (res, error, defaultMessage) => {
  console.error(`[AppointmentController] ${defaultMessage}:`, error);
  return res.status(500).json({
    success: false,
    message: defaultMessage,
    error: error.message
  });
};

class AppointmentController {
  /**
   * Criar novo agendamento
   */
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

  /**
   * Listar todos os agendamentos
   */
  static async findAll(req, res) {
    try {
      const appointments = await Appointment.findAll();
      res.json({ success: true, data: appointments });
    } catch (error) {
      handleError(res, error, 'Erro ao listar agendamentos');
    }
  }

  /**
   * Buscar agendamento por ID
   */
  static async findById(req, res) {
    try {
      const { id } = req.params;
      const appointment = await Appointment.findById(id);

      if (!appointment) return res.status(404).json({ success: false, message: 'Agendamento não encontrado' });

      res.json({ success: true, data: appointment });
    } catch (error) {
      handleError(res, error, 'Erro ao buscar agendamento');
    }
  }

  /**
   * Listar agendamentos do usuário logado
   */
  static async findMyAppointments(req, res) {
    try {
      const userId = req.userId;
      if (!userId) return res.status(401).json({ success: false, message: 'Usuário não autenticado' });

      const appointments = await Appointment.findByUserId(userId);
      res.json({ success: true, data: appointments });
    } catch (error) {
      handleError(res, error, 'Erro ao listar agendamentos do usuário');
    }
  }

  /**
   * Listar agendamentos passados e futuros do usuário logado
   */
  static async findMyPastAndFutureAppointments(req, res) {
    try {
      const userId = req.userId;
      if (!userId) return res.status(401).json({ success: false, message: 'Usuário não autenticado' });

      const appointments = await Appointment.findPastAndFutureByUserId(userId);
      res.json({ success: true, data: appointments });
    } catch (error) {
      handleError(res, error, 'Erro ao listar agendamentos (passados e futuros)');
    }
  }

  /**
   * Listar agendamentos por barbeiro
   */
  static async findByBarber(req, res) {
    try {
      const { barberId } = req.params;
      const appointments = await Appointment.findByBarberId(barberId);
      res.json({ success: true, data: appointments });
    } catch (error) {
      handleError(res, error, 'Erro ao listar agendamentos do barbeiro');
    }
  }

  /**
   * Buscar horários disponíveis para um barbeiro em uma data
   */
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
        return res.status(400).json({ success: false, message: 'BarberId e date são obrigatórios' });
      }

      const allTimes = [];
      for (let hour = 9; hour < 19; hour++) {
        allTimes.push(`${hour.toString().padStart(2, '0')}:00`);
        allTimes.push(`${hour.toString().padStart(2, '0')}:30`);
      }

      const occupiedTimes = await Appointment.getOccupiedTimes(barberId, date);
      const availableTimes = allTimes.filter(time => !occupiedTimes.includes(time));

      res.json({ success: true, data: { barberId, date, availableTimes, total: availableTimes.length } });
    } catch (error) {
      handleError(res, error, 'Erro ao buscar slots disponíveis');
    }
  }

  /**
   * Listar agendamentos por data
   */
  static async findByDate(req, res) {
    try {
      const appointments = await Appointment.findByDate(req.params.date);
      res.json({ success: true, data: appointments });
    } catch (error) {
      handleError(res, error, 'Erro ao listar agendamentos por data');
    }
  }

  /**
   * Atualizar status do agendamento
   */
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
   * Cancelar agendamento seguindo as Regras de Negócio
   */
  static async cancel(req, res) {
    try {
      const { id } = req.params;
      
      const appointment = await Appointment.findById(id);
      if (!appointment) return res.status(404).json({ success: false, message: 'Agendamento não encontrado' });

      if (appointment.status !== 'confirmed') {
        return res.status(409).json({ success: false, message: 'Apenas agendamentos confirmados podem ser cancelados.' });
      }

      let dateStr = appointment.date;
      if (appointment.date instanceof Date) {
        dateStr = appointment.date.toISOString().split('T')[0];
      }
      
      const appointmentDateTime = new Date(`${dateStr}T${appointment.time}`);
      const hoursUntilAppointment = (appointmentDateTime - new Date()) / (1000 * 60 * 60);

      if (hoursUntilAppointment < 24) {
        return res.status(409).json({ success: false, message: 'Não é possível cancelar com menos de 24 horas de antecedência.' });
      }

      const canceledAppointment = await Appointment.updateStatus(id, 'cancelled');

      // Emissão de evento / Log
      console.log(`\n🔔 [NOTIFICAÇÃO SISTEMA]\n   Para: Barbeiro ID ${appointment.barber_id} (${appointment.barber_name})\n   Mensagem: O cliente ${appointment.user_name || 'Cliente'} cancelou o serviço de ${appointment.service_name} marcado para o dia ${dateStr} às ${String(appointment.time).slice(0, 5)}.\n   Status do Horário: Liberado e disponível na tabela.\n`);

      res.json({ success: true, message: 'Agendamento cancelado com sucesso e horário liberado.', data: canceledAppointment });
    } catch (error) {
      handleError(res, error, 'Erro ao cancelar agendamento');
    }
  }

  /**
   * Deletar agendamento
   */
  static async delete(req, res) {
    try {
      const deleted = await Appointment.delete(req.params.id);
      if (!deleted) return res.status(404).json({ success: false, message: 'Agendamento não encontrado' });

      res.json({ success: true, message: 'Agendamento deletado com sucesso' });
    } catch (error) {
      handleError(res, error, 'Erro ao deletar agendamento');
    }
  }

  static async getBarberSchedule(req, res) {
    try {
      const { barberId } = req.params;
      let { date } = req.params;

      if (!barberId) return res.status(400).json({ success: false, message: 'ID do barbeiro é obrigatório' });

      if (!date) {
        date = new Date().toISOString().split('T')[0];
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ success: false, message: 'Data deve estar no formato YYYY-MM-DD' });
      }

      const appointments = await Appointment.findByBarberAndDate(barberId, date);

      res.json({
        success: true,
        data: {
          barberId,
          date,
          scheduledAppointments: appointments.length,
          appointments,
          message: appointments.length === 0 ? `Nenhum agendamento para ${date}` : undefined
        }
      });
    } catch (error) {
      handleError(res, error, 'Erro ao obter agenda do barbeiro');
    }
  }

  static async getBarberScheduleByDateRange(req, res) {
    try {
      const { barberId } = req.params;
      const { startDate, endDate } = req.query;

      if (!barberId) return res.status(400).json({ success: false, message: 'ID do barbeiro é obrigatório' });

      if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'startDate e endDate são obrigatórios (formato YYYY-MM-DD)' });
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        return res.status(400).json({ success: false, message: 'Datas devem estar no formato YYYY-MM-DD' });
      }

      if (new Date(startDate) > new Date(endDate)) {
        return res.status(400).json({ success: false, message: 'startDate deve ser menor ou igual a endDate' });
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
        data: {
          barberId,
          startDate,
          endDate,
          totalAppointments: appointments.length,
          appointmentsByDate,
          message: appointments.length === 0 ? `Nenhum agendamento entre ${startDate} e ${endDate}` : undefined
        }
      });
    } catch (error) {
      handleError(res, error, 'Erro ao obter agenda do barbeiro (intervalo)');
    }
  }
}

module.exports = AppointmentController;