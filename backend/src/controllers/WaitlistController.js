const Waitlist = require('../models/Waitlist');
const Appointment = require('../models/Appointment');
const Service = require('../models/Service');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { handleError } = require('../utils/errorHandler');

class WaitlistController {
  // ─── CLIENT ENDPOINTS ────────────────────────────────────────────────────────

  static async join(req, res) {
    try {
      const userId = req.userId;
      const { barberId, serviceId, date, time } = req.body;

      if (!userId || !barberId || !serviceId || !date || !time) {
        return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios' });
      }

      const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
      const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
      if (!dateRegex.test(date) || !timeRegex.test(time)) {
        return res.status(400).json({ success: false, message: 'Data ou horário inválidos' });
      }

      const service = await Service.findById(serviceId);
      if (!service) {
        return res.status(404).json({ success: false, message: 'Serviço não encontrado' });
      }

      // Slot must actually be occupied
      const occupiedTimes = await Appointment.getOccupiedTimes(barberId, date);
      const normalizedTime = time.substring(0, 5);
      if (!occupiedTimes.includes(normalizedTime)) {
        return res.status(400).json({
          success: false,
          message: 'Este horário está disponível. Faça o agendamento diretamente.'
        });
      }

      // No conflicting appointment for this user
      const userAppointmentsOnDate = await Appointment.findByUserAndDate(userId, date);
      const hasConflict = userAppointmentsOnDate.some(
        (apt) => apt.time.startsWith(normalizedTime) && apt.status !== 'cancelled'
      );
      if (hasConflict) {
        return res.status(409).json({
          success: false,
          message: 'Você já tem um agendamento marcado para este horário.'
        });
      }

      // No duplicate waitlist entry
      const alreadyWaiting = await Waitlist.findByUserBarberDateTime(userId, barberId, date, normalizedTime);
      if (alreadyWaiting) {
        return res.status(409).json({
          success: false,
          message: 'Você já está na fila de espera para este horário.'
        });
      }

      const entry = await Waitlist.create({ userId, barberId, serviceId, date, time: normalizedTime });
      const position = await Waitlist.getPositionInQueue(entry.id);

      res.status(201).json({
        success: true,
        message: `Você entrou na fila de espera na posição ${position}.`,
        data: { ...entry, position }
      });
    } catch (error) {
      handleError(res, error, 'Erro ao entrar na fila de espera', 'WaitlistController');
    }
  }

  static async getPosition(req, res) {
    try {
      const { id } = req.params;
      const entry = await Waitlist.findById(id);

      if (!entry) {
        return res.status(404).json({ success: false, message: 'Entrada na fila não encontrada' });
      }

      if (entry.user_id !== req.userId) {
        return res.status(403).json({ success: false, message: 'Acesso negado' });
      }

      const position = await Waitlist.getPositionInQueue(id);
      res.json({ success: true, data: { ...entry, position } });
    } catch (error) {
      handleError(res, error, 'Erro ao buscar posição na fila', 'WaitlistController');
    }
  }

  static async getMyWaitlist(req, res) {
    try {
      const entries = await Waitlist.findByUserId(req.userId);
      res.json({ success: true, data: entries });
    } catch (error) {
      handleError(res, error, 'Erro ao listar fila de espera', 'WaitlistController');
    }
  }

  static async accept(req, res) {
    try {
      const { id } = req.params;
      const entry = await Waitlist.findById(id);

      if (!entry) return res.status(404).json({ success: false, message: 'Entrada na fila não encontrada' });
      if (entry.user_id !== req.userId) return res.status(403).json({ success: false, message: 'Acesso negado' });
      if (entry.status !== 'notified') return res.status(409).json({ success: false, message: 'Esta vaga não está mais disponível para confirmação.' });

      const timeoutMinutes = parseInt(process.env.WAITLIST_TIMEOUT_MINUTES) || 15;
      const minutesSinceNotified = (new Date() - new Date(entry.notified_at)) / (1000 * 60);
      if (minutesSinceNotified > timeoutMinutes) {
        await Waitlist.updateStatus(id, 'expired');
        return res.status(409).json({ success: false, message: 'O tempo para aceitar esta vaga expirou.' });
      }

      const dateStr = entry.date instanceof Date ? entry.date.toISOString().split('T')[0] : String(entry.date);
      const timeStr = typeof entry.time === 'string'
        ? entry.time.substring(0, 5)
        : `${String(entry.time.getHours()).padStart(2, '0')}:${String(entry.time.getMinutes()).padStart(2, '0')}`;

      const occupiedTimes = await Appointment.getOccupiedTimes(entry.barber_id, dateStr);
      if (occupiedTimes.includes(timeStr)) {
        await Waitlist.updateStatus(id, 'expired');
        return res.status(409).json({ success: false, message: 'Este horário foi ocupado por outro cliente.' });
      }

      const newAppointment = await Appointment.create({
        userId: entry.user_id,
        barberId: entry.barber_id,
        serviceId: entry.service_id,
        date: dateStr,
        time: timeStr
      });

      await Waitlist.updateStatus(id, 'converted');

      res.status(201).json({
        success: true,
        message: 'Agendamento confirmado com sucesso!',
        data: newAppointment
      });
    } catch (error) {
      handleError(res, error, 'Erro ao aceitar vaga', 'WaitlistController');
    }
  }

