// src/utils/dateHelper.js

/**
 * Verifica se um agendamento já passou em relação ao relógio atual do sistema.
 * @param {string} dateString - Data no formato YYYY-MM-DD
 * @param {string} timeString - Hora no formato HH:mm ou HH:mm:ss
 * @returns {boolean} - Retorna true se o momento já ficou no passado
 */

export const isPastAppointment = (dateString, timeString) => {
    if (!dateString) return false;


    const cleanDate = String(dateString).trim().substring(0, 10);
    const cleanTime = timeString ? String(timeString).trim().substring(0, 8) : "00:00:00";
    const appointmentDateTime = new Date(`${cleanDate}T${cleanTime}`);

    if (isNaN(appointmentDateTime.getTime())) return false;

    return appointmentDateTime < new Date();
};

/**
 * Formata uma data do formato de banco de dados (YYYY-MM-DD) para o padrão (DD/MM/YYYY)
 * @param {string} dateString - Data no formato YYYY-MM-DD
 * @returns {string} - Data formatada
 */
export const formatDateBR = (dateString) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
};

/**
 * Verifica se uma determinada data corresponde ao dia de hoje
 * @param {string} dateString - Data no formato YYYY-MM-DD
 * @returns {boolean} - Retorna true se for hoje
 */
export const isToday = (dateString) => {
    if (!dateString) return false;

    const today = new Date();
    const targetDate = new Date(`${dateString}T00:00:00`);

    return (
        targetDate.getDate() === today.getDate() &&
        targetDate.getMonth() === today.getMonth() &&
        targetDate.getFullYear() === today.getFullYear()
    );
};
