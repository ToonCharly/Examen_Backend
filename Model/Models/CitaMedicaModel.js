const CitaMedica = require('./CitaMedica');
const { Observable, EVENTS } = require('../Utils/Observer');

/**
 * Modelo de Citas Médicas
 * Esta clase maneja todas las operaciones de datos y notifica a los observers
 * Implementa el patrón Repository para abstraer el acceso a datos
 */
class CitaMedicaModel extends Observable {
    constructor() {
        super();
        this.citas = [];
        console.log('📋 Modelo de Citas Médicas inicializado');
    }

    /**
     * Crear una nueva cita médica
     * @param {Object} datoCita - Datos de la cita
     * @returns {Object} Cita creada
     */
    async crearCita(datoCita) {
        try {
            console.log('🏥 Creando nueva cita médica...');
            
            // Validar conflictos de horario antes de crear
            await this.validarConflictoHorario(datoCita.medico, datoCita.fecha, datoCita.hora);
            
            // Crear la cita en la base de datos
            const nuevaCita = new CitaMedica(datoCita);
            const citaGuardada = await nuevaCita.save();
            
            console.log(`✅ Cita creada exitosamente: ${citaGuardada.idCita}`);
            
            // Notificar a los observers
            this.notifyObservers(EVENTS.CITA_CREADA, citaGuardada);
            
            return citaGuardada;
        } catch (error) {
            console.error('❌ Error al crear cita:', error.message);
            this.notifyObservers(EVENTS.ERROR_VALIDACION, { 
                error: error.message,
                datos: datoCita 
            });
            throw error;
        }
    }

    /**
     * Obtener todas las citas
     * @param {Object} filtros - Filtros opcionales
     * @returns {Array} Lista de citas
     */
    async obtenerCitas(filtros = {}) {
        try {
            console.log('📄 Obteniendo citas médicas...');
            
            let query = CitaMedica.find();
            
            // Aplicar filtros si existen
            if (filtros.estado) {
                query = query.where('estado').equals(filtros.estado);
            }
            
            if (filtros.medico) {
                query = query.where('medico').regex(new RegExp(filtros.medico, 'i'));
            }
            
            if (filtros.fechaDesde || filtros.fechaHasta) {
                const fechaFiltro = {};
                if (filtros.fechaDesde) {
                    fechaFiltro.$gte = new Date(filtros.fechaDesde);
                }
                if (filtros.fechaHasta) {
                    fechaFiltro.$lte = new Date(filtros.fechaHasta);
                }
                query = query.where('fecha').equals(fechaFiltro);
            }
            
            const citas = await query.sort({ fecha: 1, hora: 1 }).exec();
            
            console.log(`📊 Se encontraron ${citas.length} citas`);
            return citas;
        } catch (error) {
            console.error('❌ Error al obtener citas:', error.message);
            throw error;
        }
    }

    /**
     * Obtener una cita por ID
     * @param {string} idCita - ID de la cita
     * @returns {Object} Cita encontrada
     */
    async obtenerCitaPorId(idCita) {
        try {
            console.log(`🔍 Buscando cita con ID: ${idCita}`);
            
            const cita = await CitaMedica.findOne({ idCita });
            
            if (!cita) {
                throw new Error(`No se encontró cita con ID: ${idCita}`);
            }
            
            console.log(`✅ Cita encontrada: ${cita.nombrePaciente}`);
            return cita;
        } catch (error) {
            console.error('❌ Error al buscar cita:', error.message);
            throw error;
        }
    }

    /**
     * Actualizar una cita existente
     * @param {string} idCita - ID de la cita
     * @param {Object} datosActualizacion - Datos a actualizar
     * @returns {Object} Cita actualizada
     */
    async actualizarCita(idCita, datosActualizacion) {
        try {
            console.log(`📝 Actualizando cita: ${idCita}`);
            
            // Si se actualiza médico, fecha u hora, validar conflictos
            if (datosActualizacion.medico || datosActualizacion.fecha || datosActualizacion.hora) {
                const citaActual = await this.obtenerCitaPorId(idCita);
                
                const medico = datosActualizacion.medico || citaActual.medico;
                const fecha = datosActualizacion.fecha || citaActual.fecha;
                const hora = datosActualizacion.hora || citaActual.hora;
                
                await this.validarConflictoHorario(medico, fecha, hora, idCita);
            }
            
            const citaActualizada = await CitaMedica.findOneAndUpdate(
                { idCita },
                datosActualizacion,
                { new: true, runValidators: true }
            );
            
            if (!citaActualizada) {
                throw new Error(`No se encontró cita con ID: ${idCita}`);
            }
            
            console.log(`✅ Cita actualizada exitosamente: ${idCita}`);
            
            // Notificar a los observers
            this.notifyObservers(EVENTS.CITA_ACTUALIZADA, citaActualizada);
            
            return citaActualizada;
        } catch (error) {
            console.error('❌ Error al actualizar cita:', error.message);
            this.notifyObservers(EVENTS.ERROR_VALIDACION, { 
                error: error.message,
                idCita 
            });
            throw error;
        }
    }

