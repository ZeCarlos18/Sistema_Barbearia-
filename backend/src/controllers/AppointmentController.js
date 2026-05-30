const Appointment = require('../models/Appointment');
const Service = require('../models/Service');
const Unavailability = require('../models/Unavailability');
const AvailabilityService = require('../services/AvailabilityService');

class AppointmentController {
  /**
   * Criar novo agendamento
   * Permite múltiplos agendamentos por cliente, mas valida:
   * - Horários duplicados para o mesmo barbeiro
   * - Horários conflitantes considerando duração do serviço
   * - Indisponibilidades do barbeiro
   */
  static async create(req, res) {
    try {
      const { userId, barberId, serviceId, date, time } = req.body;

      if (!userId || !barberId || !serviceId || !date || !time) {
        return res.status(400).json({
          success: false,
          message: 'Todos os campos são obrigatórios: userId, barberId, serviceId, date, time'
        });
      }

      // Verificar se o serviço existe
      const service = await Service.findById(serviceId);
      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Serviço não encontrado'
        });
      }

      // Verificar se o horário já está ocupado para o barbeiro
      const occupiedTimes = await Appointment.getOccupiedTimes(barberId, date);
      if (occupiedTimes.includes(time)) {
        return res.status(409).json({
          success: false,
          message: 'Horário duplicado: Este horário já está ocupado para este barbeiro nesta data'
        });
      }

      // Verificar indisponibilidades do barbeiro
      const unavailabilities = await Unavailability.findActiveUnavailabilities(barberId, date, time);
      if (unavailabilities.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Horário conflitante: Este horário está indisponível para este barbeiro no momento'
        });
      }

      const appointment = await Appointment.create({ userId, barberId, serviceId, date, time });

      res.status(201).json({
        success: true,
        data: appointment
      });
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao criar agendamento',
        error: error.message
      });
    }
  }

  /**
   * Listar todos os agendamentos
   */
  static async findAll(req, res) {
    try {
      const appointments = await Appointment.findAll();

      res.json({
        success: true,
        data: appointments
      });
    } catch (error) {
      console.error('Erro ao listar agendamentos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao listar agendamentos',
        error: error.message
      });
    }
  }

  /**
   * Buscar agendamento por ID
   */
  static async findById(req, res) {
    try {
      const { id } = req.params;
      const appointment = await Appointment.findById(id);

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Agendamento não encontrado'
        });
      }

      res.json({
        success: true,
        data: appointment
      });
    } catch (error) {
      console.error('Erro ao buscar agendamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar agendamento',
        error: error.message
      });
    }
  }

  /**
   * Listar agendamentos do usuário logado
   */
  static async findMyAppointments(req, res) {
    try {
      const userId = req.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const appointments = await Appointment.findByUserId(userId);

      res.json({
        success: true,
        data: appointments
      });
    } catch (error) {
      console.error('Erro ao listar agendamentos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao listar agendamentos',
        error: error.message
      });
    }
  }

  /**
   * Listar agendamentos passados e futuros do usuário logado
   * Seguindo RF23 - Visualizar Agendamentos Futuros e Passados
   * Regras de Negócio:
   * - Permite cliente visualizar seus próprios agendamentos
   * - Exibe: data, horário, barbeiro responsável e status
   * - Lista agendamentos passados e futuros
   * - Organiza em ordem cronológica crescente
   * - Exibe mensagem quando não houver agendamentos
   */
  static async findMyPastAndFutureAppointments(req, res) {
    try {
      const userId = req.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const appointments = await Appointment.findPastAndFutureByUserId(userId);

      res.json({
        success: true,
        data: appointments
      });
    } catch (error) {
      console.error('Erro ao listar agendamentos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao listar agendamentos',
        error: error.message
      });
    }
  }

  /**
   * Listar agendamentos por barbeiro
   */
  static async findByBarber(req, res) {
    try {
      const { barberId } = req.params;
      const appointments = await Appointment.findByBarberId(barberId);

      res.json({
        success: true,
        data: appointments
      });
    } catch (error) {
      console.error('Erro ao listar agendamentos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao listar agendamentos',
        error: error.message
      });
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
        return res.status(400).json({
          success: false,
          message: 'BarberId e date são obrigatórios'
        });
      }

      const allTimes = [];
      for (let hour = 9; hour < 19; hour++) {
        allTimes.push(`${hour.toString().padStart(2, '0')}:00`);
        allTimes.push(`${hour.toString().padStart(2, '0')}:30`);
      }

      const occupiedTimes = await Appointment.getOccupiedTimes(barberId, date);
      const availableTimes = allTimes.filter(time => !occupiedTimes.includes(time));

      res.json({
        success: true,
        data: {
          barberId,
          date,
          availableTimes,
          occupiedTimes
        }
      });
    } catch (error) {
      console.error('Erro ao buscar horários:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar horários disponíveis',
        error: error.message
      });
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

      res.json({
        success: true,
        data: {
          barberId,
          date,
          availableTimes,
          total: availableTimes.length
        }
      });
    } catch (error) {
      console.error('Erro ao buscar slots disponíveis:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar horários disponíveis',
        error: error.message
      });
    }
  }

  /**
   * Listar agendamentos por data
   */
  static async findByDate(req, res) {
    try {
      const { date } = req.params;
      const appointments = await Appointment.findByDate(date);

      res.json({
        success: true,
        data: appointments
      });
    } catch (error) {
      console.error('Erro ao listar agendamentos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao listar agendamentos',
        error: error.message
      });
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
        return res.status(400).json({
          success: false,
          message: 'Status inválido. Use: pending, confirmed, completed, cancelled'
        });
      }

      const appointment = await Appointment.updateStatus(id, status);

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Agendamento não encontrado'
        });
      }

      res.json({
        success: true,
        data: appointment
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar status',
        error: error.message
      });
    }
  }

