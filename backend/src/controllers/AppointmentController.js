const Appointment = require('../models/Appointment');
const Service = require('../models/Service');
const Waitlist = require('../models/Waitlist');
const Notification = require('../models/Notification');
const User = require('../models/User');
const BarberAvailability = require('../models/BarberAvailability');
const Unavailability = require('../models/Unavailability');
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

// ---- Auxiliares para o Registro Manual de Agendamento (RF26) ----

/**
 * Normaliza um valor de horário vindo do MySQL (string "HH:MM:SS" ou objeto Date/TIME)
 * para o formato "HH:MM".
 */
const normalizeTimeValue = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value.substring(0, 5);
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Faz o parse da coluna users.available_days (armazenada como JSON string, ex: "[1,2,3,4,5]")
 * para um array de números (0=Domingo ... 6=Sábado, mesma convenção do Date.getDay()).
 */
const parseAvailableDays = (raw) => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(Number).filter((n) => !Number.isNaN(n));
  } catch (e) {
    // Não era JSON válido; tenta formato "1,2,3"
  }
  if (typeof raw === 'string') {
    const fallback = raw.split(',').map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n));
    return fallback.length > 0 ? fallback : null;
  }
  return null;
};

/**
 * Valida se a data/horário escolhidos estão dentro do período de atendimento do barbeiro
 * (dias disponíveis + horário de início/fim configurados em BarberAvailability).
 * Se o barbeiro ainda não configurou essa agenda (valores nulos), não bloqueia.
 */
const validateBarberWorkingHours = (schedule, date, time) => {
  if (!schedule) return { ok: true };

  const availableDays = parseAvailableDays(schedule.available_days);
  if (availableDays && availableDays.length > 0) {
    const [year, month, day] = date.split('-').map(Number);
    const weekday = new Date(year, month - 1, day).getDay();
    if (!availableDays.includes(weekday)) {
      return { ok: false, message: 'O barbeiro não atende neste dia da semana.' };
    }
  }

  const start = normalizeTimeValue(schedule.start_time);
  const end = normalizeTimeValue(schedule.end_time);
  if (start && end) {
    if (time < start || time >= end) {
      return { ok: false, message: `O barbeiro atende apenas entre ${start} e ${end}.` };
    }
  }

  return { ok: true };
};

/**
 * Constrói a lista de horários bloqueados por indisponibilidades ativas (RF12) de um barbeiro
 * em uma data específica. Retorna { fullDayBlocked, blockedTimes }.
 */
