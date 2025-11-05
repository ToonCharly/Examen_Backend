const mongoose = require('mongoose');

const MedicoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    especialidad: { type: String, trim: true },
    telefono: { type: String, trim: true },
    correo: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Medico', MedicoSchema);
