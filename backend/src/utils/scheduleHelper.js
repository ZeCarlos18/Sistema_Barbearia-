const BUSINESS_START_HOUR = 9;
const BUSINESS_END_HOUR = 19;

/**
 * Normaliza um valor de horário vindo do MySQL (string "HH:MM:SS" ou objeto Date/TIME)
 * para o formato "HH:MM".
 */
function normalizeTimeValue(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value.substring(0, 5);
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Gera a grade de horários de funcionamento da barbearia (9h às 19h, de 30 em 30 minutos)
 */
function generateTimeSlots() {
  const slots = [];
  for (let hour = BUSINESS_START_HOUR; hour < BUSINESS_END_HOUR; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  return slots;
}

/**
 * Constrói a lista de horários bloqueados por indisponibilidades ativas (RF12) de um barbeiro.
 * Retorna { fullDayBlocked, blockedTimes }.
 */
function buildUnavailabilityBlocks(activeUnavailabilities) {
  const fullDayBlocked = activeUnavailabilities.some(
    (u) => u.start_time === null && u.end_time === null
  );

  const blockedTimes = [];
  if (!fullDayBlocked) {
    for (const u of activeUnavailabilities) {
      if (u.start_time && u.end_time) {
        const start = normalizeTimeValue(u.start_time);
        const end = normalizeTimeValue(u.end_time);
        if (!start || !end) continue;
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
}

module.exports = {
  BUSINESS_START_HOUR,
  BUSINESS_END_HOUR,
  normalizeTimeValue,
  generateTimeSlots,
  buildUnavailabilityBlocks
};