const buildUnavailabilityBlocks = (activeUnavailabilities) => {
  const fullDayBlocked = activeUnavailabilities.some(
    (u) => u.start_time === null && u.end_time === null
  );

  const blockedTimes = [];
  if (!fullDayBlocked) {
    for (const u of activeUnavailabilities) {
      if (u.start_time && u.end_time) {
        const start = normalizeTimeValue(u.start_time);
        const end = normalizeTimeValue(u.end_time);
        let [curH, curM] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);
        while (curH < 24) {
          blockedTimes.push(`${String(curH).padStart(2, '0')}:${String(curM).padStart(2, '0')}`);
          if (curH === endH && curM === endM) break;
          curM += 30;
          if (curM >= 60) { curM = 0; curH += 1; }
        }
      }
    }
  }

  return { fullDayBlocked, blockedTimes };
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

  static async confirm(req, res) {
    try {
      const { id } = req.params;
      const appointment = await Appointment.updateStatus(id, 'confirmed');
      if (!appointment) return res.status(404).json({ success: false, message: 'Agendamento não encontrado' });
      res.json({ success: true, data: appointment });
    } catch (error) {
      handleError(res, error, 'Erro ao confirmar agendamento');
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

  /**
   * RF28 - Apagar Cortes do Histórico
   * Remove o agendamento apenas da visão de histórico do próprio usuário (soft-hide).
   * Não altera os registros administrativos: o agendamento continua existindo e visível
   * para o barbeiro/admin nas telas de agenda.
   * Só é permitido para agendamentos do próprio usuário com status "completed" (Realizado)
   * ou "cancelled" (Cancelado); agendamentos "confirmed" (Confirmado) não podem ser removidos.
   */
  static async deleteFromHistory(req, res) {
    try {
      if (!req.userId) return res.status(401).json({ success: false, message: 'Usuário não autenticado' });

      const { id } = req.params;
      const appointment = await Appointment.findById(id);

      if (!appointment) {
        return res.status(404).json({ success: false, message: 'Agendamento não encontrado' });
      }

      if (String(appointment.user_id) !== String(req.userId)) {
        return res.status(403).json({ success: false, message: 'Você só pode remover agendamentos do seu próprio histórico' });
      }

      if (!['completed', 'cancelled'].includes(appointment.status)) {
        return res.status(409).json({
          success: false,
          message: 'Apenas agendamentos com status Realizado ou Cancelado podem ser removidos do histórico.'
        });
      }

      const hidden = await Appointment.hideFromHistory(id, req.userId);
      if (!hidden) {
        return res.status(409).json({ success: false, message: 'Não foi possível remover o agendamento do histórico.' });
      }

      res.json({ success: true, message: 'Agendamento removido do histórico com sucesso.' });
    } catch (error) {
      handleError(res, error, 'Erro ao remover agendamento do histórico', 'AppointmentController');
    }
  }

  /**
   * RF26 - Registrar Agendamento Manualmente
   * Permite que um barbeiro (apenas em sua própria agenda) ou o barbeiro chefe/admin
   * (em qualquer agenda de barbeiro disponível) registre um agendamento em nome de um
   * cliente que agendou fora do sistema (presencial, telefone ou WhatsApp).
   * O agendamento é criado diretamente com status "confirmed".
   */
  static async createManual(req, res) {
    try {
      if (!req.userId || !req.userRole) {
        return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
      }
      if (!['barber', 'admin'].includes(req.userRole)) {
        return res.status(403).json({ success: false, message: 'Apenas barbeiros ou o barbeiro chefe podem registrar agendamentos manuais.' });
      }

      const { serviceId, date, time, barberId, clientId, clientName, clientPhone } = req.body;

      // 1. Resolve o barbeiro alvo da agenda
      let targetBarberId;
      if (req.userRole === 'barber') {
        if (barberId && String(barberId) !== String(req.userId)) {
          return res.status(403).json({ success: false, message: 'Barbeiros só podem registrar agendamentos em sua própria agenda.' });
        }
        targetBarberId = req.userId;
      } else {
        // barbeiro chefe (admin): pode direcionar para qualquer barbeiro disponível
        if (!barberId) {
          return res.status(400).json({ success: false, message: 'Selecione o barbeiro para o agendamento.' });
        }
        targetBarberId = barberId;
      }

      const targetBarber = await User.findById(targetBarberId);
      if (!targetBarber || targetBarber.role !== 'barber') {
        return res.status(404).json({ success: false, message: 'Barbeiro não encontrado.' });
      }
      if (Number(targetBarber.active) === 0) {
        return res.status(409).json({ success: false, message: 'Este barbeiro está inativo e não pode receber novos agendamentos.' });
      }

      // 2. Validação dos campos obrigatórios
      if (!serviceId || !date || !time) {
        return res.status(400).json({ success: false, message: 'Serviço, data e horário são obrigatórios.' });
      }

      const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
      const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
      if (!dateRegex.test(date) || !timeRegex.test(time)) {
        return res.status(400).json({ success: false, message: 'Data ou horário inválidos.' });
      }

      const service = await Service.findById(serviceId);
      if (!service) return res.status(404).json({ success: false, message: 'Serviço não encontrado.' });

      // 3. Não permite agendar no passado
      const [year, month, day] = date.split('-').map(Number);
      const [hour, minute] = time.split(':').map(Number);
      const appointmentDateTime = new Date(year, month - 1, day, hour, minute, 0, 0);
      if (appointmentDateTime <= new Date()) {
        return res.status(400).json({ success: false, message: 'Não é possível agendar em um horário passado.' });
      }

      // 4. Valida se o horário está dentro do período de atendimento do barbeiro
      const schedule = await BarberAvailability.getSchedule(targetBarberId);
      const scheduleCheck = validateBarberWorkingHours(schedule, date, time);
      if (!scheduleCheck.ok) {
        return res.status(409).json({ success: false, message: scheduleCheck.message });
      }

      // 5. Valida indisponibilidades ativas do barbeiro
      const activeUnavailabilities = await Unavailability.findActiveUnavailabilities(targetBarberId, date, time);
      if (activeUnavailabilities.length > 0) {
        return res.status(409).json({ success: false, message: 'O barbeiro está indisponível neste dia/horário.' });
      }

      // 6. Valida se o horário já está ocupado
      const occupiedTimes = await Appointment.getOccupiedTimes(targetBarberId, date);
      if (occupiedTimes.includes(time)) {
        return res.status(409).json({ success: false, message: 'Este horário já está ocupado na agenda do barbeiro.' });
      }

      // 7. Resolve o cliente (cadastro existente via clientId, ou nome+telefone para cliente sem conta)
      let clientUser;
      if (clientId) {
        clientUser = await User.findById(clientId);
        if (!clientUser) {
          return res.status(404).json({ success: false, message: 'Cliente informado não encontrado.' });
        }
      } else {
        if (!clientName || !clientName.trim() || !clientPhone || !clientPhone.trim()) {
          return res.status(400).json({
            success: false,
            message: 'Informe o cliente por um cadastro existente (clientId) ou pelo nome e telefone.'
          });
        }

        const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/;
        if (!nameRegex.test(clientName.trim())) {
          return res.status(400).json({ success: false, message: 'Nome do cliente inválido: utilize apenas letras e espaços.' });
        }

        const formattedPhone = clientPhone.replace(/\D/g, '');
        if (formattedPhone.length < 10 || formattedPhone.length > 11) {
          return res.status(400).json({ success: false, message: 'Telefone do cliente inválido: deve conter DDD e número (10 a 11 dígitos).' });
        }

        const { user } = await User.findOrCreateClient({ name: clientName.trim(), phone: formattedPhone });
        clientUser = user;
      }

      // 8. Cria o agendamento já com status "confirmed"
      const appointment = await Appointment.create({
        userId: clientUser.id,
        barberId: targetBarberId,
        serviceId,
        date,
        time
      });

      return res.status(201).json({
        success: true,
        message: 'Agendamento manual registrado com sucesso.',
        data: {
          ...appointment,
          client: { id: clientUser.id, name: clientUser.name, phone: clientUser.phone }
        }
      });
    } catch (error) {
      handleError(res, error, 'Erro ao registrar agendamento manual', 'AppointmentController');
    }
  }

  /**
   * RF26 (apoio) - Horários disponíveis para o registro manual
   * Retorna os horários livres da agenda do barbeiro autenticado (role "barber") ou do
   * barbeiro selecionado pelo barbeiro chefe (role "admin"), já descontando horários
   * ocupados, indisponibilidades ativas e o período de atendimento configurado do barbeiro.
   */
  static async getManualAvailableTimes(req, res) {
    try {
      if (!req.userId || !req.userRole) return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
      if (!['barber', 'admin'].includes(req.userRole)) {
        return res.status(403).json({ success: false, message: 'Acesso negado' });
      }

      const { barberId } = req.params;
      const { date } = req.query;

      if (req.userRole === 'barber' && String(req.userId) !== String(barberId)) {
        return res.status(403).json({ success: false, message: 'Barbeiros só podem consultar sua própria agenda.' });
      }

      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ success: false, message: 'Data inválida.' });
      }

      const barber = await User.findById(barberId);
      if (!barber || barber.role !== 'barber') {
        return res.status(404).json({ success: false, message: 'Barbeiro não encontrado.' });
      }
      if (Number(barber.active) === 0) {
        return res.status(409).json({ success: false, message: 'Barbeiro inativo.' });
      }

      const schedule = await BarberAvailability.getSchedule(barberId);
      const occupiedTimes = await Appointment.getOccupiedTimes(barberId, date);
      const activeUnavailabilities = await Unavailability.findActiveUnavailabilities(barberId, date, null);
      const { fullDayBlocked, blockedTimes } = buildUnavailabilityBlocks(activeUnavailabilities);

      const allTimes = generateTimeSlots();
      const availableTimes = fullDayBlocked ? [] : allTimes.filter((slot) => {
        if (occupiedTimes.includes(slot)) return false;
        if (blockedTimes.includes(slot)) return false;
        return validateBarberWorkingHours(schedule, date, slot).ok;
      });

      res.json({ success: true, data: { barberId, date, availableTimes } });
    } catch (error) {
      handleError(res, error, 'Erro ao buscar horários disponíveis para agendamento manual', 'AppointmentController');
    }
  }

  static async getBarberSchedule(req, res) {
    try {
      const { barberId } = req.params;
      let { date } = req.params;

      if (!barberId) return res.status(400).json({ success: false, message: 'ID do barbeiro é obrigatório' });
      // Verifica autenticação/autorizações: apenas barbeiro dono da agenda ou admin
      if (!req.userId || !req.userRole) return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
      if (req.userRole !== 'admin' && req.userRole !== 'barber') return res.status(403).json({ success: false, message: 'Acesso negado' });
      if (req.userRole === 'barber' && String(req.userId) !== String(barberId)) {
        return res.status(403).json({ success: false, message: 'Barbeiro só pode visualizar sua própria agenda' });
      }
      if (!date) date = new Date().toISOString().split('T')[0];

      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ success: false, message: 'Data inválida' });
      }

      const appointments = await Appointment.findByBarberAndDate(barberId, date);
      if (!appointments || appointments.length === 0) {
        return res.json({ success: true, message: 'Nenhum agendamento para a data selecionada', data: { barberId, date, scheduledAppointments: 0, appointments: [] } });
      }

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

      // Verifica autenticação/autorizações: apenas barbeiro dono da agenda ou admin
      if (!req.userId || !req.userRole) return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
      if (req.userRole !== 'admin' && req.userRole !== 'barber') return res.status(403).json({ success: false, message: 'Acesso negado' });
      if (req.userRole === 'barber' && String(req.userId) !== String(barberId)) {
        return res.status(403).json({ success: false, message: 'Barbeiro só pode visualizar sua própria agenda' });
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