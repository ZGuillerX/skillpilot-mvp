/**
 * Utilidades para tracking de analíticas de usuario
 * Recopila métricas de uso sin enviar datos a terceros
 */

class Analytics {
    constructor() {
        this.events = [];
        this.sessionStart = Date.now();
    }

    /**
     * Registra un evento
     * @param {string} category - Categoría del evento (challenge, plan, profile)
     * @param {string} action - Acción realizada (started, completed, failed)
     * @param {object} metadata - Datos adicionales
     */
    track(category, action, metadata = {}) {
        const event = {
            category,
            action,
            metadata,
            timestamp: Date.now(),
            sessionDuration: Date.now() - this.sessionStart,
        };

        this.events.push(event);

        // Mantener solo los últimos 100 eventos
        if (this.events.length > 100) {
            this.events.shift();
        }

        console.log(`📊 Analytics: ${category}.${action}`, metadata);
    }

    /**
     * Obtiene estadísticas de la sesión actual
     */
    getSessionStats() {
        const stats = {
            duration: Date.now() - this.sessionStart,
            totalEvents: this.events.length,
            eventsByCategory: {},
            eventsByAction: {},
        };

        this.events.forEach(event => {
            stats.eventsByCategory[event.category] =
                (stats.eventsByCategory[event.category] || 0) + 1;
            stats.eventsByAction[event.action] =
                (stats.eventsByAction[event.action] || 0) + 1;
        });

        return stats;
    }

    /**
     * Obtiene métricas específicas de retos
     */
    getChallengeMetrics() {
        const challengeEvents = this.events.filter(e => e.category === 'challenge');

        const metrics = {
            started: 0,
            completed: 0,
            failed: 0,
            hintsUsed: 0,
            averageAttempts: 0,
            averageTimeMinutes: 0,
            languagesUsed: new Set(),
            difficultiesAttempted: new Set(),
        };

        let totalAttempts = 0;
        let totalTime = 0;
        let completedChallenges = 0;

        challengeEvents.forEach(event => {
            if (event.action === 'started') metrics.started++;
            if (event.action === 'completed') {
                metrics.completed++;
                completedChallenges++;
                if (event.metadata.attempts) totalAttempts += event.metadata.attempts;
                if (event.metadata.timeSpent) totalTime += event.metadata.timeSpent;
            }
            if (event.action === 'failed') metrics.failed++;
            if (event.action === 'hint_revealed') metrics.hintsUsed++;

            if (event.metadata.language) metrics.languagesUsed.add(event.metadata.language);
            if (event.metadata.difficulty) metrics.difficultiesAttempted.add(event.metadata.difficulty);
        });

        if (completedChallenges > 0) {
            metrics.averageAttempts = (totalAttempts / completedChallenges).toFixed(1);
            metrics.averageTimeMinutes = (totalTime / completedChallenges / 60000).toFixed(1);
        }

        metrics.languagesUsed = Array.from(metrics.languagesUsed);
        metrics.difficultiesAttempted = Array.from(metrics.difficultiesAttempted);

        return metrics;
    }

    /**
     * Obtiene métricas de tiempo de uso
     */
    getTimeMetrics() {
        const now = Date.now();
        const sessionDuration = now - this.sessionStart;

        return {
            sessionStartedAt: new Date(this.sessionStart).toISOString(),
            sessionDurationMinutes: (sessionDuration / 60000).toFixed(1),
            eventsPerMinute: (this.events.length / (sessionDuration / 60000)).toFixed(2),
        };
    }

    /**
     * Exporta todas las analíticas
     */
    exportData() {
        return {
            session: this.getSessionStats(),
            time: this.getTimeMetrics(),
            challenges: this.getChallengeMetrics(),
            rawEvents: this.events,
        };
    }

    /**
     * Limpia los eventos antiguos
     */
    clear() {
        this.events = [];
        console.log('🗑️ Analytics cleared');
    }
}

// Instancia singleton
const analytics = new Analytics();

// Helpers para eventos comunes
export const trackChallengeStarted = (challengeId, language, difficulty) => {
    analytics.track('challenge', 'started', { challengeId, language, difficulty });
};

export const trackChallengeCompleted = (challengeId, score, attempts, timeSpent, hintsUsed) => {
    analytics.track('challenge', 'completed', {
        challengeId,
        score,
        attempts,
        timeSpent,
        hintsUsed
    });
};

export const trackChallengeFailed = (challengeId, attempts) => {
    analytics.track('challenge', 'failed', { challengeId, attempts });
};

export const trackHintRevealed = (challengeId, hintNumber) => {
    analytics.track('challenge', 'hint_revealed', { challengeId, hintNumber });
};

export const trackPlanCreated = (planId, goal, language, level) => {
    analytics.track('plan', 'created', { planId, goal, language, level });
};

export const trackPlanSwitched = (fromPlanId, toPlanId) => {
    analytics.track('plan', 'switched', { fromPlanId, toPlanId });
};

export const trackPlanDeleted = (planId) => {
    analytics.track('plan', 'deleted', { planId });
};

export const trackCodeExecution = (language, linesOfCode, executionTime) => {
    analytics.track('code', 'executed', { language, linesOfCode, executionTime });
};

export const trackThemeChanged = (fromTheme, toTheme) => {
    analytics.track('ui', 'theme_changed', { fromTheme, toTheme });
};

export default analytics;
