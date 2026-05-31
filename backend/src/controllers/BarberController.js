const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Unavailability = require('../models/Unavailability');
const Service = require('../models/Service');

/**
 * BarberController - Controlador para dados do barbeiro
 * Gerencia dashboard e informações consolidadas do barbeiro
 */
class BarberController {
  /**
   * Retorna todas as informações do barbeiro em um único endpoint
   * GET /api/barber/:id/dashboard
   * 
   * Retorna:
   * - Dados do barbeiro (nome, email, telefone, avatar)
   * - Agendamentos de hoje e próximos dias
   * - Indisponibilidades
   * - Serviços disponíveis
   * - Estatísticas
   */
  static async dashboard(req, res) {
    try {
      const { id } = req.params;

      // 1. Verificar se barbeiro existe
      const barber = await User.findById(id);
      if (!barber || barber.role !== 'barber') {
        return res.status(404).json({
          success: false,
          message: 'Barbeiro não encontrado'
        });
      }

      // 2. Buscar agendamentos do barbeiro
      const appointments = await Appointment.findByBarberId(id);
      
      // Separar agendamentos por status e data
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate.getTime() === today.getTime() && apt.status !== 'cancelled';
      });

      const upcomingAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate.getTime() > today.getTime() && apt.status !== 'cancelled';
      }).slice(0, 10); // Próximos 10

      const completedAppointments = appointments.filter(apt => apt.status === 'completed');
      const cancelledAppointments = appointments.filter(apt => apt.status === 'cancelled');

      // 3. Buscar indisponibilidades ativas
      const unavailabilities = await Unavailability.findByBarberId(id);
      const activeUnavailabilities = unavailabilities.filter(unav => {
        const startDate = new Date(unav.start_date);
        const endDate = new Date(unav.end_date);
        return startDate <= today && endDate >= today;
      });

      // 4. Buscar serviços disponíveis
      const services = await Service.findAll();

      // 5. Montar resposta consolidada
      return res.json({
        success: true,
        data: {
          barber: {
            id: barber.id,
            name: barber.name,
            email: barber.email,
            phone: barber.phone,
            role: barber.role,
            avatar: barber.avatar || null,
            createdAt: barber.created_at
          },
          appointments: {
            today: todayAppointments,
            upcoming: upcomingAppointments,
            statistics: {
              totalAppointments: appointments.length,
              completedAppointments: completedAppointments.length,
              cancelledAppointments: cancelledAppointments.length,
              pendingAppointments: appointments.filter(apt => apt.status === 'pending').length,
              confirmedAppointments: appointments.filter(apt => apt.status === 'confirmed').length
            }
          },
          unavailabilities: activeUnavailabilities,
          services: services.map(svc => ({
            id: svc.id,
            name: svc.name,
            description: svc.description,
            price: svc.price,
            duration: svc.duration
          }))
        }
      });
    } catch (error) {
      console.error('Erro ao buscar dashboard do barbeiro:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar dashboard',
        error: error.message
      });
    }
  }

  /**
   * Atualizar avatar do barbeiro
   * PUT /api/barber/:id/avatar
   */
  static async updateAvatar(req, res) {
    try {
      const { id } = req.params;
      const { avatar } = req.body; // Base64 string

      if (!avatar) {
        return res.status(400).json({
          success: false,
          message: 'Avatar é obrigatório'
        });
      }

      // Atualizar no banco de dados
      const connection = require('../database');
      const conn = await connection.getConnection();
      
      try {
        await conn.query(
          'UPDATE users SET avatar = ? WHERE id = ? AND role = "barber"',
          [avatar, id]
        );

        return res.json({
          success: true,
          message: 'Avatar atualizado com sucesso'
        });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('Erro ao atualizar avatar:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar avatar',
        error: error.message
      });
    }
  }
}

module.exports = BarberController;
