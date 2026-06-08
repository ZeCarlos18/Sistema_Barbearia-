const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const ReminderSetting = require('../models/ReminderSetting');

class ReminderService {
  static parseDateTime(dateValue, timeValue) {
    const dateString = typeof dateValue === 'string'
      ? dateValue
      : dateValue instanceof Date
        ? dateValue.toISOString().split('T')[0]
        : null;

    const timeString = typeof timeValue === 'string'
      ? timeValue
      : timeValue instanceof Date
        ? timeValue.toTimeString().slice(0, 5)
        : null;

    if (!dateString || !timeString) return null;

    const fullDateTime = `${dateString}T${timeString.length === 5 ? `${timeString}:00` : timeString}`;
    const appointmentDateTime = new Date(fullDateTime);
    return Number.isNaN(appointmentDateTime.getTime()) ? null : appointmentDateTime;
  }

  static async getSettings() {
    let settings = await ReminderSetting.find();
    if (!settings) {
      settings = await ReminderSetting.createDefault();
    }

    return {
      leadTimeMinutes: Number(settings.lead_time_minutes) || Number(process.env.REMINDER_LEAD_TIME_MINUTES) || 60,
      channel: settings.channel || process.env.REMINDER_CHANNEL || 'email'
    };
  }

  static async scanAndSendReminders() {
    try {
      const settings = await this.getSettings();
      const now = new Date();
      const lookAhead = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const appointments = await Appointment.findConfirmedBetween(
        this.toMySQLDateTime(now),
        this.toMySQLDateTime(lookAhead)
      );

      for (const appointment of appointments) {
        const appointmentDateTime = this.parseDateTime(appointment.date, appointment.time);
        if (!appointmentDateTime) continue;

        const minutesUntilAppointment = Math.round((appointmentDateTime - now) / (1000 * 60));
        if (minutesUntilAppointment < 0 || minutesUntilAppointment > settings.leadTimeMinutes) {
          continue;
        }

        const alreadySent = await Notification.findByAppointmentIdAndType(appointment.id, 'reminder');
        if (alreadySent) continue;

        await this.sendReminder(appointment, settings);
      }
    } catch (error) {
      console.error('[ReminderService] Erro ao enviar lembretes:', error);
    }
  }

  static async sendReminder(appointment, settings) {
    const title = 'Lembrete de Agendamento';
    const appointmentDate = typeof appointment.date === 'object'
      ? appointment.date.toISOString().split('T')[0]
      : appointment.date;
    const message = `Seu agendamento para ${appointment.service_name} com ${appointment.barber_name} está marcado para ${appointmentDate} às ${appointment.time}.`; 
    const channel = ['email', 'push'].includes(settings.channel) ? settings.channel : 'push';

    await Notification.create({
      userId: appointment.user_id,
      barberId: appointment.barber_id,
      type: 'reminder',
      channel,
      title,
      message,
      relatedAppointmentId: appointment.id,
      status: 'unread'
    });

    if (channel === 'email' && appointment.user_email) {
      this.sendEmail(appointment.user_email, title, message);
    } else {
      this.sendPush(appointment.user_id, title, message);
    }
  }

  static sendEmail(email, title, message) {
    console.log(`📧 [REMINDER EMAIL] Para: ${email} | Título: ${title} | Mensagem: ${message}`);
  }

  static sendPush(userId, title, message) {
    console.log(`📲 [REMINDER PUSH] Para usuário ${userId} | Título: ${title} | Mensagem: ${message}`);
  }

  static toMySQLDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  static startScheduler() {
    this.scanAndSendReminders();
    setInterval(() => this.scanAndSendReminders(), 60 * 1000);
  }
}

module.exports = ReminderService;