  static async refuse(req, res) {
    try {
      const { id } = req.params;
      const entry = await Waitlist.findById(id);

      if (!entry) return res.status(404).json({ success: false, message: 'Entrada na fila não encontrada' });
      if (entry.user_id !== req.userId) return res.status(403).json({ success: false, message: 'Acesso negado' });
      if (entry.status !== 'notified') return res.status(409).json({ success: false, message: 'Esta entrada não pode ser recusada no momento.' });

      await Waitlist.updateStatus(id, 'cancelled');

      const dateStr = entry.date instanceof Date ? entry.date.toISOString().split('T')[0] : String(entry.date);
      const timeStr = typeof entry.time === 'string'
        ? entry.time.substring(0, 5)
        : `${String(entry.time.getHours()).padStart(2, '0')}:${String(entry.time.getMinutes()).padStart(2, '0')}`;

      const timeoutMinutes = parseInt(process.env.WAITLIST_TIMEOUT_MINUTES) || 15;
      const next = await Waitlist.getFirstWaiting(entry.barber_id, dateStr, timeStr);
      if (next) {
        await Waitlist.notifyEntry(next.id);
        await Notification.create({
          userId: next.user_id,
          barberId: entry.barber_id,
          type: 'waitlist_notified',
          channel: 'push',
          title: 'Sua vez na fila de espera!',
          message: `Uma vaga abriu para as ${timeStr} do dia ${dateStr}. Você tem ${timeoutMinutes} minutos para confirmar.`,
          relatedAppointmentId: null,
          status: 'unread'
        });
      }

      res.json({ success: true, message: 'Vaga recusada. O próximo da fila foi notificado.' });
    } catch (error) {
      handleError(res, error, 'Erro ao recusar vaga', 'WaitlistController');
    }
  }

  static async cancel(req, res) {
    try {
      const { id } = req.params;
      const entry = await Waitlist.findById(id);

      if (!entry) {
        return res.status(404).json({ success: false, message: 'Entrada na fila não encontrada' });
      }

      if (entry.user_id !== req.userId) {
        return res.status(403).json({ success: false, message: 'Acesso negado' });
      }

      if (entry.status !== 'waiting') {
        return res.status(409).json({ success: false, message: 'Esta entrada na fila não pode ser cancelada.' });
      }

      await Waitlist.updateStatus(id, 'cancelled');
      res.json({ success: true, message: 'Você saiu da fila de espera com sucesso.' });
    } catch (error) {
      handleError(res, error, 'Erro ao cancelar entrada na fila', 'WaitlistController');
    }
  }

  // ─── BARBER MANAGEMENT ENDPOINTS ─────────────────────────────────────────────

  // Validates that the authenticated user is the barber or an admin
  static _assertBarberOrAdmin(req, barberId) {
    if (req.userRole !== 'admin' && req.userId !== parseInt(barberId)) {
      return false;
    }
    return true;
  }

  // Rule 4 & 5: GET /api/waitlist/barber/:barberId/date/:date/slots
  // Returns all time slots with waiting clients for a date
  static async getWaitlistSlots(req, res) {
    try {
      const { barberId, date } = req.params;

      if (!WaitlistController._assertBarberOrAdmin(req, barberId)) {
        return res.status(403).json({ success: false, message: 'Acesso negado' });
      }

      const barber = await User.findById(barberId);
      if (!barber || barber.role !== 'barber') {
        return res.status(404).json({ success: false, message: 'Barbeiro não encontrado' });
      }

      const slots = await Waitlist.getWaitlistSlots(barberId, date);
      res.json({ success: true, data: slots });
    } catch (error) {
      handleError(res, error, 'Erro ao buscar horários da fila', 'WaitlistController');
    }
  }

