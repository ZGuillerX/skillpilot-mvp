// Gestión de estado de retos desde BD
import { saveCompletedChallengeToDB, getUserProgress, saveLearningPlanToDB, checkPlanLimit } from './userProgress';
import challengeCache from './challengeCache';
import eventEmitter, { EVENTS } from './events';

const CAPABILITY_KEYS = [
  "decomposicion",
  "abstraccion",
  "depuracion",
  "diseno_apis",
  "optimizacion",
  "comunicacion_tecnica",
];

function getAdaptiveMemoryStorageKey(planId = "global") {
  return `skillpilot_adaptive_memory_${planId}`;
}

function getDefaultAdaptiveMemory() {
  return {
    preferredMode: "tutor",
    capabilityScores: {
      decomposicion: 50,
      abstraccion: 50,
      depuracion: 50,
      diseno_apis: 50,
      optimizacion: 50,
      comunicacion_tecnica: 50,
    },
    frictionPatterns: [],
    winsPatterns: [],
    lastUpdatedAt: null,
  };
}

export async function getAdaptiveMemory() {
  if (typeof window === "undefined") return getDefaultAdaptiveMemory();
  try {
    const plan = await getLearningPlan();
    const key = getAdaptiveMemoryStorageKey(plan?.id || "global");
    const raw = localStorage.getItem(key);
    if (!raw) return getDefaultAdaptiveMemory();
    const parsed = JSON.parse(raw);
    return {
      ...getDefaultAdaptiveMemory(),
      ...parsed,
      capabilityScores: {
        ...getDefaultAdaptiveMemory().capabilityScores,
        ...(parsed.capabilityScores || {}),
      },
    };
  } catch {
    return getDefaultAdaptiveMemory();
  }
}

async function saveAdaptiveMemory(memory) {
  if (typeof window === "undefined") return;
  try {
    const plan = await getLearningPlan();
    const key = getAdaptiveMemoryStorageKey(plan?.id || "global");
    localStorage.setItem(
      key,
      JSON.stringify({
        ...memory,
        lastUpdatedAt: new Date().toISOString(),
      })
    );
  } catch (error) {
    console.error("Error saving adaptive memory:", error);
  }
}

export async function setPreferredLearningMode(mode) {
  const safeMode = mode === "arena" ? "arena" : "tutor";
  const memory = await getAdaptiveMemory();
  memory.preferredMode = safeMode;
  await saveAdaptiveMemory(memory);
}

export async function getPreferredLearningMode() {
  const memory = await getAdaptiveMemory();
  return memory.preferredMode || "tutor";
}

export async function getBottleneckCapability() {
  const memory = await getAdaptiveMemory();
  const entries = Object.entries(memory.capabilityScores || {});
  if (!entries.length) return "decomposicion";
  entries.sort((a, b) => a[1] - b[1]);
  return entries[0][0];
}

async function updateAdaptiveMemoryFromEvaluation(evaluation, challenge) {
  if (!evaluation || typeof evaluation !== "object") return;
  const memory = await getAdaptiveMemory();
  const dimensions = evaluation.dimensions || {};

  CAPABILITY_KEYS.forEach((capability) => {
    const mappedScore =
      typeof dimensions[capability] === "number"
        ? dimensions[capability]
        : null;
    if (mappedScore === null) return;

    const current = memory.capabilityScores[capability] ?? 50;
    memory.capabilityScores[capability] = Math.max(
      0,
      Math.min(100, Math.round(current * 0.75 + mappedScore * 0.25))
    );
  });

  if (Array.isArray(evaluation.suggestions) && evaluation.suggestions.length > 0) {
    const top = evaluation.suggestions.slice(0, 2).join(" | ");
    memory.frictionPatterns = [top, ...(memory.frictionPatterns || [])].slice(0, 12);
  }

  if (evaluation.success && challenge?.title) {
    memory.winsPatterns = [
      `${challenge.title} (${evaluation.score || 0}%)`,
      ...(memory.winsPatterns || []),
    ].slice(0, 12);
  }

  await saveAdaptiveMemory(memory);
}

