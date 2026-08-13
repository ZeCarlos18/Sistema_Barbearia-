const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Unavailability = require('../models/Unavailability');
const { generateTimeSlots, buildUnavailabilityBlocks } = require('../utils/scheduleHelper');

/**
 * GET /api/available-times?barberId=1&date=2026-05-01
 * Retorna apenas os horários disponíveis para um barbeiro em uma data específica
 */
router.get('/', async (req, res) => {
  try {
    const { barberId, date } = req.query;

    if (!barberId || !date) {
      return res.status(400).json({
        success: false,
        message: 'barberId e date são obrigatórios',
        example: '/api/available-times?barberId=1&date=2026-05-01'
      });
    }

    // Validar formato da data (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Data inválida. Use o formato YYYY-MM-DD'
      });
    }

    // Horários de funcionamento (9h às 19h, de 30 em 30 minutos)
    const allTimes = generateTimeSlots();

    // Buscar horários ocupados por agendamentos
    const occupiedTimes = await Appointment.getOccupiedTimes(barberId, date);

    // Buscar indisponibilidades ativas para o barbeiro na data
    const activeUnavs = await Unavailability.findActiveUnavailabilities(barberId, date, null);

    // Se houver indisponibilidade de dia inteiro, ou marcada por horário, calcula os slots bloqueados
    const { fullDayBlocked: hasFullDayBlock, blockedTimes: unavailableTimes } = buildUnavailabilityBlocks(activeUnavs);

    // Filtrar horários disponíveis (remover os ocupados e os indisponíveis)
    const availableTimes = hasFullDayBlock
      ? []
      : allTimes.filter(time => !occupiedTimes.includes(time) && !unavailableTimes.includes(time));

    res.json({
      success: true,
      data: {
        barberId: parseInt(barberId),
        date,
        availableTimes,
        totalAvailable: availableTimes.length,
        totalSlots: allTimes.length
      }
    });
  } catch (error) {
    console.error('Erro ao buscar horários disponíveis:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar horários disponíveis',
      error: error.message
    });
  }
});

module.exports = router;