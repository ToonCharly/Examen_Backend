const Medico = require('../Models/Medico');
const { Observable } = require('../Utils/Observer');

class MedicoRepository extends Observable {
  constructor() {
    super();
  }

  async listAll() {
    return Medico.find().sort({ nombre: 1 }).lean();
  }

  async getById(id) {
    return Medico.findById(id).lean();
  }

  async create(payload) {
    const m = new Medico(payload);
    const saved = await m.save();
    const obj = saved.toObject();
    this.notifyObservers('MEDICO_CREADO', obj);
    return obj;
  }

  async update(id, updates) {
    const updated = await Medico.findByIdAndUpdate(id, updates, { new: true }).lean();
    if (updated) this.notifyObservers('MEDICO_ACTUALIZADO', updated);
    return updated;
  }

  async delete(id) {
    const removed = await Medico.findByIdAndDelete(id).lean();
    if (removed) this.notifyObservers('MEDICO_ELIMINADO', removed);
    return removed;
  }
}

module.exports = MedicoRepository;