// Obtener historial de retos desde BD
export async function getChallengeHistory() {
  if (typeof window === "undefined") return [];
  try {
    const progress = await getUserProgress();
    if (!progress || !progress.challenge_history) {
      console.log('⚠️ No challenge history found in progress');
      return [];
    }

    const history = progress.challenge_history;
    console.log('📚 Challenge history loaded:', history.length, 'challenges');

    // Validar que cada entrada tenga la estructura correcta
    const validHistory = history.filter((entry) => {
      return (
        entry &&
        typeof entry === "object" &&
        entry.challenge &&
        typeof entry.challenge === "object" &&
        entry.challenge.title &&
        entry.challenge.id
      );
    });

    if (validHistory.length !== history.length) {
      console.warn(`⚠️ Filtered out ${history.length - validHistory.length} invalid entries`);
    }

    return validHistory;
  } catch (error) {
    console.error("Error reading challenge history from DB:", error);
    return [];
  }
}

// Índice del reto actual - mantener en memoria durante la sesión
let currentChallengeIndexCache = 0;

export function getCurrentChallengeIndex() {
  return currentChallengeIndexCache;
}

export function setCurrentChallengeIndex(index) {
  currentChallengeIndexCache = index;
}

export async function saveChallengeToHistory(
  challenge,
  code = "",
  evaluation = null,
  files = null
) {
  if (typeof window === "undefined") return;

  // Validar que el challenge tenga la estructura mínima requerida
  if (!challenge || !challenge.title || !challenge.id) {
    console.error(
      "Invalid challenge structure, cannot save to history:",
      challenge
    );
    return;
  }

  try {
    const learningPlan = await getLearningPlan();

    if (!learningPlan || !learningPlan.id) {
      console.error('❌ No learning plan found or no id');
      return;
    }

    const challengeEntry = {
      challenge: {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description || "",
        language: challenge.language || "generic",
        difficulty: challenge.difficulty || "beginner",
        acceptanceCriteria: challenge.acceptanceCriteria || [],
        hints: challenge.hints || [],
        concepts: challenge.concepts || [],
        estimatedTimeMinutes: challenge.estimatedTimeMinutes || 30,
        exampleInput: challenge.exampleInput || null,
        exampleOutput: challenge.exampleOutput || null,
      },
      code,
      files,
      evaluation,
      completedAt: evaluation?.success ? new Date().toISOString() : null,
      attempts: 1,
      savedAt: new Date().toISOString(),
      planId: learningPlan.id, // Asociar reto con plan usando 'id'
      timeSpent: evaluation?.timeSpent || 0, // Tiempo en segundos
      hintsUsed: evaluation?.hintsUsed || 0, // Número de pistas usadas
    };

    console.log(
      `💾 Saving challenge to DB:`,
      challengeEntry.challenge.title,
      "for plan:",
      challengeEntry.planId,
      "success:",
      evaluation?.success
    );

    // Guardar directamente en BD
    const result = await saveCompletedChallengeToDB(challengeEntry);
    console.log('✅ Challenge saved result:', result);

    // Emitir evento para actualizar estadísticas en tiempo real
    eventEmitter.emit(EVENTS.CHALLENGE_SAVED, {
      challengeId: challenge.id,
      success: evaluation?.success,
      score: evaluation?.score,
      planId: learningPlan.id
    });

    if (evaluation?.success) {
      eventEmitter.emit(EVENTS.CHALLENGE_COMPLETED, {
        challengeId: challenge.id,
        score: evaluation?.score,
        planId: learningPlan.id
      });
    }

    await updateAdaptiveMemoryFromEvaluation(evaluation, challenge);
  } catch (error) {
    console.error("Error saving challenge to history:", error);
  }
}

export async function getChallengeFromHistory(index) {
  if (typeof window === "undefined") return null;

  try {
    const history = await getChallengeHistory();
    const learningPlan = await getLearningPlan();

    // Filtrar retos del plan actual
    const planChallenges = learningPlan?.id
      ? history.filter(entry => entry.planId === learningPlan.id)
      : history;

    return planChallenges[index] || null;
  } catch {
    return null;
  }
}

export async function getCompletedChallengesCount() {
  if (typeof window === "undefined") return 0;

  try {
    const history = await getChallengeHistory();
    const learningPlan = await getLearningPlan();

    console.log(' getCompletedChallengesCount - Total history:', history.length, 'Current plan:', learningPlan?.id);

    // Contar solo retos del plan actual
    const planChallenges = learningPlan?.id
      ? history.filter(entry => entry.planId === learningPlan.id)
      : history;

    console.log(' Plan challenges:', planChallenges.length);

    const completed = planChallenges.filter((entry) => entry.evaluation?.success).length;
    console.log(' Completed:', completed);

    return completed;
  } catch (error) {
    console.error('Error in getCompletedChallengesCount:', error);
    return 0;
  }
}

