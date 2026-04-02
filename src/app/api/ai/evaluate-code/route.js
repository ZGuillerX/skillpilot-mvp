// app/api/ai/evaluate-code/route.js
import { askJSON } from "../../../../lib/ai/groq.js";

// Tecnologías que NO deben validarse con `new Function()` (no son JS puro)
const SKIP_SYNTAX_CHECK = [
  "typescript", "angular", "vue", "python", "java", "kotlin",
  "swift", "rust", "go", "cpp", "c#", "php", "ruby", "dart",
];

function shouldSkipSyntaxCheck(language) {
  if (!language) return true;
  const lang = language.toLowerCase();
  return SKIP_SYNTAX_CHECK.some((skip) => lang.includes(skip));
}

// Combina múltiples archivos en un string legible para el evaluador
function combineFilesForEvaluation(files) {
  if (!files || files.length === 0) return "";

  return files
    .map(
      (file) =>
        `=== ARCHIVO: ${file.filename} ===\n${file.content || ""}`
    )
    .join("\n\n");
}

export async function POST(request) {
  try {
    const { code, files, challenge } = await request.json();

    if (!challenge) {
      return Response.json(
        { error: "El reto es requerido" },
        { status: 400 }
      );
    }

    // Soporte para modo legacy (un solo archivo) y modo multi-archivo
    const hasMultipleFiles = files && Array.isArray(files) && files.length > 0;
    const codeToEvaluate = hasMultipleFiles
      ? combineFilesForEvaluation(files)
      : (code || "");

    if (!codeToEvaluate.trim()) {
      return Response.json(
        {
          success: false,
          score: 0,
          feedback: "No hay código para evaluar. Escribe tu solución primero.",
          suggestions: ["Escribe código en el editor antes de ejecutar"],
        }
      );
    }

    // Validación de sintaxis SOLO para JavaScript puro
    let syntaxError = null;
    if (!shouldSkipSyntaxCheck(challenge.language) && !hasMultipleFiles) {
      try {
        new Function(codeToEvaluate);
      } catch (e) {
        syntaxError = e.message;
      }
    }

    const isMultiFile = hasMultipleFiles && files.length > 1;
    const fileNames = hasMultipleFiles
      ? files.map((f) => f.filename).join(", ")
      : "solution";

    const system = `Eres un evaluador experto de código para estudiantes. Evalúas con criterio profesional pero con mentalidad de mentor. Responde ÚNICAMENTE con JSON válido sin markdown:
{
  "success": boolean,
  "score": number (0-100),
  "feedback": "string",
  "suggestions": ["string"],
  "filesFeedback": [{"filename": "string", "status": "ok|warning|error", "comment": "string"}]
}

## Contexto de evaluación
${isMultiFile ? `Este reto usa MÚLTIPLES ARCHIVOS: ${fileNames}. Evalúa la coherencia entre todos los archivos, no solo uno.` : "Este reto usa un solo archivo."}

## Lenguaje: ${challenge.language}
${challenge.language?.toLowerCase().includes("angular") || challenge.language?.toLowerCase().includes("typescript")
  ? `
REGLAS ESPECIALES PARA TYPESCRIPT/ANGULAR:
- Los decoradores (@Component, @NgModule, @Injectable) son sintaxis VÁLIDA — jamás los marques como error
- Las anotaciones de tipo (: void, : string, : number) son sintaxis VÁLIDA de TypeScript
- Los imports de @angular/* son correctos por definición en un proyecto Angular
- La ausencia de compilación real NO implica error — evalúa la INTENCIÓN y LÓGICA del código
- Un componente bien estructurado con la lógica correcta en ngOnInit = código válido
`
  : ""}

## Proceso de evaluación (en orden)

1. ¿El código está vacío o es solo el placeholder? → score: 0-5, success: false, pide que escriban código
2. ¿Tiene errores de sintaxis confirmados (solo JS puro)? → score máximo 40, success: false
3. ¿La lógica produce resultados incorrectos para los ejemplos? → score máximo 55, success: false
4. ¿Cumple TODOS los criterios de aceptación? → score: 95-100, success: true
5. ¿Cumple el objetivo principal con detalles menores? → score: 80-94, success: true
6. ¿Solución parcial con omisiones menores? → score: 65-79, success: true
7. ¿Código relacionado con errores lógicos significativos? → score: 25-64, success: false

## Lo que NUNCA penaliza
- Notación obj[clave] para propiedades dinámicas
- Nombres de variables cortos en funciones simples
- Ausencia de validación de tipos (salvo que el reto lo exija)
- Ausencia de comentarios
- Usar map/filter/reduce en vez de loops manuales
- Archivos opcionales (HTML/CSS) con contenido mínimo si el reto es sobre lógica TS
- Estructura del componente Angular siendo "boilerplate" — solo importa la lógica del reto

## Lo que SÍ penaliza
- Lógica incorrecta que produce resultados distintos a los esperados → max 55
- No cumplir un criterio de aceptación explícito → -15 por criterio perdido
- Código que es solo el placeholder sin modificación → max 5
- Si hay múltiples archivos: incoherencia entre ellos (ej: método llamado en HTML que no existe en TS) → -20

## Feedback
- Si aprueba: celebra primero ("¡Excelente! Tu ngOnInit hace exactamente lo correcto..."), luego máximo 1 sugerencia real
- Si falla: explica QUÉ está mal y POR QUÉ en términos concretos, no genéricos
- Máximo 3 oraciones, tono mentor no juez
- En español

## filesFeedback
- Incluye una entrada por cada archivo evaluado
- status: "ok" si está bien, "warning" si tiene mejoras menores, "error" si tiene problemas
- comment: 1 oración concisa sobre ese archivo específico`;

    const user = {
      reto: {
        titulo: challenge.title,
        descripcion: challenge.description,
        lenguaje: challenge.language,
        criterios: challenge.acceptanceCriteria,
        exampleInput: challenge.exampleInput,
        exampleOutput: challenge.exampleOutput,
      },
      archivos: hasMultipleFiles
        ? files.map((f) => ({ filename: f.filename, content: f.content }))
        : [{ filename: "solution", content: codeToEvaluate }],
      codigoCombinado: codeToEvaluate,
      errorDeSintaxis: syntaxError,
      esMultiArchivo: isMultiFile,
    };

    let evaluation;
    try {
      evaluation = await askJSON({
        system,
        user,
        temperature: 0,
      });
    } catch (error) {
      console.error("Error en evaluación IA:", error);
      evaluation = null;
    }

    if (!evaluation || typeof evaluation !== "object") {
      return Response.json({
        success: false,
        score: 0,
        feedback: "Error al evaluar el código. Por favor intenta de nuevo.",
        suggestions: ["Verifica que tu código esté completo y bien formateado"],
        filesFeedback: [],
      });
    }

    const result = {
      success: evaluation.success === true,
      score: typeof evaluation.score === "number"
        ? Math.max(0, Math.min(100, evaluation.score))
        : 0,
      feedback: evaluation.feedback || "No se pudo generar retroalimentación",
      suggestions: Array.isArray(evaluation.suggestions)
        ? evaluation.suggestions
        : [],
      filesFeedback: Array.isArray(evaluation.filesFeedback)
        ? evaluation.filesFeedback
        : [],
    };

    return Response.json(result);
  } catch (error) {
    console.error("Error evaluating code:", error);
    return Response.json(
      {
        success: false,
        score: 0,
        feedback: "Error al procesar la evaluación. Por favor intenta de nuevo.",
        suggestions: ["Verifica que tu código esté completo y bien formateado"],
        filesFeedback: [],
        error: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}