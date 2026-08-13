const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Unavailability = require('../models/Unavailability');
const Service = require('../models/Service');
const pool = require('../database');
const { handleError } = require('../utils/errorHandler');

class BarberController {
  static async dashboard(req, res) {
    try {
      const { id } = req.params;

      if (req.userRole !== 'admin' && String(req.userId) !== String(id)) {
        return res.status(403).json({ success: false, message: 'Acesso negado' });
      }

      const barber = await User.findById(id);
      if (!barber || barber.role !== 'barber') {
        return res.status(404).json({ success: false, message: 'Barbeiro não encontrado' });
      }

      const appointments = await Appointment.findByBarberId(id);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate.getTime() === today.getTime() && apt.status !== 'cancelled';
      });

      const dailyProfit = todayAppointments.reduce((total, appointment) => {
        const rawValue = appointment.service_price ?? appointment.price ?? 0;
        const numericValue = Number(rawValue);
        return total + (Number.isFinite(numericValue) ? numericValue : 0);
      }, 0);

      const upcomingAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate.getTime() > today.getTime() && apt.status !== 'cancelled';
      }).slice(0, 10);

      const completedAppointments = appointments.filter(apt => apt.status === 'completed');
      const cancelledAppointments = appointments.filter(apt => apt.status === 'cancelled');

      const unavailabilities = await Unavailability.findByBarberId(id);
      const activeUnavailabilities = unavailabilities.filter(unav => {
        const startDate = new Date(unav.start_date);
        const endDate = new Date(unav.end_date);
        return startDate <= today && endDate >= today;
      });

      const services = await Service.findAll();

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
              confirmedAppointments: appointments.filter(apt => apt.status === 'confirmed').length,
              dailyProfit
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
      handleError(res, error, 'Erro ao buscar dashboard do barbeiro:', 'BarberController');
    }
  }

  static async updateAvatar(req, res) {
    try {
      const { id } = req.params;
      const { avatar } = req.body;

      if (req.userRole !== 'admin' && String(req.userId) !== String(id)) {
        return res.status(403).json({ success: false, message: 'Acesso negado' });
      }

      if (!avatar) {
        return res.status(400).json({ success: false, message: 'Avatar é obrigatório' });
      }

      if (!/^data:image\/(png|jpe?g|webp);base64,/.test(avatar)) {
        return res.status(400).json({ success: false, message: 'Formato de imagem inválido. Envie PNG, JPG ou WEBP em base64.' });
      }

      // Limite de ~2MB para o base64 (evita payloads gigantes no banco)
      const MAX_AVATAR_LENGTH = 2 * 1024 * 1024 * 1.4;
      if (avatar.length > MAX_AVATAR_LENGTH) {
        return res.status(400).json({ success: false, message: 'A imagem excede o limite de 2MB.' });
      }

      const conn = await pool.getConnection();
      try {
        await conn.query(
          'UPDATE users SET avatar = ? WHERE id = ? AND role = "barber"',
          [avatar, id]
        );
        return res.json({ success: true, message: 'Avatar atualizado com sucesso' });
      } finally {
        conn.release();
      }
    } catch (error) {
      handleError(res, error, 'Erro ao atualizar avatar:', 'BarberController');
    }
  }

  // PUT /api/barber/:id/waitlist-priority
  static async setWaitlistPriority(req, res) {
    try {
      const { id } = req.params;
      const { priority } = req.body;

      const validPriorities = ['arrival_order', 'haircut_count'];
      if (!priority || !validPriorities.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: 'Prioridade inválida. Use "arrival_order" ou "haircut_count".'
        });
      }

      const barber = await User.findById(id);
      if (!barber || barber.role !== 'barber') {
        return res.status(404).json({ success: false, message: 'Barbeiro não encontrado' });
      }

      if (req.userRole !== 'admin' && req.userId !== barber.id) {
        return res.status(403).json({ success: false, message: 'Acesso negado' });
      }

      const conn = await pool.getConnection();
      try {
        await conn.query('UPDATE users SET waitlist_priority = ? WHERE id = ?', [priority, id]);
      } finally {
        conn.release();
      }

      const labels = { arrival_order: 'Ordem de chegada', haircut_count: 'Quantidade de cortes' };
      return res.json({
        success: true,
        message: `Prioridade da fila atualizada para: ${labels[priority]}`,
        data: { barberId: id, priority }
      });
    } catch (error) {
      handleError(res, error, 'Erro ao atualizar prioridade da fila:', 'BarberController');
    }
  }

  // GET /api/barber/:id/waitlist-priority
  static async getWaitlistPriority(req, res) {
    try {
      const { id } = req.params;

      if (req.userRole !== 'admin' && String(req.userId) !== String(id)) {
        return res.status(403).json({ success: false, message: 'Acesso negado' });
      }

      const conn = await pool.getConnection();
      try {
        const [rows] = await conn.query(
          'SELECT waitlist_priority FROM users WHERE id = ? AND role = "barber"',
          [id]
        );
        if (!rows.length) {
          return res.status(404).json({ success: false, message: 'Barbeiro não encontrado' });
        }
        return res.json({
          success: true,
          data: { barberId: id, priority: rows[0].waitlist_priority || 'arrival_order' }
        });
      } finally {
        conn.release();
      }
    } catch (error) {
      handleError(res, error, 'Erro ao buscar prioridade da fila:', 'BarberController');
    }
  }
}

module.exports = BarberController;