// Funciones para manejar retos completados específicamente
export async function isChallengeCompleted(challengeIndex) {
  if (typeof window === "undefined") return false;

  try {
    const entry = await getChallengeFromHistory(challengeIndex);
    return entry && entry.evaluation && entry.evaluation.success === true;
  } catch {
    return false;
  }
}

export async function getChallengeCompletionStatus(challengeIndex) {
  if (typeof window === "undefined") return null;

  try {
    const entry = await getChallengeFromHistory(challengeIndex);
    if (!entry || !entry.evaluation) return null;

    return {
      completed: entry.evaluation.success,
      score: entry.evaluation.score,
      attempts: entry.attempts || 1,
      completedAt: entry.completedAt,
      lastAttemptAt: entry.savedAt,
    };
  } catch {
    return null;
  }
}

// Función para obtener estadísticas de progreso
export async function getProgressStats() {
  if (typeof window === "undefined")
    return { completed: 0, total: 0, streak: 0 };

  try {
    const history = await getChallengeHistory();
    const learningPlan = await getLearningPlan();

    // Filtrar retos del plan actual
    const planChallenges = learningPlan?.id
      ? history.filter(entry => entry.planId === learningPlan.id)
      : history;

    const completed = planChallenges.filter(
      (entry) => entry?.evaluation?.success
    ).length;
    const total = planChallenges.length;

    // Calcular racha actual (retos completados consecutivos desde el final)
    let streak = 0;
    for (let i = planChallenges.length - 1; i >= 0; i--) {
      if (planChallenges[i]?.evaluation?.success) {
        streak++;
      } else {
        break;
      }
    }

    return { completed, total, streak };
  } catch {
    return { completed: 0, total: 0, streak: 0 };
  }
}

// Función para marcar un reto como completado (para casos especiales)
export async function markChallengeCompleted(challengeIndex, score = 100) {
  if (typeof window === "undefined") return;

  try {
    const entry = await getChallengeFromHistory(challengeIndex);
    if (entry && entry.challenge) {
      const completedEvaluation = {
        success: true,
        score: score,
        feedback: "Reto marcado como completado",
        suggestions: [],
      };

      await saveChallengeToHistory(
        entry.challenge,
        entry.code || "",
        completedEvaluation
      );
    }
  } catch (error) {
    console.error("Error marking challenge as completed:", error);
  }
}

export async function getTotalAttempts() {
  if (typeof window === "undefined") return 0;

  try {
    const history = await getChallengeHistory();
    const learningPlan = await getLearningPlan();

    console.log(' getTotalAttempts - Current plan:', learningPlan?.id);

    // Contar solo retos del plan actual
    const planChallenges = learningPlan?.id
      ? history.filter(entry => entry.planId === learningPlan.id)
      : history;

    const total = planChallenges.reduce((total, entry) => total + (entry.attempts || 0), 0);
    console.log(' Total attempts:', total);
    return total;
  } catch (error) {
    console.error('Error in getTotalAttempts:', error);
    return 0;
  }
}

export async function getAverageScore() {
  if (typeof window === "undefined") return 0;

  try {
    const history = await getChallengeHistory();
    const learningPlan = await getLearningPlan();

    console.log(' getAverageScore - Current plan:', learningPlan?.id);

    // Calcular solo para retos del plan actual
    const planChallenges = learningPlan?.id
      ? history.filter(entry => entry.planId === learningPlan.id)
      : history;

    const evaluations = planChallenges
      .filter(
        (entry) =>
          entry.evaluation && typeof entry.evaluation.score === "number"
      )
      .map((entry) => entry.evaluation.score);

    console.log(' Evaluations for average:', evaluations);

    if (evaluations.length === 0) return 0;

    const sum = evaluations.reduce((total, score) => total + score, 0);
    const avg = Math.round(sum / evaluations.length);
    console.log(' Average score:', avg);
    return avg;
  } catch (error) {
    console.error('Error in getAverageScore:', error);
    return 0;
  }
}

