import { NextResponse } from "next/server";
import { askJSON } from "@/lib/ai/groq";

const SYSTEM_CHALLENGES = `
Eres un generador experto de retos de programación para SkillPilot.
Generas retos PROGRESIVOS, PRÁCTICOS y MOTIVADORES adaptados al nivel real del estudiante.

REGLAS CRÍTICAS:
- Genera retos EXCLUSIVAMENTE para la tecnología/lenguaje solicitado
- Los retos deben ser PROGRESIVOS: cada uno más complejo que el anterior
- Adapta la dificultad según el nivel (beginner/intermediate/advanced)
- NUNCA mezcles tecnologías diferentes
- Los retos beginner deben ser MUY simples y alcanzables en pocos minutos
- Los retos deben tener contexto práctico y motivador

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

PROGRESIÓN DETALLADA POR NIVEL:

BEGINNER (retos 1-4):
- Reto 1: Sintaxis más básica posible — imprimir texto, declarar variables
- Reto 2: Operaciones simples — sumar dos números, concatenar strings
- Reto 3: Condicional simple — if/else con una condición
- Reto 4: Bucle básico — recorrer un array o repetir algo N veces
- Tiempo estimado: 5-15 minutos
- Descripción muy clara, con ejemplo de entrada y salida

BEGINNER → INTERMEDIATE (retos 5-7):
- Reto 5: Función simple con parámetros y return
- Reto 6: Manipulación de arrays u objetos básica
- Reto 7: Combinar condicionales y bucles
- Tiempo estimado: 15-25 minutos

INTERMEDIATE (retos 8-12):
- Estructuras de datos: arrays de objetos, diccionarios anidados
- Funciones con múltiples parámetros y lógica real
- Manejo de strings avanzado
- Algoritmos simples: buscar, filtrar, transformar datos
- Tiempo estimado: 20-40 minutos

INTERMEDIATE → ADVANCED (retos 13-15):
- Algoritmos con múltiples pasos
- Manejo de errores y validaciones
- Funciones que llaman a otras funciones
- Tiempo estimado: 30-50 minutos

ADVANCED (retos 16+):
- Recursión, divide y vencerás
- Patrones de diseño aplicados
- Optimización y performance
- Arquitectura de soluciones
- Tiempo estimado: 45-90 minutos

TONO Y ESTILO:
- Títulos motivadores y concretos: "Calcula el área de un rectángulo" no "Función matemática"
- Descripción clara con contexto del mundo real cuando sea posible
- Ejemplos de entrada/salida siempre que aplique
- Criterios de aceptación específicos y verificables, no genéricos
- Pistas que guíen sin dar la solución

EJEMPLOS DE BUENA PROGRESIÓN para JavaScript:
1. "Imprime tu nombre en consola" (beginner puro)
2. "Suma dos números y muestra el resultado" (beginner)
3. "Di si un número es positivo, negativo o cero" (beginner)
4. "Muestra los números del 1 al 10" (beginner)
5. "Crea una función que devuelva el doble de un número" (beginner+)
6. "Filtra los números pares de un array" (intermediate-)
7. "Encuentra el número mayor de un array" (intermediate)
8. "Cuenta cuántas veces aparece cada palabra en un texto" (intermediate)
9. "Ordena un array de objetos por una propiedad" (intermediate+)
10. "Implementa una función de búsqueda binaria" (advanced)
`;

function generateFallbackChallenge(index, language, difficulty, goal) {
  const byDifficulty = {
    beginner: [
      {
        title: "Imprime un mensaje",
        description: `Crea un programa en ${language} que imprima el mensaje "¡Hola, mundo!" en la consola.`,
        concepts: ["consola", "output", "sintaxis básica"],
        exampleInput: "ninguno",
        exampleOutput: "¡Hola, mundo!",
        estimatedTimeMinutes: 5,
      },
      {
        title: "Suma dos números",
        description: `Crea una función en ${language} que reciba dos números y devuelva su suma.`,
        concepts: ["funciones", "parámetros", "return"],
        exampleInput: "suma(3, 5)",
        exampleOutput: "8",
        estimatedTimeMinutes: 10,
      },
      {
        title: "¿Es par o impar?",
        description: `Crea una función que reciba un número y devuelva "par" si es par o "impar" si no lo es.`,
        concepts: ["condicionales", "módulo", "funciones"],
        exampleInput: "parOImpar(4)",
        exampleOutput: '"par"',
        estimatedTimeMinutes: 10,
      },
    ],
    intermediate: [
      {
        title: "Filtrar array de objetos",
        description: `Crea una función que reciba un array de objetos y devuelva solo los que cumplan una condición dada.`,
        concepts: ["arrays", "filter", "objetos"],
        exampleInput: "filtrar([{nombre:'Ana', edad:20}], 'edad', 20)",
        exampleOutput: "[{nombre:'Ana', edad:20}]",
        estimatedTimeMinutes: 25,
      },
      {
        title: "Contador de palabras",
        description: `Crea una función que cuente la frecuencia de cada palabra en un texto y devuelva un objeto con los resultados.`,
        concepts: ["strings", "objetos", "loops"],
        exampleInput: "contarPalabras('el gato y el perro')",
        exampleOutput: "{ el: 2, gato: 1, y: 1, perro: 1 }",
        estimatedTimeMinutes: 30,
      },
    ],
    advanced: [
      {
        title: "Búsqueda binaria",
        description: `Implementa una función de búsqueda binaria que encuentre el índice de un elemento en un array ordenado. Debe retornar -1 si no existe.`,
        concepts: ["algoritmos", "recursión", "divide y vencerás"],
        exampleInput: "busquedaBinaria([1,3,5,7,9], 5)",
        exampleOutput: "2",
        estimatedTimeMinutes: 45,
      },
    ],
  };

  const pool = byDifficulty[difficulty] || byDifficulty.beginner;
  const template = pool[index % pool.length];

  return {
    id: `fallback-${index}-${Date.now()}`,
    title: template.title,
    description: template.description,
    language,
    difficulty,
    acceptanceCriteria: [
      "El código ejecuta sin errores de sintaxis",
      "La función devuelve el resultado correcto",
      "Funciona con los ejemplos dados",
    ],
    hints: [
      "Lee el ejemplo de entrada y salida con cuidado",
      "Empieza con el caso más simple antes de complicarlo",
    ],
    exampleInput: template.exampleInput,
    exampleOutput: template.exampleOutput,
    concepts: template.concepts,
    estimatedTimeMinutes: template.estimatedTimeMinutes,
  };
}

