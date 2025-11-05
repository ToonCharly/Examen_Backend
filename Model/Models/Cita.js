const mongoose = require('mongoose');

const CitaSchema = new mongoose.Schema(
  {
    paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'Paciente', required: true },
    medico: { type: mongoose.Schema.Types.ObjectId, ref: 'Medico', required: true },
    fecha: { type: Date, required: true },
    hora: { type: String, required: true },
    estado: { type: String, default: 'Programada', enum: ['Programada', 'Cancelada', 'Completada'] },
  },
  { timestamps: true }
);

// Unique index to prevent same medico having two citas at same fecha+hora
CitaSchema.index({ medico: 1, fecha: 1, hora: 1 }, { unique: true });

module.exports = mongoose.model('Cita', CitaSchema);
