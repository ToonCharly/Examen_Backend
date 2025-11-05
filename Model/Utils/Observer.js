class Observable {
    constructor() {
        this.observers = [];
    }

    /**
     * Registra un observer para recibir notificaciones
     * @param {Object} observer - Objeto que implementa el método update
     */
    addObserver(observer) {
        if (observer && typeof observer.update === 'function') {
            this.observers.push(observer);
            console.log('🔔 Observer agregado:', observer.constructor.name);
        } else {
            throw new Error('Observer debe implementar el método update()');
        }
    }

    /**
     * Remueve un observer de la lista de notificaciones
     * @param {Object} observer - Observer a remover
     */
    removeObserver(observer) {
        const index = this.observers.indexOf(observer);
        if (index > -1) {
            this.observers.splice(index, 1);
            console.log('🔕 Observer removido:', observer.constructor.name);
        }
    }

    /**
     * Notifica a todos los observers registrados
     * @param {string} event - Tipo de evento
     * @param {Object} data - Datos del evento
     */
    notifyObservers(event, data = null) {
        console.log(`📢 Notificando evento: ${event} a ${this.observers.length} observers`);
        
        this.observers.forEach(observer => {
            try {
                observer.update(event, data);
            } catch (error) {
                console.error('❌ Error notificando a observer:', error.message);
            }
        });
    }

    /**
     * Obtiene la cantidad de observers registrados
     * @returns {number} Cantidad de observers
     */
    getObserversCount() {
        return this.observers.length;
    }
}

/**
 * Enumeración de eventos del sistema
 */
const EVENTS = {
    CITA_CREADA: 'CITA_CREADA',
    CITA_ACTUALIZADA: 'CITA_ACTUALIZADA',
    CITA_CANCELADA: 'CITA_CANCELADA',
    CITA_ELIMINADA: 'CITA_ELIMINADA',
    CONFLICTO_HORARIO: 'CONFLICTO_HORARIO',
    ERROR_VALIDACION: 'ERROR_VALIDACION',
    SISTEMA_INICIADO: 'SISTEMA_INICIADO'
};

module.exports = {
    Observable,
    EVENTS
};