// Gestión de progreso del usuario sincronizado con BD
import Cookies from 'js-cookie';

const MAX_LEARNING_PLANS = 5;

// Obtener progreso del usuario desde la BD
export async function getUserProgress() {
    try {
        const token = Cookies.get('token');
        if (!token) return null;

        const response = await fetch('/api/user/progress', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) return null;

        const data = await response.json();
        return data.progress;
    } catch (error) {
        console.error('Error fetching user progress:', error);
        return null;
    }
}

// Guardar plan de aprendizaje en BD
export async function saveLearningPlanToDB(plan) {
    try {
        const token = Cookies.get('token');
        if (!token) {
            throw new Error('Usuario no autenticado');
        }

        const response = await fetch('/api/user/progress/plan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ plan }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error al guardar el plan');
        }

        return data;
    } catch (error) {
        console.error('Error saving learning plan:', error);
        throw error;
    }
}

// Verificar si el usuario ha alcanzado el límite de planes
export async function checkPlanLimit() {
    try {
        const progress = await getUserProgress();
        if (!progress || !progress.learning_plan) return { hasSpace: true, count: 0 };

        const plans = progress.learning_plan.plans || [];
        return {
            hasSpace: plans.length < MAX_LEARNING_PLANS,
            count: plans.length,
            maxPlans: MAX_LEARNING_PLANS,
        };
    } catch (error) {
        console.error('Error checking plan limit:', error);
        return { hasSpace: true, count: 0 };
    }
}

// Eliminar un plan antiguo
export async function deleteLearningPlan(planId) {
    try {
        const token = Cookies.get('token');
        if (!token) {
            throw new Error('Usuario no autenticado');
        }

        const response = await fetch(`/api/user/progress/plan/${planId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error al eliminar el plan');
        }

        return data;
    } catch (error) {
        console.error('Error deleting plan:', error);
        throw error;
    }
}

// Guardar reto completado en BD
export async function saveCompletedChallengeToDB(challengeData) {
    try {
        const token = Cookies.get('token');
        if (!token) {
            // Si no está autenticado, guardar solo en localStorage
            return { saved: false, reason: 'not_authenticated' };
        }

        const response = await fetch('/api/user/progress/challenge', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(challengeData),
        });

        const data = await response.json();

        if (!response.ok) {
            console.warn('Could not save to DB, keeping in localStorage:', data.error);
            return { saved: false, reason: data.error };
        }

        return { saved: true, data };
    } catch (error) {
        console.error('Error saving challenge to DB:', error);
        return { saved: false, reason: error.message };
    }
}

// Sincronizar progreso de localStorage a BD (para usuarios que se registran después)
export async function syncLocalProgressToDB() {
    try {
        const token = Cookies.get('token');
        if (!token) return { synced: false };

        // Ya no usamos localStorage, todo está en BD
        return { synced: true, message: 'Todo está sincronizado en BD' };
    } catch (error) {
        console.error('Error syncing progress:', error);
        return { synced: false, error: error.message };
    }
}

// Ya no es necesario cargar desde BD a localStorage
export async function loadProgressFromDB() {
    // Esta función ya no es necesaria ya que todo se lee directamente de BD
    return true;
}

// Limpiar todos los planes y resetear progreso
export async function clearAllPlans() {
    try {
        const token = Cookies.get('token');
        if (!token) {
            throw new Error('Usuario no autenticado');
        }

        const response = await fetch('/api/user/progress/plans', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error al limpiar planes');
        }

        return data;
    } catch (error) {
        console.error('Error clearing plans:', error);
        throw error;
    }
}

// Obtener estadísticas del usuario
export async function getUserStats() {
    try {
        const token = Cookies.get('token');
        if (!token) return null;

        const response = await fetch('/api/user/stats', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) return null;

        const data = await response.json();
        return data.stats;
    } catch (error) {
        console.error('Error fetching user stats:', error);
        return null;
    }
}

// Cambiar plan activo
export async function switchPlan(planId) {
    try {
        const token = Cookies.get('token');
        if (!token) {
            throw new Error('Usuario no autenticado');
        }

        const response = await fetch('/api/user/progress/plan/switch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ planId }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error al cambiar de plan');
        }

        return data;
    } catch (error) {
        console.error('Error switching plan:', error);
        throw error;
    }
}