  // Rule 4: GET /api/waitlist/barber/:barberId/date/:date/time/:time
  // Returns full ordered waitlist for a specific slot (barber view)
  static async getSlotWaitlist(req, res) {
    try {
      const { barberId, date, time } = req.params;

      if (!WaitlistController._assertBarberOrAdmin(req, barberId)) {
        return res.status(403).json({ success: false, message: 'Acesso negado' });
      }

      const normalizedTime = time.substring(0, 5);
      const [entries, locked] = await Promise.all([
        Waitlist.getFullWaitlist(barberId, date, normalizedTime),
        Waitlist.isSlotLocked(barberId, date, normalizedTime)
      ]);

      res.json({ success: true, data: { entries, locked } });
    } catch (error) {
      handleError(res, error, 'Erro ao buscar fila do horário', 'WaitlistController');
    }
  }

  // Rules 3, 6 & 7: POST /api/waitlist/barber/:barberId/date/:date/time/:time/reorder
  // Sets pending positions (draft). Body: { positions: [{id, position}] }
  static async setPendingPositions(req, res) {
    try {
      const { barberId, date, time } = req.params;
      const { positions } = req.body;

      if (!WaitlistController._assertBarberOrAdmin(req, barberId)) {
        return res.status(403).json({ success: false, message: 'Acesso negado' });
      }

      if (!Array.isArray(positions) || positions.length === 0) {
        return res.status(400).json({ success: false, message: 'Lista de posições é obrigatória' });
      }

      for (const p of positions) {
        if (!p.id || typeof p.position !== 'number' || p.position < 1) {
          return res.status(400).json({ success: false, message: 'Cada item deve ter id e position válidos' });
        }
      }

      const normalizedTime = time.substring(0, 5);

      // Rule 8: block changes if notification process has started
      const locked = await Waitlist.isSlotLocked(barberId, date, normalizedTime);
      if (locked) {
        return res.status(409).json({
          success: false,
          message: 'A ordem da fila está bloqueada pois o processo de notificação já foi iniciado.'
        });
      }

      await Waitlist.setPendingPositions(barberId, date, normalizedTime, positions);

      const entries = await Waitlist.getFullWaitlist(barberId, date, normalizedTime);
      res.json({
        success: true,
        message: 'Alterações salvas como rascunho. Confirme para aplicar.',
        data: { entries }
      });
    } catch (error) {
      handleError(res, error, 'Erro ao salvar posições pendentes', 'WaitlistController');
    }
  }

  // Rule 7: POST /api/waitlist/barber/:barberId/date/:date/time/:time/confirm-reorder
  // Applies pending positions to the official queue order
  static async confirmReorder(req, res) {
    try {
      const { barberId, date, time } = req.params;

      if (!WaitlistController._assertBarberOrAdmin(req, barberId)) {
        return res.status(403).json({ success: false, message: 'Acesso negado' });
      }

      const normalizedTime = time.substring(0, 5);

      // Rule 8: block if notification process has started
      const locked = await Waitlist.isSlotLocked(barberId, date, normalizedTime);
      if (locked) {
        return res.status(409).json({
          success: false,
          message: 'A ordem da fila está bloqueada pois o processo de notificação já foi iniciado.'
        });
      }

      const affected = await Waitlist.confirmPositionChanges(barberId, date, normalizedTime);
      if (affected === 0) {
        return res.status(400).json({ success: false, message: 'Nenhuma alteração pendente encontrada.' });
      }

      const entries = await Waitlist.getFullWaitlist(barberId, date, normalizedTime);
      res.json({
        success: true,
        message: 'Ordem da fila atualizada com sucesso.',
        data: { entries }
      });
    } catch (error) {
      handleError(res, error, 'Erro ao confirmar reordenação', 'WaitlistController');
    }
  }

  // Rule 7: DELETE /api/waitlist/barber/:barberId/date/:date/time/:time/pending
  // Cancels pending changes without applying them
  static async cancelPendingReorder(req, res) {
    try {
      const { barberId, date, time } = req.params;

      if (!WaitlistController._assertBarberOrAdmin(req, barberId)) {
        return res.status(403).json({ success: false, message: 'Acesso negado' });
      }

      const normalizedTime = time.substring(0, 5);
      await Waitlist.cancelPendingReorder(barberId, date, normalizedTime);

      const entries = await Waitlist.getFullWaitlist(barberId, date, normalizedTime);
      res.json({
        success: true,
        message: 'Alterações pendentes descartadas.',
        data: { entries }
      });
    } catch (error) {
      handleError(res, error, 'Erro ao cancelar alterações pendentes', 'WaitlistController');
    }
  }
}

module.exports = WaitlistController;