/**
   * Cancelar agendamento seguindo as Regras de Negócio:
   * - Permite apenas agendamentos com status 'confirmed'
   * - Valida o prazo mínimo de antecedência (24 horas)
   * - Atualiza o status para 'cancelled'
   * - Libera o horário automaticamente no sistema
   * - Notifica o barbeiro responsável
   */
  static async cancel(req, res) {
    try {
      const { id } = req.params;
      
      // 1. Buscar o agendamento para extrair os dados
      const appointment = await Appointment.findById(id);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Agendamento não encontrado'
        });
      }

      // REGRA: O sistema deve permitir o cancelamento de agendamentos com status "confirmado"
      if (appointment.status !== 'confirmed') {
        return res.status(409).json({
          success: false,
          message: 'Apenas agendamentos confirmados podem ser cancelados.'
        });
      }

      // REGRA: O sistema deve validar regras de prazo mínimo para cancelamento (24 horas)
      let dateStr = appointment.date;
      if (appointment.date instanceof Date) {
        dateStr = appointment.date.toISOString().split('T')[0];
      }
      
      const appointmentDateTime = new Date(`${dateStr}T${appointment.time}`);
      const now = new Date();
      const hoursUntilAppointment = (appointmentDateTime - now) / (1000 * 60 * 60);

      if (hoursUntilAppointment < 24) {
        return res.status(409).json({
          success: false,
          message: 'Não é possível cancelar com menos de 24 horas de antecedência.'
        });
      }

      // REGRA: O sistema deve atualizar o status do agendamento para "cancelado"
      // NOTA: Ao mudar para 'cancelled', o horário é automaticamente liberado para novos agendamentos
      const canceledAppointment = await Appointment.updateStatus(id, 'cancelled');

      // REGRA: O barbeiro deve receber uma notificação de que um horário foi cancelado
      // Como o sistema atual não possui infraestrutura de WebSockets ou tabela de notificações,
      // centralizamos o disparo aqui através de logs do servidor e preparação do hook de envio.
      console.log(`\n🔔 [NOTIFICAÇÃO SISTEMA]`);
      console.log(`   Para: Barbeiro ID ${appointment.barber_id} (${appointment.barber_name})`);
      console.log(`   Mensagem: O cliente ${appointment.user_name || 'Cliente'} cancelou o serviço de ${appointment.service_name} marcado para o dia ${dateStr} às ${String(appointment.time).slice(0, 5)}.`);
      console.log(`   Status do Horário: Liberado e disponível na tabela.\n`);

      res.json({
        success: true,
        message: 'Agendamento cancelado com sucesso e horário liberado.',
        data: canceledAppointment
      });
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao cancelar agendamento',
        error: error.message
      });
    }
  }

  /**
   * Deletar agendamento
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const deleted = await Appointment.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Agendamento não encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Agendamento deletado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao deletar agendamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao deletar agendamento',
        error: error.message
      });
    }
  }

  static async getBarberSchedule(req, res) {
    try {
      const { barberId } = req.params;
      let { date } = req.params;

      if (!barberId) {
        return res.status(400).json({
          success: false,
          message: 'ID do barbeiro é obrigatório'
        });
      }

      if (!date) {
        date = new Date().toISOString().split('T')[0];
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({
          success: false,
          message: 'Data deve estar no formato YYYY-MM-DD'
        });
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
      console.error('Erro ao obter agenda do barbeiro:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao obter agenda do barbeiro',
        error: error.message
      });
    }
  }

  static async getBarberScheduleByDateRange(req, res) {
    try {
      const { barberId } = req.params;
      const { startDate, endDate } = req.query;

      if (!barberId) {
        return res.status(400).json({
          success: false,
          message: 'ID do barbeiro é obrigatório'
        });
      }

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'startDate e endDate são obrigatórios (formato YYYY-MM-DD)'
        });
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        return res.status(400).json({
          success: false,
          message: 'Datas devem estar no formato YYYY-MM-DD'
        });
      }

      if (new Date(startDate) > new Date(endDate)) {
        return res.status(400).json({
          success: false,
          message: 'startDate deve ser menor ou igual a endDate'
        });
      }

      const appointments = await Appointment.findByBarberDateRange(barberId, startDate, endDate);

      const appointmentsByDate = {};
      appointments.forEach(apt => {
        const dateStr = apt.date instanceof Date ? apt.date.toISOString().split('T')[0] : apt.date;
        if (!appointmentsByDate[dateStr]) {
          appointmentsByDate[dateStr] = [];
        }
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
      console.error('Erro ao obter agenda do barbeiro (intervalo):', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao obter agenda do barbeiro',
        error: error.message
      });
    }
  }
}

module.exports = AppointmentController;