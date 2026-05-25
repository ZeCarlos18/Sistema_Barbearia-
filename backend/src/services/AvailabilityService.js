const Appointment = require('../models/Appointment');
const Unavailability = require('../models/Unavailability');

class AvailabilityService {
  static async checkSlotAvailability(barberId, date, time) {
    try {
      const occupied = await Appointment.getOccupiedTimes(barberId, date);
      if (occupied.includes(time)) {
        return {
          available: false,
          reason: 'Horário ocupado por agendamento'
        };
      }

      const unavailabilities = await Unavailability.findActiveUnavailabilities(barberId, date, time);
      if (unavailabilities.length > 0) {
        return {
          available: false,
          reason: 'Barbeiro indisponível neste horário'
        };
      }

      return { available: true };
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      throw error;
    }
  }

  static async getAvailableSlots(barberId, date) {
    try {
      const allTimes = [];
      for (let hour = 9; hour < 19; hour++) {
        allTimes.push(`${hour.toString().padStart(2, '0')}:00`);
        allTimes.push(`${hour.toString().padStart(2, '0')}:30`);
      }

      const occupied = await Appointment.getOccupiedTimes(barberId, date);
      const unavailabilities = await Unavailability.findActiveUnavailabilities(barberId, date, '00:00');

      const available = allTimes.filter(time => {
        if (occupied.includes(time)) return false;
        
        return !unavailabilities.some(unav => {
          if (!unav.start_time || !unav.end_time) return true;
          return time >= unav.start_time && time <= unav.end_time;
        });
      });

      return available;
    } catch (error) {
      console.error('Erro ao obter horários disponíveis:', error);
      throw error;
    }
  }
}

module.exports = AvailabilityService;
