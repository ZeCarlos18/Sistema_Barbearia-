const pool = require('../database');
const User = require('../models/User');
const Appointment = require('../models/Appointment');

class BarberService {
  static async getAdminBarberList() {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(`
        SELECT u.id,
               u.name,
               u.email,
               u.phone,
               u.role,
               u.active,
               u.created_at,
               COUNT(a.id) AS total_appointments,
               SUM(a.status = 'completed') AS completed_appointments,
               SUM(a.status = 'confirmed') AS confirmed_appointments,
               SUM(a.status = 'pending') AS pending_appointments,
               SUM(a.status = 'cancelled') AS cancelled_appointments,
               COALESCE(SUM(CASE WHEN a.status = 'completed' THEN a.price ELSE 0 END), 0) AS total_revenue
        FROM users u
        LEFT JOIN appointments a ON a.barber_id = u.id
        WHERE u.role = 'barber'
        GROUP BY u.id
        ORDER BY u.name ASC
      `);

      return rows.map(barber => ({
        id: barber.id,
        name: barber.name,
        email: barber.email,
        phone: barber.phone,
        active: Boolean(barber.active),
        createdAt: barber.created_at,
        totalAppointments: Number(barber.total_appointments || 0),
        completedAppointments: Number(barber.completed_appointments || 0),
        confirmedAppointments: Number(barber.confirmed_appointments || 0),
        pendingAppointments: Number(barber.pending_appointments || 0),
        cancelledAppointments: Number(barber.cancelled_appointments || 0),
        totalRevenue: Number(barber.total_revenue || 0)
      }));
    } finally {
      connection.release();
    }
  }

  static async getBarberDetails(id) {
    const barber = await User.findById(id);
    if (!barber || barber.role !== 'barber') {
      return null;
    }

    const appointments = await Appointment.findByBarberId(id);

    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(apt => apt.status === 'completed');
    const confirmedAppointments = appointments.filter(apt => apt.status === 'confirmed');
    const pendingAppointments = appointments.filter(apt => apt.status === 'pending');
    const cancelledAppointments = appointments.filter(apt => apt.status === 'cancelled');

    const totalRevenue = completedAppointments.reduce((acc, apt) => {
      const price = Number(apt.service_price ?? apt.price ?? 0);
      return acc + (Number.isFinite(price) ? price : 0);
    }, 0);

    const schedule = appointments
      .filter(apt => apt.status !== 'cancelled')
      .filter(apt => {
        const now = new Date();
        const aptDate = new Date(`${apt.date}T${apt.time}`);
        return aptDate >= now;
      })
      .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))
      .slice(0, 20);

    const chartData = {
      appointmentsByStatus: {
        completed: completedAppointments.length,
        confirmed: confirmedAppointments.length,
        pending: pendingAppointments.length,
        cancelled: cancelledAppointments.length
      },
      revenueByDate: {},
      cutsByDate: {}
    };

    const revenueMap = new Map();
    const cutsMap = new Map();

    completedAppointments.forEach(apt => {
      const dateKey = typeof apt.date === 'object'
        ? apt.date.toISOString().split('T')[0]
        : apt.date;
      const price = Number(apt.service_price ?? apt.price ?? 0);
      revenueMap.set(dateKey, (revenueMap.get(dateKey) || 0) + (Number.isFinite(price) ? price : 0));
      cutsMap.set(dateKey, (cutsMap.get(dateKey) || 0) + 1);
    });

    Array.from(revenueMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).forEach(([date, value]) => {
      chartData.revenueByDate[date] = Number(value.toFixed(2));
    });

    Array.from(cutsMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).forEach(([date, value]) => {
      chartData.cutsByDate[date] = value;
    });

    return {
      barber: {
        id: barber.id,
        name: barber.name,
        email: barber.email,
        phone: barber.phone,
        role: barber.role,
        active: Boolean(barber.active),
        createdAt: barber.created_at
      },
      statistics: {
        totalAppointments,
        completedAppointments: completedAppointments.length,
        confirmedAppointments: confirmedAppointments.length,
        pendingAppointments: pendingAppointments.length,
        cancelledAppointments: cancelledAppointments.length,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        cutsPerformed: completedAppointments.length
      },
      schedule: schedule.map(apt => ({
        id: apt.id,
        userId: apt.user_id,
        userName: apt.user_name,
        serviceName: apt.service_name,
        date: apt.date,
        time: apt.time,
        status: apt.status,
        price: Number(apt.service_price ?? apt.price ?? 0)
      })),
      chartData
    };
  }

  static async deactivateBarber(id) {
    const barber = await User.findById(id);
    if (!barber || barber.role !== 'barber') {
      return null;
    }

    const updated = await User.updateActive(id, false);
    if (!updated) {
      return null;
    }

    return { id, active: false };
  }
}

module.exports = BarberService;
