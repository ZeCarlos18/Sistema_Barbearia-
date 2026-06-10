const Waitlist = require('../models/Waitlist');
const Notification = require('../models/Notification');

const TIMEOUT_MINUTES = parseInt(process.env.WAITLIST_TIMEOUT_MINUTES) || 15;

class WaitlistExpiryService {
  static startScheduler() {
    setInterval(async () => {
      try {
        await WaitlistExpiryService.processExpiredOffers();
      } catch (err) {
        console.error('[WaitlistExpiryService] Erro ao processar fila expirada:', err.message);
      }
    }, 60 * 1000);
    console.log(`⏱️  WaitlistExpiryService iniciado (timeout: ${TIMEOUT_MINUTES} min)`);
  }

  static async processExpiredOffers() {
    const expiredEntries = await Waitlist.findExpiredNotified(TIMEOUT_MINUTES);

    for (const entry of expiredEntries) {
      await Waitlist.updateStatus(entry.id, 'expired');

      const dateStr = entry.date instanceof Date
        ? entry.date.toISOString().split('T')[0]
        : String(entry.date);
      const timeStr = typeof entry.time === 'string'
        ? entry.time.substring(0, 5)
        : `${String(entry.time.getHours()).padStart(2, '0')}:${String(entry.time.getMinutes()).padStart(2, '0')}`;

      const next = await Waitlist.getFirstWaiting(entry.barber_id, dateStr, timeStr);
      if (next) {
        await Waitlist.notifyEntry(next.id);
        await Notification.create({
          userId: next.user_id,
          barberId: entry.barber_id,
          type: 'waitlist_notified',
          channel: 'push',
          title: 'Sua vez na fila de espera!',
          message: `O cliente anterior não respondeu a tempo. Você tem ${TIMEOUT_MINUTES} minutos para confirmar o horário das ${timeStr} do dia ${dateStr}.`,
          relatedAppointmentId: null,
          status: 'unread'
        });
      }
    }
  }
}

module.exports = WaitlistExpiryService;
