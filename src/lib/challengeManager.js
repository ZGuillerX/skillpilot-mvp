// Gestión de estado de retos en localStorage
export function getChallengeHistory() {
  if (typeof window === "undefined") return [];
  try {
    const history = JSON.parse(
      localStorage.getItem("challengeHistory") || "[]"
    );

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

    // Si hay entradas inválidas, guardar solo las válidas
    if (validHistory.length !== history.length) {
      console.log(
        `Cleaned ${
          history.length - validHistory.length
        } invalid entries from history`
      );
      localStorage.setItem("challengeHistory", JSON.stringify(validHistory));
    }

    return validHistory;
  } catch (error) {
    console.error("Error reading challenge history, resetting:", error);
    localStorage.removeItem("challengeHistory");
    return [];
  }
}

export function getCurrentChallengeIndex() {
  if (typeof window === "undefined") return 0;
  try {
    return parseInt(localStorage.getItem("currentChallengeIndex") || "0");
  } catch {
    return 0;
  }
}

export function setCurrentChallengeIndex(index) {
  if (typeof window === "undefined") return;
  localStorage.setItem("currentChallengeIndex", index.toString());
}

export function saveChallengeToHistory(
  challenge,
  code = "",
  evaluation = null
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
    const history = getChallengeHistory();
    const currentIndex = getCurrentChallengeIndex();

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
      evaluation,
      completedAt: evaluation?.success ? new Date().toISOString() : null,
      attempts: 1,
      savedAt: new Date().toISOString(),
    };

    // Si ya existe este índice, actualizar; si no, agregar
    if (history[currentIndex]) {
      challengeEntry.attempts = (history[currentIndex].attempts || 0) + 1;
      history[currentIndex] = {
        ...history[currentIndex],
        ...challengeEntry,
      };
    } else {
      // Llenar huecos si es necesario
      while (history.length < currentIndex) {
        history.push(null);
      }
      history[currentIndex] = challengeEntry;
    }

    localStorage.setItem("challengeHistory", JSON.stringify(history));
    console.log(
      `Challenge saved to history at index ${currentIndex}:`,
      challengeEntry.challenge.title
    );
  } catch (error) {
    console.error("Error saving challenge to history:", error);
  }
}

export function getChallengeFromHistory(index) {
  if (typeof window === "undefined") return null;

  try {
    const history = getChallengeHistory();
    return history[index] || null;
  } catch {
    return null;
  }
}

export function getCompletedChallengesCount() {
  if (typeof window === "undefined") return 0;

  try {
    const history = getChallengeHistory();
    return history.filter((entry) => entry.evaluation?.success).length;
  } catch {
    return 0;
  }
}

// Funciones para manejar retos completados específicamente
export function isChallengeCompleted(challengeIndex) {
  if (typeof window === "undefined") return false;

  try {
    const entry = getChallengeFromHistory(challengeIndex);
    return entry && entry.evaluation && entry.evaluation.success === true;
  } catch {
    return false;
  }
}

export function getChallengeCompletionStatus(challengeIndex) {
  if (typeof window === "undefined") return null;

  try {
    const entry = getChallengeFromHistory(challengeIndex);
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
export function getProgressStats() {
  if (typeof window === "undefined")
    return { completed: 0, total: 0, streak: 0 };

  try {
    const history = getChallengeHistory();
    const completed = history.filter(
      (entry) => entry?.evaluation?.success
    ).length;
    const total = history.length;

    // Calcular racha actual (retos completados consecutivos desde el final)
    let streak = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i]?.evaluation?.success) {
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
export function markChallengeCompleted(challengeIndex, score = 100) {
  if (typeof window === "undefined") return;

  try {
    const entry = getChallengeFromHistory(challengeIndex);
    if (entry && entry.challenge) {
      const completedEvaluation = {
        success: true,
        score: score,
        feedback: "Reto marcado como completado",
        suggestions: [],
      };

      saveChallengeToHistory(
        entry.challenge,
        entry.code || "",
        completedEvaluation
      );
    }
  } catch (error) {
    console.error("Error marking challenge as completed:", error);
  }
}

export function getTotalAttempts() {
  if (typeof window === "undefined") return 0;

  try {
    const history = getChallengeHistory();
    return history.reduce((total, entry) => total + (entry.attempts || 0), 0);
  } catch {
    return 0;
  }
}

export function getAverageScore() {
  if (typeof window === "undefined") return 0;

  try {
    const history = getChallengeHistory();
    const evaluations = history
      .filter(
        (entry) =>
          entry.evaluation && typeof entry.evaluation.score === "number"
      )
      .map((entry) => entry.evaluation.score);

    if (evaluations.length === 0) return 0;

    const sum = evaluations.reduce((total, score) => total + score, 0);
    return Math.round(sum / evaluations.length);
  } catch {
    return 0;
  }
}

// Configuración del plan de aprendizaje para retos
export function saveLearningPlan(plan) {
  if (typeof window === "undefined") return;

  try {
    const planData = {
      goal: plan.goal,
      level: plan.level,
      language: plan.startingChallenge?.language || "generic",
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem("learningPlan", JSON.stringify(planData));
  } catch (error) {
    console.error("Error saving learning plan:", error);
  }
}

export function getLearningPlan() {
  if (typeof window === "undefined") return null;

  try {
    const plan = localStorage.getItem("learningPlan");
    return plan ? JSON.parse(plan) : null;
  } catch {
    return null;
  }
}

// Utilidades para generar retos
export async function generateChallenge(challengeIndex = 0) {
  const plan = getLearningPlan();

  if (!plan) {
    throw new Error("No hay plan de aprendizaje configurado");
  }

  const history = getChallengeHistory();
  const previousChallenges = history
    .slice(Math.max(0, challengeIndex - 3), challengeIndex)
    .filter((entry) => entry && entry.challenge) // Filtrar entradas válidas
    .map((entry) => ({
      title: entry.challenge.title || "Reto anterior",
      concepts: entry.challenge.concepts || [],
    }));

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

// Reset del progreso (útil para testing o empezar de nuevo)
export function resetChallengeProgress() {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem("challengeHistory");
    localStorage.removeItem("currentChallengeIndex");
  } catch (error) {
    console.error("Error resetting challenge progress:", error);
  }
}

export function resetAll() {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem("challengeHistory");
    localStorage.removeItem("currentChallengeIndex");
    localStorage.removeItem("learningPlan");
    console.log("All challenge data has been reset");
  } catch (error) {
    console.error("Error resetting all data:", error);
  }
}

// Función de debug para revisar y limpiar datos corruptos
export function debugChallengeData() {
  if (typeof window === "undefined") return;

  try {
    const history = getChallengeHistory();
    const currentIndex = getCurrentChallengeIndex();
    const plan = getLearningPlan();

    console.group("🔍 Challenge Debug Info");
    console.log("Current Index:", currentIndex);
    console.log("History Length:", history.length);
    console.log("Learning Plan:", plan);
    console.log(
      "History Preview:",
      history.slice(0, 3).map((entry) => ({
        index: history.indexOf(entry),
        title: entry?.challenge?.title,
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
