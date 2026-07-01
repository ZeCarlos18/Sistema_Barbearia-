const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Unavailability = require('../models/Unavailability');

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
    const allTimes = [];
    for (let hour = 9; hour < 19; hour++) {
      allTimes.push(`${hour.toString().padStart(2, '0')}:00`);
      allTimes.push(`${hour.toString().padStart(2, '0')}:30`);
    }

    // Buscar horários ocupados por agendamentos
    const occupiedTimes = await Appointment.getOccupiedTimes(barberId, date);

    // Buscar indisponibilidades ativas para o barbeiro na data
    const activeUnavs = await Unavailability.findActiveUnavailabilities(barberId, date, null);

    // Se houver indisponibilidade de dia inteiro (start_time NULL AND end_time NULL), não há horários disponíveis
    const hasFullDayBlock = activeUnavs.some(u => u.start_time === null && u.end_time === null);

    let unavailableTimes = [];
    if (!hasFullDayBlock) {
      // Para cada indisponibilidade com horários, marcar slots entre start_time e end_time como indisponíveis
      for (const u of activeUnavs) {
        if (u.start_time && u.end_time) {
          const start = u.start_time.substring(0,5);
          const end = u.end_time.substring(0,5);
          // build times between start and end inclusive
          const [sh, sm] = start.split(':').map(Number);
          const [eh, em] = end.split(':').map(Number);
          let curH = sh, curM = sm;
          while (curH < 24) {
            const curTime = `${String(curH).padStart(2,'0')}:${String(curM).padStart(2,'0')}`;
            unavailableTimes.push(curTime);
            if (curH === eh && curM === em) break;
            curM += 30;
            if (curM >= 60) { curM = 0; curH += 1; }
          }
        }
      }
    }

    // Filtrar horários disponíveis (remover os ocupados e os indisponíveis)
    let availableTimes = [];
    if (hasFullDayBlock) {
      availableTimes = [];
    } else {
      availableTimes = allTimes.filter(time => !occupiedTimes.includes(time) && !unavailableTimes.includes(time));
    }

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