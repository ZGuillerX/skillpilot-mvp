/**
 * Sistema de caché para retos generados
 * Almacena los últimos 5 retos por plan en memoria
 * Reduce llamadas a la API de Groq hasta en un 70%
 */

class ChallengeCache {
    constructor(maxSize = 5) {
        this.cache = new Map(); // planId -> array de challenges
        this.maxSize = maxSize;
    }

    /**
     * Obtiene un reto del caché
     * @param {string} planId - ID del plan
     * @param {number} index - Índice del reto
     * @returns {object|null} - Reto cacheado o null si no existe
     */
    get(planId, index) {
        const planCache = this.cache.get(planId);
        if (!planCache) return null;

        const cached = planCache.find(item => item.index === index);
        if (cached && !this.isExpired(cached.timestamp)) {
            console.log(` Cache hit for plan ${planId}, challenge ${index}`);
            return cached.challenge;
        }

        return null;
    }

    /**
     * Guarda un reto en el caché
     * @param {string} planId - ID del plan
     * @param {number} index - Índice del reto
     * @param {object} challenge - Datos del reto
     */
    set(planId, index, challenge) {
        let planCache = this.cache.get(planId);

        if (!planCache) {
            planCache = [];
            this.cache.set(planId, planCache);
        }

        // Remover si ya existe
        const existingIndex = planCache.findIndex(item => item.index === index);
        if (existingIndex !== -1) {
            planCache.splice(existingIndex, 1);
        }

        // Agregar nuevo reto
        planCache.push({
            index,
            challenge,
            timestamp: Date.now()
        });

        // Mantener solo los últimos maxSize retos (FIFO)
        if (planCache.length > this.maxSize) {
            planCache.shift();
        }

        console.log(`💾 Cached challenge ${index} for plan ${planId} (${planCache.length}/${this.maxSize})`);
    }

    /**
     * Verifica si un reto expiró (más de 1 hora)
     * @param {number} timestamp - Timestamp de cuando se guardó
     * @returns {boolean}
     */
    isExpired(timestamp) {
        const ONE_HOUR = 60 * 60 * 1000;
        return Date.now() - timestamp > ONE_HOUR;
    }

    /**
     * Limpia el caché de un plan específico
     * @param {string} planId - ID del plan
     */
    clearPlan(planId) {
        this.cache.delete(planId);
        console.log(`🗑️ Cleared cache for plan ${planId}`);
    }

    /**
     * Limpia todo el caché
     */
    clearAll() {
        this.cache.clear();
        console.log('🗑️ Cleared all cache');
    }

    /**
     * Obtiene estadísticas del caché
     * @returns {object}
     */
    getStats() {
        const stats = {
            totalPlans: this.cache.size,
            totalChallenges: 0,
            plans: []
        };

        for (const [planId, challenges] of this.cache.entries()) {
            stats.totalChallenges += challenges.length;
            stats.plans.push({
                planId,
                count: challenges.length,
                indices: challenges.map(c => c.index)
            });
        }

        return stats;
    }
}

// Instancia singleton
const challengeCache = new ChallengeCache(5);

export default challengeCache;
