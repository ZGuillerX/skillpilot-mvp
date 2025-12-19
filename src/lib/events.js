/**
 * Sistema de eventos personalizado para comunicación entre componentes
 * Permite notificar cuando se actualizan datos importantes
 */

class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }

    off(event, listenerToRemove) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(
            listener => listener !== listenerToRemove
        );
    }

    emit(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(listener => listener(data));
    }
}

const eventEmitter = new EventEmitter();

// Eventos disponibles
export const EVENTS = {
    CHALLENGE_COMPLETED: 'challenge:completed',
    CHALLENGE_SAVED: 'challenge:saved',
    PLAN_CREATED: 'plan:created',
    PLAN_SWITCHED: 'plan:switched',
    PLAN_DELETED: 'plan:deleted',
    PROGRESS_UPDATED: 'progress:updated',
};

export default eventEmitter;