    /**
     * Cancelar una cita
     * @param {string} idCita - ID de la cita
     * @returns {Object} Cita cancelada
     */
    async cancelarCita(idCita) {
        try {
            console.log(`❌ Cancelando cita: ${idCita}`);
            
            const citaCancelada = await CitaMedica.findOneAndUpdate(
                { idCita },
                { estado: 'cancelada' },
                { new: true }
            );
            
            if (!citaCancelada) {
                throw new Error(`No se encontró cita con ID: ${idCita}`);
            }
            
            console.log(`✅ Cita cancelada exitosamente: ${idCita}`);
            
            // Notificar a los observers
            this.notifyObservers(EVENTS.CITA_CANCELADA, citaCancelada);
            
            return citaCancelada;
        } catch (error) {
            console.error('❌ Error al cancelar cita:', error.message);
            throw error;
        }
    }

    /**
     * Eliminar una cita permanentemente
     * @param {string} idCita - ID de la cita
     * @returns {boolean} Resultado de la eliminación
     */
    async eliminarCita(idCita) {
        try {
            console.log(`🗑️ Eliminando cita: ${idCita}`);
            
            const citaEliminada = await CitaMedica.findOneAndDelete({ idCita });
            
            if (!citaEliminada) {
                throw new Error(`No se encontró cita con ID: ${idCita}`);
            }
            
            console.log(`✅ Cita eliminada exitosamente: ${idCita}`);
            
            // Notificar a los observers
            this.notifyObservers(EVENTS.CITA_ELIMINADA, { idCita, cita: citaEliminada });
            
            return true;
        } catch (error) {
            console.error('❌ Error al eliminar cita:', error.message);
            throw error;
        }
    }

    /**
     * Validar conflictos de horario
     * @param {string} medico - Nombre del médico
     * @param {Date} fecha - Fecha de la cita
     * @param {string} hora - Hora de la cita
     * @param {string} excluirId - ID de cita a excluir (para actualizaciones)
     */
    async validarConflictoHorario(medico, fecha, hora, excluirId = null) {
        const fechaConsulta = new Date(fecha);
        fechaConsulta.setHours(0, 0, 0, 0);
        
        const fechaFin = new Date(fecha);
        fechaFin.setHours(23, 59, 59, 999);
        
        const query = {
            medico,
            fecha: { $gte: fechaConsulta, $lte: fechaFin },
            hora,
            estado: { $ne: 'cancelada' }
        };
        
        if (excluirId) {
            query.idCita = { $ne: excluirId };
        }
        
        const citaExistente = await CitaMedica.findOne(query);
        
        if (citaExistente) {
            const error = `Conflicto de horario: El médico ${medico} ya tiene una cita el ${fecha.toLocaleDateString()} a las ${hora}`;
            this.notifyObservers(EVENTS.CONFLICTO_HORARIO, {
                error,
                citaExistente,
                datosNuevos: { medico, fecha, hora }
            });
            throw new Error(error);
        }
    }

    /**
     * Obtener estadísticas de citas
     * @returns {Object} Estadísticas
     */
    async obtenerEstadisticas() {
        try {
            const estadisticas = await CitaMedica.aggregate([
                {
                    $group: {
                        _id: '$estado',
                        cantidad: { $sum: 1 }
                    }
                }
            ]);
            
            const total = await CitaMedica.countDocuments();
            
            const resultado = {
                total,
                porEstado: estadisticas.reduce((acc, stat) => {
                    acc[stat._id] = stat.cantidad;
                    return acc;
                }, {})
            };
            
            console.log('📊 Estadísticas obtenidas:', resultado);
            return resultado;
        } catch (error) {
            console.error('❌ Error al obtener estadísticas:', error.message);
            throw error;
        }
    }
}

module.exports = CitaMedicaModel;