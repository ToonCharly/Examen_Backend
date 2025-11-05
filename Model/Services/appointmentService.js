const AppointmentRepository = require('../Repository/appointmentRepository');
const { Observable, EVENTS } = require('../Utils/Observer');
const moment = require('moment');

/**
 * AppointmentService (Backend)
 * - Contiene la lógica de negocio y validaciones del backend.
 * - Notifica cambios mediante el patrón Observer (útil para WebSocket/Events).
 * Nota: El "ViewModel" es responsabilidad del frontend en MVVM; aquí exponemos
 * un service backend que la API o sockets pueden usar para gestionar citas.
 */
class AppointmentService extends Observable {
  constructor(repo = null) {
    super();
    this.repo = repo || new AppointmentRepository();

    // Re-enviar eventos del repositorio a los observadores del service
    this.repo.addObserver({
      update: (event, data) => this.notifyObservers(event, data),
    });
  }

  async list() {
    return this.repo.listAll();
  }

  async get(appointmentId) {
    return this.repo.getById(appointmentId);
  }

  _normalizeDate(date) {
    // Accept date strings like 'YYYY-MM-DD' or Date objects and normalize to midnight UTC
    return moment(date).startOf('day').toDate();
  }

  async create(payload) {
    const { patientName, doctorName, date, time } = payload;
    if (!patientName || !doctorName || !date || !time) {
      const err = new Error('Campos requeridos: patientName, doctorName, date, time');
      err.code = 'VALIDATION_ERROR';
      this.notifyObservers(EVENTS.ERROR_VALIDACION, { error: err.message });
      throw err;
    }

    const normalizedDate = this._normalizeDate(date);

    // Check conflict for same doctor/date/time
    const conflict = await this.repo.findConflict({ doctorName, date: normalizedDate, time });
    if (conflict) {
      this.notifyObservers(EVENTS.CONFLICTO_HORARIO, { conflict });
      const err = new Error('Conflicto de horario: el doctor ya tiene una cita en ese horario');
      err.code = 'CONFLICT';
      throw err;
    }

    const toCreate = {
      patientName,
      doctorName,
      date: normalizedDate,
      time,
      status: 'scheduled',
    };

    return this.repo.create(toCreate);
  }

  async update(appointmentId, updates) {
    // If doctor/date/time change, validate conflicts
    const existing = await this.repo.getById(appointmentId);
    if (!existing) {
      const err = new Error('Cita no encontrada');
      err.code = 'NOT_FOUND';
      throw err;
    }

    const doctorName = updates.doctorName || existing.doctorName;
    const date = updates.date ? this._normalizeDate(updates.date) : this._normalizeDate(existing.date);
    const time = updates.time || existing.time;

    const conflict = await this.repo.findConflict({ doctorName, date, time, excludeAppointmentId: appointmentId });
    if (conflict) {
      this.notifyObservers(EVENTS.CONFLICTO_HORARIO, { conflict });
      const err = new Error('Conflicto de horario al actualizar');
      err.code = 'CONFLICT';
      throw err;
    }

    const updatesToSave = { ...updates };
    if (updates.date) updatesToSave.date = date;

    return this.repo.update(appointmentId, updatesToSave);
  }

  async cancel(appointmentId) {
    const cancelled = await this.repo.cancel(appointmentId);
    this.notifyObservers(EVENTS.CITA_CANCELADA, cancelled);
    return cancelled;
  }

  async delete(appointmentId) {
    return this.repo.delete(appointmentId);
  }
}

module.exports = AppointmentService;