export async function saveLearningPlan(plan) {
  if (typeof window === "undefined") return;

  try {
    // Verificar límite de planes
    const limitCheck = await checkPlanLimit();

    if (!limitCheck.hasSpace) {
      throw new Error(`Has alcanzado el límite de ${limitCheck.maxPlans} planes de aprendizaje. Por favor, elimina alguno antes de crear uno nuevo.`);
    }

    const planData = {
      goal: plan.goal,
      level: plan.level,
      language: plan.startingChallenge?.language || "generic",
      savedAt: new Date().toISOString(),
    };

    // Guardar en BD y obtener el planId
    const result = await saveLearningPlanToDB(planData);

    console.log(' Plan guardado en BD con ID:', result.plan.id);

    // Resetear índice de retos en memoria
    currentChallengeIndexCache = 0;

    return result.plan;
  } catch (error) {
    console.error("Error saving learning plan:", error);
    throw error;
  }
}

export async function getLearningPlan() {
  if (typeof window === "undefined") return null;

  try {
    const progress = await getUserProgress();
    if (!progress || !progress.learning_plan) {
      console.log('⚠️ No progress or learning_plan found');
      return null;
    }

    const currentPlan = progress.learning_plan.currentPlan || null;
    console.log('📋 Current learning plan:', currentPlan?.goal, 'planId:', currentPlan?.id);
    return currentPlan;
  } catch (error) {
    console.error("Error getting learning plan:", error);
    return null;
  }
}

