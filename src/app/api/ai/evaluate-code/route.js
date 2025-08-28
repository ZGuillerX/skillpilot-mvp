import { askJSON } from "../../../../lib/ai/groq.js";

export async function POST(request) {
  try {
    const { code, challenge } = await request.json();

    if (!code || !challenge) {
      return Response.json(
        { error: "Código y reto son requeridos" },
        { status: 400 }
      );
    }

    const system = `Eres un evaluador experto de código. Evalúa el código basándote en el reto dado y responde ÚNICAMENTE con un JSON válido con esta estructura:
{
  "success": boolean,
  "score": number (0-100),
  "feedback": "string con retroalimentación detallada",
  "suggestions": ["array", "de", "sugerencias", "específicas"]
}

Criterios de evaluación:
- ¿Cumple con los criterios de aceptación?
- ¿Es sintácticamente correcto?
- ¿Sigue buenas prácticas?
- ¿Es legible y está bien estructurado?
- ¿Maneja casos edge apropiadamente?

Sé constructivo pero honesto en tu evaluación.`;

    const user = {
      reto: {
        titulo: challenge.title,
        descripcion: challenge.description,
        lenguaje: challenge.language,
        criterios: challenge.acceptanceCriteria,
      },
      codigo: code,
    };

    const evaluation = await askJSON({
      system,
      user,
    });

    // Validate the response structure
    if (!evaluation || typeof evaluation !== "object") {
      throw new Error("Invalid evaluation response");
    }

    // Ensure required fields exist with defaults
    const result = {
      success: evaluation.success || false,
      score: typeof evaluation.score === "number" ? evaluation.score : 0,
      feedback: evaluation.feedback || "No se pudo generar retroalimentación",
      suggestions: Array.isArray(evaluation.suggestions)
        ? evaluation.suggestions
        : ["Intenta de nuevo"],
    };

    return Response.json(result);
  } catch (error) {
    console.error("Error evaluating code:", error);
    return Response.json(
      {
        success: false,
        score: 0,
        feedback:
          "Error al procesar la evaluación. Por favor intenta de nuevo.",
        suggestions: ["Verifica que tu código esté completo y bien formateado"],
        error: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
