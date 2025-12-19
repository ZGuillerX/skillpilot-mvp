import { NextResponse } from "next/server";
import { askJSON } from "@/lib/ai/groq";

const SYSTEM_CHALLENGES = `
Eres un generador experto de retos de programación para SkillPilot. 
Generas retos PROGRESIVOS y ESPECÍFICOS para la tecnología solicitada.

REGLAS CRÍTICAS:
- Genera retos EXCLUSIVAMENTE para la tecnología/lenguaje solicitado
- Los retos deben ser PROGRESIVOS: cada uno más complejo que el anterior
- Adapta la dificultad según el nivel (beginner/intermediate/advanced)
- NUNCA mezcles tecnologías diferentes

RESPONDE EXCLUSIVAMENTE EN JSON con esta estructura EXACTA:

{
  "challenge": {
    "id": "string-uuid",
    "title": "string",
    "description": "string detallada del problema a resolver",
    "language": "string (debe coincidir con la tecnología solicitada)",
    "difficulty": "beginner|intermediate|advanced",
    "acceptanceCriteria": ["criterio1", "criterio2", "criterio3"],
    "hints": ["pista1", "pista2"],
    "exampleInput": "string (opcional)",
    "exampleOutput": "string (opcional)",
    "concepts": ["concepto1", "concepto2", "concepto3"],
    "estimatedTimeMinutes": number
  }
}

TIPOS DE RETOS POR NIVEL:

BEGINNER:
- Sintaxis básica, variables, tipos de datos
- Condicionales simples (if/else)
- Bucles básicos (for, while)
- Funciones simples
- Operaciones matemáticas básicas

INTERMEDIATE:
- Estructuras de datos (arrays, objetos, listas, diccionarios)
- Funciones más complejas con múltiples parámetros
- Manejo de strings avanzado
- Algoritmos de ordenamiento básicos
- Validaciones y manejo de errores

ADVANCED:
- Algoritmos complejos (recursión, divide y vencerás)
- Estructuras de datos avanzadas
- Optimización de performance
- Patrones de diseño
- Arquitectura y mejores prácticas

EJEMPLOS DE PROGRESIÓN:

Para JavaScript:
1. Beginner: "Crear una función que sume dos números"
2. Beginner+: "Función que determine si un número es par o impar"
3. Intermediate: "Función que encuentre el mayor número en un array"
4. Intermediate+: "Implementar un contador de palabras en un texto"
5. Advanced: "Implementar un algoritmo de ordenamiento quicksort"

IMPORTANTE:
- Cada reto debe tener contexto práctico
- Incluye ejemplos de entrada y salida cuando sea relevante
- Los criterios de aceptación deben ser específicos y verificables
- Las pistas deben guiar sin dar la respuesta completa
`;

// Función para generar retos de respaldo cuando falla la IA
function generateFallbackChallenge(index, language, difficulty, goal) {
  const challenges = {
    JavaScript: [
      {
        title: "Función Suma Simple",
        description: "Crea una función que tome dos números como parámetros y devuelva su suma.",
        concepts: ["funciones", "parámetros", "return"],
        exampleInput: "suma(5, 3)",
        exampleOutput: "8",
      },
      {
        title: "Filtrar Array",
        description: "Crea una función que filtre un array de números y devuelva solo los números pares.",
        concepts: ["arrays", "filter", "funciones arrow"],
        exampleInput: "[1, 2, 3, 4, 5, 6]",
        exampleOutput: "[2, 4, 6]",
      },
    ],
    Python: [
      {
        title: "Función de Saludo",
        description: "Crea una función que tome un nombre como parámetro y devuelva un saludo personalizado.",
        concepts: ["funciones", "strings", "f-strings"],
        exampleInput: "saludar('Ana')",
        exampleOutput: "'Hola Ana, ¡bienvenida!'",
      },
      {
        title: "Contador de Palabras",
        description: "Crea una función que cuente la frecuencia de cada palabra en un texto.",
        concepts: ["diccionarios", "split", "loops"],
        exampleInput: "'el gato subió al tejado'",
        exampleOutput: "{'el': 1, 'gato': 1, 'subió': 1, 'al': 1, 'tejado': 1}",
      },
    ],
    django: [
      {
        title: "Modelo Django Simple",
        description: "Crea un modelo Django para representar un artículo de blog con título, contenido y fecha de publicación.",
        concepts: ["modelos", "campos", "DateTimeField"],
        exampleInput: "class Article(models.Model):",
        exampleOutput: "Modelo con campos title, content, published_date",
      },
      {
        title: "Vista Django Básica",
        description: "Crea una vista basada en función que liste todos los artículos del blog.",
        concepts: ["vistas", "QuerySet", "render"],
        exampleInput: "def article_list(request):",
        exampleOutput: "Vista que renderiza lista de artículos",
      },
    ],
  };

  const langChallenges = challenges[language] || challenges.JavaScript;
  const challengeIndex = index % langChallenges.length;
  const template = langChallenges[challengeIndex];

  return {
    id: `fallback-${index}-${Date.now()}`,
    title: template.title,
    description: template.description,
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
    exampleInput: template.exampleInput,
    exampleOutput: template.exampleOutput,
    concepts: template.concepts,
    estimatedTimeMinutes: 30,
  };
}

