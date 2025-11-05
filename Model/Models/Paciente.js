const mongoose = require('mongoose');

const PacienteSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    telefono: { type: String, trim: true },
    correo: { type: String, trim: true },
    fecha_registro: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Paciente', PacienteSchema);