function getTargetDifficulty(currentChallenge, baseDifficulty) {
  if (baseDifficulty === "beginner") {
    if (currentChallenge < 5) return "beginner";
    if (currentChallenge < 10) return "intermediate";
    return "advanced";
  }

  if (baseDifficulty === "intermediate") {
    if (currentChallenge < 3) return "beginner";
    if (currentChallenge < 10) return "intermediate";
    return "advanced";
  }

  // advanced
  if (currentChallenge < 2) return "beginner";
  if (currentChallenge < 5) return "intermediate";
  return "advanced";
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

    const targetDifficulty = getTargetDifficulty(currentChallenge, level);

    const userPrompt = {
      goal,
      level,
      language,
      targetDifficulty,
      challengeNumber: currentChallenge + 1,
      previousChallenges: previousChallenges.slice(-3),
      instructions: `
        Genera el reto número ${currentChallenge + 1} para alguien aprendiendo ${goal}.

        Contexto:
        - Nivel base del usuario: ${level}
        - Dificultad objetivo para este reto: ${targetDifficulty}
        - Lenguaje/tecnología: ${language}
        - Número de reto en la secuencia: ${currentChallenge + 1}

        El reto debe:
        1. Ser específico para ${language}
        2. Tener dificultad ${targetDifficulty} según la guía de progresión
        3. Ser más complejo que los retos anteriores
        4. Incluir conceptos relevantes para ${goal}
        5. Tener descripción clara con ejemplo de entrada y salida
        6. Ser alcanzable — no frustrante

        ${currentChallenge === 0
          ? "Este es el PRIMER reto. Debe ser muy simple y accesible para alguien que está comenzando."
          : `Retos anteriores: ${previousChallenges.slice(-2).map(c => c.title).join(", ")}. No los repitas.`
        }
      `,
    };

    let result;
    try {
      result = await askJSON({
        system: SYSTEM_CHALLENGES,
        user: userPrompt,
        model: "llama-3.3-70b-versatile",
        temperature: 0.7, // Un poco de creatividad para variar los retos
      });
    } catch (error) {
      console.log("Primary model failed:", error.message);

      if (error.message?.includes("429") || error.message?.includes("rate_limit")) {
        console.log("Rate limit reached, using fallback");
        result = { challenge: generateFallbackChallenge(currentChallenge, language, targetDifficulty, goal) };
      } else {
        try {
          result = await askJSON({
            system: SYSTEM_CHALLENGES,
            user: userPrompt,
            model: "llama-3.1-8b-instant",
            temperature: 0.7,
          });
        } catch {
          console.log("All models failed, using fallback");
          result = { challenge: generateFallbackChallenge(currentChallenge, language, targetDifficulty, goal) };
        }
      }
    }

    if (!result?.challenge) {
      result = { challenge: generateFallbackChallenge(currentChallenge, language, targetDifficulty, goal) };
    }

    const challenge = {
      id: result.challenge.id || `challenge-${currentChallenge + 1}-${Date.now()}`,
      title: result.challenge.title || `Reto ${currentChallenge + 1}`,
      description: result.challenge.description || "Descripción no disponible",
      language,
      difficulty: targetDifficulty,
      acceptanceCriteria: Array.isArray(result.challenge.acceptanceCriteria)
        ? result.challenge.acceptanceCriteria
        : ["El código ejecuta sin errores", "Cumple con los requisitos", "Devuelve el resultado correcto"],
      hints: Array.isArray(result.challenge.hints)
        ? result.challenge.hints
        : ["Lee el ejemplo con cuidado", "Empieza con el caso más simple"],
      exampleInput: result.challenge.exampleInput || null,
      exampleOutput: result.challenge.exampleOutput || null,
      concepts: Array.isArray(result.challenge.concepts)
        ? result.challenge.concepts
        : ["Conceptos básicos"],
      estimatedTimeMinutes: typeof result.challenge.estimatedTimeMinutes === "number"
        ? result.challenge.estimatedTimeMinutes
        : 15,
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