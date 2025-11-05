const Paciente = require('../Models/Paciente');
const { Observable, EVENTS } = require('../Utils/Observer');

class PacienteRepository extends Observable {
  constructor() {
    super();
  }

  async listAll() {
    return Paciente.find().sort({ nombre: 1 }).lean();
  }

  async getById(id) {
    return Paciente.findById(id).lean();
  }

  async create(payload) {
    const p = new Paciente(payload);
    const saved = await p.save();
    const obj = saved.toObject();
    this.notifyObservers(EVENTS.CITA_CREADA || 'PACIENTE_CREADO', obj);
    return obj;
  }

  async update(id, updates) {
    const updated = await Paciente.findByIdAndUpdate(id, updates, { new: true }).lean();
    if (updated) this.notifyObservers('PACIENTE_ACTUALIZADO', updated);
    return updated;
  }

  async delete(id) {
    const removed = await Paciente.findByIdAndDelete(id).lean();
    if (removed) this.notifyObservers('PACIENTE_ELIMINADO', removed);
    return removed;
  }
}

module.exports = PacienteRepository;
