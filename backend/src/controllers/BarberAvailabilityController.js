const BarberAvailability = require('../models/BarberAvailability');

class BarberAvailabilityController {
  static async updateSchedule(req, res) {
    try {
      const { barberId } = req.params;
      const { availableDays, startTime, endTime } = req.body;

      if (!barberId) {
        return res.status(400).json({
          success: false,
          message: 'barberId é obrigatório'
        });
      }

      await BarberAvailability.setSchedule(barberId, {
        availableDays,
        startTime,
        endTime
      });

      const schedule = await BarberAvailability.getSchedule(barberId);

      res.json({
        success: true,
        message: 'Horários de funcionamento atualizados',
        data: schedule
      });
    } catch (error) {
      console.error('Erro ao atualizar horários:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar horários',
        error: error.message
      });
    }
  }

  static async getSchedule(req, res) {
    try {
      const { barberId } = req.params;

      if (!barberId) {
        return res.status(400).json({
          success: false,
          message: 'barberId é obrigatório'
        });
      }

      const schedule = await BarberAvailability.getSchedule(barberId);

      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: 'Barbeiro não encontrado'
        });
      }

      res.json({
        success: true,
        data: schedule
      });
    } catch (error) {
      console.error('Erro ao buscar horários:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar horários',
        error: error.message
      });
    }
  }
}

module.exports = BarberAvailabilityController;