// Utilidades para generar retos
export async function generateChallenge(challengeIndex = 0, options = {}) {
  const plan = await getLearningPlan();

  if (!plan) {
    throw new Error("No hay plan de aprendizaje configurado");
  }

  // Intentar obtener del caché primero
  const cached = challengeCache.get(plan.id, challengeIndex);
  if (cached) {
    return cached;
  }

  const history = await getChallengeHistory();

  // Filtrar historial del plan actual
  const planHistory = plan.id
    ? history.filter(entry => entry.planId === plan.id)
    : history;

  const previousChallenges = planHistory
    .slice(Math.max(0, challengeIndex - 3), challengeIndex)
    .filter((entry) => entry && entry.challenge)
    .map((entry) => ({
      title: entry.challenge.title || "Reto anterior",
      concepts: entry.challenge.concepts || [],
    }));

  const adaptiveMemory = await getAdaptiveMemory();
  const preferredMode = options.learningMode || adaptiveMemory.preferredMode || "tutor";
  const bottleneckCapability = await getBottleneckCapability();
  const recentScores = planHistory
    .slice(-5)
    .map((entry) => entry?.evaluation?.score)
    .filter((score) => typeof score === "number");

  const scoreTrend =
    recentScores.length > 0
      ? Math.round(recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length)
      : null;

  try {
    const response = await fetch("/api/ai/challenges", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        goal: plan.goal,
        level: plan.level,
        language: plan.language,
        currentChallenge: challengeIndex,
        previousChallenges,
        learningMode: preferredMode,
        bottleneckCapability,
        capabilityScores: adaptiveMemory.capabilityScores,
        personalStyleMemory: {
          frictionPatterns: adaptiveMemory.frictionPatterns?.slice(0, 3) || [],
          winsPatterns: adaptiveMemory.winsPatterns?.slice(0, 3) || [],
        },
        recentPerformance: {
          recentScores,
          averageScore: scoreTrend,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Mejor manejo de errores específicos
      if (response.status >= 500) {
        throw new Error(
          "Error del servidor. Por favor intenta de nuevo en unos momentos."
        );
      } else if (response.status === 429) {
        throw new Error(
          "Límite de solicitudes excedido. Espera unos segundos e intenta de nuevo."
        );
      } else {
        throw new Error(
          data.error || `Error ${response.status}: No se pudo generar el reto`
        );
      }
    }

    if (!data.challenge) {
      throw new Error("Respuesta inválida del servidor");
    }

    // Guardar en caché antes de retornar
    challengeCache.set(plan.id, challengeIndex, data.challenge);

    return data.challenge;
  } catch (error) {
    console.error("Error generating challenge:", error);

    // Si hay un error de red o del servidor, intentar generar un reto de respaldo
    if (error.message.includes("fetch") || error.message.includes("network")) {
      return generateFallbackChallenge(challengeIndex, plan);
    }

    throw error;
  }
}

// Función para generar retos de respaldo cuando falla la IA
function generateFallbackChallenge(index, plan) {
  const difficulties = ["beginner", "intermediate", "advanced"];
  const difficultyIndex = Math.min(
    Math.floor(index / 5),
    difficulties.length - 1
  );
  const difficulty = difficulties[difficultyIndex];

  const fallbackChallenges = {
    JavaScript: {
      beginner: {
        title: "Función Suma Simple",
        description:
          "Crea una función que tome dos números como parámetros y devuelva su suma.",
        concepts: ["funciones", "parámetros", "return"],
        exampleInput: "suma(5, 3)",
        exampleOutput: "8",
      },
      intermediate: {
        title: "Filtrar Array",
        description:
          "Crea una función que filtre un array de números y devuelva solo los números pares.",
        concepts: ["arrays", "filter", "funciones arrow"],
        exampleInput: "[1, 2, 3, 4, 5, 6]",
        exampleOutput: "[2, 4, 6]",
      },
      advanced: {
        title: "Implementar QuickSort",
        description:
          "Implementa el algoritmo de ordenamiento QuickSort para ordenar un array de números.",
        concepts: ["recursión", "algoritmos", "divide y vencerás"],
        exampleInput: "[64, 34, 25, 12, 22, 11, 90]",
        exampleOutput: "[11, 12, 22, 25, 34, 64, 90]",
      },
    },
    Python: {
      beginner: {
        title: "Función de Saludo",
        description:
          "Crea una función que tome un nombre como parámetro y devuelva un saludo personalizado.",
        concepts: ["funciones", "strings", "f-strings"],
        exampleInput: "saludar('Ana')",
        exampleOutput: "'Hola Ana, ¡bienvenida!'",
      },
      intermediate: {
        title: "Contador de Palabras",
        description:
          "Crea una función que cuente la frecuencia de cada palabra en un texto.",
        concepts: ["diccionarios", "split", "loops"],
        exampleInput: "'el gato subió al tejado el gato bajó'",
        exampleOutput:
          "{'el': 2, 'gato': 2, 'subió': 1, 'al': 1, 'tejado': 1, 'bajó': 1}",
      },
      advanced: {
        title: "Clase Árbol Binario",
        description:
          "Implementa una clase para un árbol binario de búsqueda con métodos insert, search y traverse.",
        concepts: ["clases", "recursión", "estructuras de datos"],
        exampleInput: "tree.insert(5); tree.search(5)",
        exampleOutput: "True",
      },
    },
  };

  const language = plan.language;
  const challengeTemplate =
    fallbackChallenges[language]?.[difficulty] ||
    fallbackChallenges.JavaScript.beginner;

  return {
    id: `fallback-${index}-${Date.now()}`,
    title: challengeTemplate.title,
    description: challengeTemplate.description,
    language: language,
    difficulty: difficulty,
    acceptanceCriteria: [
      "El código ejecuta sin errores",
      "Cumple con los requisitos especificados",
      "Código limpio y bien comentado",
    ],
    hints: [
      "Lee cuidadosamente la descripción del problema",
      "Prueba tu código con los ejemplos dados",
      "Considera casos edge como entradas vacías",
    ],
    exampleInput: challengeTemplate.exampleInput,
    exampleOutput: challengeTemplate.exampleOutput,
    concepts: challengeTemplate.concepts,
    estimatedTimeMinutes: 30,
  };
}

// Función de debug para revisar datos
export async function debugChallengeData() {
  if (typeof window === "undefined") return;

  try {
    const history = await getChallengeHistory();
    const currentIndex = getCurrentChallengeIndex();
    const plan = await getLearningPlan();

    console.group("🔍 Challenge Debug Info");
    console.log("Current Index:", currentIndex);
    console.log("History Length:", history.length);
    console.log("Learning Plan:", plan);
    console.log(
      "History Preview:",
      history.slice(0, 3).map((entry) => ({
        title: entry?.challenge?.title,
        planId: entry?.planId,
        hasCode: !!entry?.code,
        hasEvaluation: !!entry?.evaluation,
      }))
    );
    console.groupEnd();

    return {
      historyLength: history.length,
      currentIndex,
      plan,
      isValid: history.every((entry) => entry?.challenge?.title),
    };
  } catch (error) {
    console.error("Error debugging challenge data:", error);
    return null;
  }
}
