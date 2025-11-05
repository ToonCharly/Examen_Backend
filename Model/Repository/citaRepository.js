const Cita = require('../Models/Cita');
const { Observable, EVENTS } = require('../Utils/Observer');

class CitaRepository extends Observable {
  constructor() {
    super();
  }

  async listAll() {
    return Cita.find().populate('paciente medico').sort({ fecha: 1, hora: 1 }).lean();
  }

  async getById(id) {
    return Cita.findById(id).populate('paciente medico').lean();
  }

  async create(payload) {
    try {
      const c = new Cita(payload);
      const saved = await c.save();
      const obj = await Cita.findById(saved._id).populate('paciente medico').lean();
      this.notifyObservers(EVENTS.CITA_CREADA, obj);
      return obj;
    } catch (error) {
      if (error && (error.code === 11000 || (error.name === 'MongoServerError' && error.code === 11000))) {
        const err = new Error('Conflicto de horario (medico ya tiene una cita en ese slot)');
        err.code = 'CONFLICT';
        throw err;
      }
      throw error;
    }
  }

  async update(id, updates) {
    try {
      const updated = await Cita.findByIdAndUpdate(id, updates, { new: true }).lean();
      if (updated) this.notifyObservers(EVENTS.CITA_ACTUALIZADA, updated);
      return updated;
    } catch (error) {
      if (error && (error.code === 11000 || (error.name === 'MongoServerError' && error.code === 11000))) {
        const err = new Error('Conflicto de horario al actualizar');
        err.code = 'CONFLICT';
        throw err;
      }
      throw error;
    }
  }

  async delete(id) {
    const removed = await Cita.findByIdAndDelete(id).lean();
    if (removed) this.notifyObservers(EVENTS.CITA_ELIMINADA, removed);
    return removed;
  }

  async findConflict({ medico, fecha, hora, excludeId = null }) {
    const query = { medico, fecha, hora };
    if (excludeId) query._id = { $ne: excludeId };
    return Cita.findOne(query).lean();
  }
}

module.exports = CitaRepository;