export async function POST(req) {
  try {
    const {
      goal,
      level,
      language,
      currentChallenge = 0,
      previousChallenges = [],
    } = await req.json();

    if (!goal || !level || !language) {
      return NextResponse.json(
        { error: "goal, level y language son requeridos" },
        { status: 400 }
      );
    }

    // Determinar dificultad basada en el número de reto y nivel base
    const baseDifficulty = level;
    let targetDifficulty = baseDifficulty;

    if (currentChallenge >= 0 && currentChallenge < 3) {
      targetDifficulty = "beginner";
    } else if (currentChallenge >= 3 && currentChallenge < 7) {
      targetDifficulty =
        baseDifficulty === "advanced" ? "intermediate" : "beginner";
      if (baseDifficulty === "intermediate" && currentChallenge >= 5) {
        targetDifficulty = "intermediate";
      }
    } else {
      // Retos avanzados
      if (baseDifficulty === "beginner") {
        targetDifficulty = currentChallenge >= 10 ? "intermediate" : "beginner";
      } else if (baseDifficulty === "intermediate") {
        targetDifficulty = currentChallenge >= 10 ? "advanced" : "intermediate";
      } else {
        targetDifficulty = "advanced";
      }
    }

    const userPrompt = {
      goal,
      level: baseDifficulty,
      language,
      targetDifficulty,
      challengeNumber: currentChallenge + 1,
      previousChallenges: previousChallenges.slice(-3), // Solo los últimos 3 para contexto
      instructions: `
        Genera el reto número ${
          currentChallenge + 1
        } para alguien que está aprendiendo ${goal}.
        
        Contexto:
        - Nivel base del usuario: ${baseDifficulty}
        - Dificultad objetivo para este reto: ${targetDifficulty}
        - Lenguaje/tecnología: ${language}
        - Número de reto: ${currentChallenge + 1}
        
        El reto debe:
        1. Ser específico para ${language}
        2. Tener dificultad ${targetDifficulty}
        3. Ser progresivo respecto a retos anteriores
        4. Incluir conceptos relevantes para ${goal}
        5. Ser práctico y realista
        
        NO repitas retos anteriores, sé creativo pero relevante.
      `,
    };

    // Intentar con el modelo más potente disponible, con múltiples fallbacks
    let result;
    try {
      result = await askJSON({
        system: SYSTEM_CHALLENGES,
        user: userPrompt,
        model: "llama-3.3-70b-versatile",
      });
    } catch (error) {
      console.log("Primary model failed, trying fallback...");
      
      // Si es error de rate limit, usar reto de ejemplo directamente
      if (error.message?.includes('429') || error.message?.includes('rate_limit')) {
        console.log('Rate limit reached, using fallback challenge');
        result = { challenge: generateFallbackChallenge(currentChallenge, language, targetDifficulty, goal) };
      } else {
        try {
          // Intentar con modelo alternativo
          result = await askJSON({
            system: SYSTEM_CHALLENGES,
            user: userPrompt,
            model: "llama-3.1-8b-instant",
          });
        } catch (fallbackError) {
          console.log('All models failed, using fallback challenge');
          result = { challenge: generateFallbackChallenge(currentChallenge, language, targetDifficulty, goal) };
        }
      }
    }

    if (!result.challenge) {
      console.log('No challenge generated, using fallback');
      result = { challenge: generateFallbackChallenge(currentChallenge, language, targetDifficulty, goal) };
    }

    // Validar que el reto tenga la estructura correcta
    const challenge = {
      id:
        result.challenge.id ||
        `challenge-${currentChallenge + 1}-${Date.now()}`,
      title: result.challenge.title || `Reto ${currentChallenge + 1}`,
      description: result.challenge.description || "Descripción no disponible",
      language: language, // Forzar el lenguaje correcto
      difficulty: targetDifficulty,
      acceptanceCriteria: Array.isArray(result.challenge.acceptanceCriteria)
        ? result.challenge.acceptanceCriteria
        : ["Funciona correctamente", "Código limpio", "Cumple los requisitos"],
      hints: Array.isArray(result.challenge.hints)
        ? result.challenge.hints
        : ["Revisa la sintaxis básica", "Considera los casos edge"],
      exampleInput: result.challenge.exampleInput || null,
      exampleOutput: result.challenge.exampleOutput || null,
      concepts: Array.isArray(result.challenge.concepts)
        ? result.challenge.concepts
        : ["Conceptos básicos"],
      estimatedTimeMinutes:
        typeof result.challenge.estimatedTimeMinutes === "number"
          ? result.challenge.estimatedTimeMinutes
          : 30,
    };

    return NextResponse.json({ challenge }, { status: 200 });
  } catch (error) {
    console.error("Error generando reto:", error);
    return NextResponse.json(
      {
        error: "No se pudo generar el reto. Por favor intenta de nuevo.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
