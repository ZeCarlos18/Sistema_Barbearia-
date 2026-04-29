const Appointment = require('../models/Appointment');
const Service = require('../models/Service');

class AppointmentController {
  /**
   * Criar novo agendamento
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

      // Verificar se o horário já está ocupado
      const occupiedTimes = await Appointment.getOccupiedTimes(barberId, date);
      if (occupiedTimes.includes(time)) {
        return res.status(409).json({
          success: false,
          message: 'Horário já está ocupado para este barbeiro nesta data'
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
      const userId = req.user?.id;
      
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

      // Horários de funcionamento (9h às 19h, de 30 em 30 minutos)
      const allTimes = [];
      for (let hour = 9; hour < 19; hour++) {
        allTimes.push(`${hour.toString().padStart(2, '0')}:00`);
        allTimes.push(`${hour.toString().padStart(2, '0')}:30`);
      }

      // Buscar horários ocupados
      const occupiedTimes = await Appointment.getOccupiedTimes(barberId, date);

      // Filtrar horários disponíveis
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
   * Cancelar agendamento
   */
  static async cancel(req, res) {
    try {
      const { id } = req.params;
      const appointment = await Appointment.cancel(id);

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Agendamento não encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Agendamento cancelado com sucesso',
        data: appointment
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
}

module.exports = AppointmentController;