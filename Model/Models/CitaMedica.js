const mongoose = require('mongoose');

/**
 * Esquema de Cita Médica
 * Define la estructura de datos para las citas en la base de datos
 */
const citaSchema = new mongoose.Schema({
    // ID de la cita (se genera automáticamente)
    idCita: {
        type: String,
        unique: true,
        required: true
    },
    
    // Información del paciente
    nombrePaciente: {
        type: String,
        required: [true, 'El nombre del paciente es obligatorio'],
        trim: true,
        minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
        maxlength: [100, 'El nombre no puede exceder 100 caracteres']
    },
    
    // Información del médico
    medico: {
        type: String,
        required: [true, 'El médico es obligatorio'],
        trim: true,
        minlength: [2, 'El nombre del médico debe tener al menos 2 caracteres'],
        maxlength: [100, 'El nombre del médico no puede exceder 100 caracteres']
    },
    
    // Fecha de la cita
    fecha: {
        type: Date,
        required: [true, 'La fecha es obligatoria'],
        validate: {
            validator: function(value) {
                // La fecha no puede ser en el pasado
                return value >= new Date().setHours(0, 0, 0, 0);
            },
            message: 'La fecha no puede ser en el pasado'
        }
    },
    
    // Hora de la cita (formato HH:MM)
    hora: {
        type: String,
        required: [true, 'La hora es obligatoria'],
        validate: {
            validator: function(value) {
                // Validar formato HH:MM
                return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
            },
            message: 'La hora debe tener el formato HH:MM'
        }
    },
    
    // Estado de la cita
    estado: {
        type: String,
        enum: {
            values: ['programada', 'confirmada', 'cancelada', 'completada'],
            message: 'Estado inválido. Debe ser: programada, confirmada, cancelada o completada'
        },
        default: 'programada'
    },
    
    // Información adicional opcional
    motivo: {
        type: String,
        trim: true,
        maxlength: [500, 'El motivo no puede exceder 500 caracteres']
    },
    
    // Teléfono del paciente
    telefono: {
        type: String,
        trim: true,
        validate: {
            validator: function(value) {
                if (!value) return true; // Campo opcional
                return /^\d{10}$/.test(value);
            },
            message: 'El teléfono debe tener 10 dígitos'
        }
    },
    
    // Email del paciente
    email: {
        type: String,
        trim: true,
        lowercase: true,
        validate: {
            validator: function(value) {
                if (!value) return true; // Campo opcional
                return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value);
            },
            message: 'Email inválido'
        }
    }
}, {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
    collection: 'citas_medicas'
});

/**
 * Índices para optimizar consultas
 */
// Índice compuesto para evitar citas duplicadas (mismo médico, fecha y hora)
citaSchema.index({ medico: 1, fecha: 1, hora: 1 }, { 
    unique: true,
    partialFilterExpression: { estado: { $ne: 'cancelada' } }
});

// Índice para búsquedas por paciente
citaSchema.index({ nombrePaciente: 1 });

// Índice para búsquedas por fecha
citaSchema.index({ fecha: 1 });

/**
 * Middleware pre-save para generar ID único
 */
citaSchema.pre('save', function(next) {
    if (!this.idCita) {
        // Generar ID único basado en timestamp y número aleatorio
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        this.idCita = `CITA-${timestamp}-${random}`.toUpperCase();
    }
    next();
});

/**
 * Métodos de instancia
 */
citaSchema.methods.toJSON = function() {
    const citaObject = this.toObject();
    
    // Formatear fecha para mejor legibilidad
    if (citaObject.fecha) {
        citaObject.fechaFormateada = citaObject.fecha.toLocaleDateString('es-ES');
    }
    
    return citaObject;
};

/**
 * Métodos estáticos
 */
citaSchema.statics.buscarPorPaciente = function(nombrePaciente) {
    return this.find({ 
        nombrePaciente: new RegExp(nombrePaciente, 'i'),
        estado: { $ne: 'cancelada' }
    }).sort({ fecha: 1, hora: 1 });
};

citaSchema.statics.buscarPorMedico = function(medico) {
    return this.find({ 
        medico: new RegExp(medico, 'i'),
        estado: { $ne: 'cancelada' }
    }).sort({ fecha: 1, hora: 1 });
};

citaSchema.statics.buscarPorFecha = function(fecha) {
    const fechaInicio = new Date(fecha);
    fechaInicio.setHours(0, 0, 0, 0);
    
    const fechaFin = new Date(fecha);
    fechaFin.setHours(23, 59, 59, 999);
    
    return this.find({
        fecha: { $gte: fechaInicio, $lte: fechaFin },
        estado: { $ne: 'cancelada' }
    }).sort({ hora: 1 });
};

const CitaMedica = mongoose.model('CitaMedica', citaSchema);

module.exports = CitaMedica;