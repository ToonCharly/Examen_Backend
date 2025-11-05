const Appointment = require('../Models/Appointment');
const { Observable, EVENTS } = require('../Utils/Observer');

class AppointmentRepository extends Observable {
  constructor() {
    super();
  }

  async listAll() {
    return Appointment.find().sort({ date: 1, time: 1 }).lean();
  }

  async getById(appointmentId) {
    return Appointment.findOne({ appointmentId }).lean();
  }

  async create(payload) {
    const appt = new Appointment(payload);
    const saved = await appt.save();
    const obj = saved.toObject();
    this.notifyObservers(EVENTS.CITA_CREADA, obj);
    return obj;
  }

  async update(appointmentId, updates) {
    const updated = await Appointment.findOneAndUpdate({ appointmentId }, updates, { new: true }).lean();
    if (updated) this.notifyObservers(EVENTS.CITA_ACTUALIZADA, updated);
    return updated;
  }

  async delete(appointmentId) {
    const removed = await Appointment.findOneAndDelete({ appointmentId }).lean();
    if (removed) this.notifyObservers(EVENTS.CITA_ELIMINADA, removed);
    return removed;
  }

  async cancel(appointmentId) {
    return this.update(appointmentId, { status: 'cancelled' });
  }

  /**
   * Find an appointment for the given doctor/date/time. Optionally exclude an appointmentId
   */
  async findConflict({ doctorName, date, time, excludeAppointmentId = null }) {
    const query = {
      doctorName,
      date,
      time,
    };
    if (excludeAppointmentId) query.appointmentId = { $ne: excludeAppointmentId };
    return Appointment.findOne(query).lean();
  }
}

module.exports = AppointmentRepository;
