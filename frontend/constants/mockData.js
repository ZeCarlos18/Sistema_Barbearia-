/**
 * Dados mockados para desenvolvimento
 * Estes dados simulam o que virá da API no futuro
 */

/**
 * Dados simulados do barbeiro
 * @type {Object}
 */
export const mockBarberData = {
  id: 1,
  name: "Lucas",
  avatar: "https://i.pravatar.cc/150?img=12", // Avatar aleatório para testes
  totalAppointmentsToday: 8,
  dailyProfit: 120,
  remainingAppointments: 4
};

/**
 * Agendamentos simulados para hoje
 * Em ordem cronológica (importante para UX)
 * @type {Array<Object>}
 */
export const mockTodaySchedule = [
  {
    id: 1,
    time: "14:00",
    clientName: "João Silva",
    service: "Corte social"
  },
  {
    id: 2,
    time: "14:40",
    clientName: "Marcos",
    service: "Corte degradê"
  },
  {
    id: 3,
    time: "15:20",
    clientName: "Vinícius",
    service: "Barba"
  },
  {
    id: 4,
    time: "16:00",
    clientName: "Paulo",
    service: "Corte social"
  }
];