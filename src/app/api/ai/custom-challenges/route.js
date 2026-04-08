import { NextResponse } from "next/server";
import { askJSON } from "@/lib/ai/groq";
import pool from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { getAuthContext } from "@/lib/workspace";
import { enforceWorkspaceQuota } from "@/lib/quota";
import { logAuditEvent } from "@/lib/audit";

const SYSTEM_CUSTOM_CHALLENGES = `
Eres un generador experto de retos de programación personalizados para SkillPilot.
Basándote en la idea o descripción que el usuario proporciona, generarás un reto PRÁCTICO,
CLARO y MOTIVADOR.

REGLAS CRÍTICAS:
- Genera retos basados EXACTAMENTE en lo que el usuario describe
- Si el usuario no especifica dificultad, infiere una dificultad basada en la complejidad
- Asegúrate de que el reto sea alcanzable pero desafiante
- Proporciona criterios de aceptación CLAROS y verificables
- Incluye pistas útiles que NO revelen la solución
- Adapta el tiempo estimado a la dificultad

RESPONDE EXCLUSIVAMENTE EN JSON con esta estructura EXACTA:

{
  "challenge": {
    "id": "string-uuid",
    "title": "string - título conciso y motivador",
    "description": "string - descripción detallada del problema",
    "language": "string - lenguaje de programación",
    "difficulty": "beginner|intermediate|advanced",
    "acceptanceCriteria": ["criterio1", "criterio2", "criterio3"],
    "hints": ["pista1", "pista2", "pista3"],
    "exampleInput": "string (si aplica)",
    "exampleOutput": "string (si aplica)",
    "concepts": ["concepto1", "concepto2"],
        "estimatedTimeMinutes": number,
        "capabilities": ["decomposicion", "depuracion"],
        "projectTask": {
            "week": 1,
            "title": "string",
            "objective": "string"
        }
  }
}

INSTRUCCIONES DE GENERACIÓN:
1. Lee cuidadosamente la idea del usuario
2. Interpreta la intención y el nivel esperado
3. Expande la idea en un reto completo y bien definido
4. Genera un título que sea motivador y específico
5. Proporciona criterios de aceptación measurables
6. Incluye ejemplos cuando sea relevante
7. Estima un tiempo realista de completación

ESTILO:
- Mantén un tono profesional pero accesible
- Sé específico en los requisitos
- Proporciona contexto práctico cuando sea posible
`;

export async function POST(request) {
    try {
        const auth = await getAuthContext(request);
        if (auth.error) {
            return NextResponse.json(
                { error: auth.error },
                { status: auth.status || 401 }
            );
        }

        const quota = await enforceWorkspaceQuota({
            workspaceId: auth.workspaceId,
            metric: "custom_challenge_generate",
            increment: 1,
        });

        if (!quota.allowed) {
            return NextResponse.json(
                {
                    error: "Limite diario alcanzado para retos personalizados",
                    quota,
                },
                { status: 429 }
            );
        }

        const { idea, language, difficulty } = await request.json();

        // Validar entrada
        if (!idea || idea.trim().length < 10) {
            return NextResponse.json(
                { error: "La idea debe tener al menos 10 caracteres" },
                { status: 400 }
            );
        }

        if (!language || language.trim().length === 0) {
            return NextResponse.json(
                { error: "El lenguaje de programación es requerido" },
                { status: 400 }
            );
        }

        // Construir prompt
        const prompt = `
El usuario quiere crear un reto personalizado con la siguiente idea:

Idea: ${idea}
Lenguaje: ${language}
${difficulty ? `Dificultad sugerida: ${difficulty}` : ""}

Basándote en esta información, genera un reto completo de programación.
`;

        // Llamar a IA
        const result = await askJSON({
            system: SYSTEM_CUSTOM_CHALLENGES,
            user: prompt,
        });

        const fallbackDifficulty =
            difficulty && ["beginner", "intermediate", "advanced"].includes(difficulty)
                ? difficulty
                : "intermediate";

        // Fallback para evitar 500 cuando el modelo responde malformado.
        const fallbackChallenge = {
            id: uuidv4(),
            title: `Reto personalizado: ${idea.trim().slice(0, 40)}`,
            description: `Implementa una solucion en ${language} basada en esta idea: ${idea.trim()}`,
            language: language.trim(),
            difficulty: fallbackDifficulty,
            acceptanceCriteria: [
                "La solucion debe resolver correctamente el problema principal.",
                "El codigo debe estar estructurado y ser legible.",
                "La salida debe coincidir con los casos esperados.",
            ],
            hints: [
                "Divide el problema en pasos pequenos.",
                "Valida casos borde antes del flujo principal.",
                "Prueba con entradas simples y luego complejas.",
            ],
            exampleInput: "entrada de ejemplo",
            exampleOutput: "salida esperada",
            concepts: ["logica", "validacion", "estructuras de datos"],
            estimatedTimeMinutes: fallbackDifficulty === "beginner" ? 20 : fallbackDifficulty === "advanced" ? 45 : 30,
            capabilities: ["decomposicion", "depuracion"],
            projectTask: {
                week: 1,
                title: "Proyecto vivo inicial",
                objective: "Integra este reto en un mini proyecto que crezca con cada nuevo reto.",
            },
        };

        const challenge = result?.challenge && typeof result.challenge === "object"
            ? {
                ...fallbackChallenge,
                ...result.challenge,
                language: result.challenge.language || language.trim(),
                difficulty: ["beginner", "intermediate", "advanced"].includes(result.challenge.difficulty)
                    ? result.challenge.difficulty
                    : fallbackDifficulty,
                acceptanceCriteria: Array.isArray(result.challenge.acceptanceCriteria) && result.challenge.acceptanceCriteria.length > 0
                    ? result.challenge.acceptanceCriteria
                    : fallbackChallenge.acceptanceCriteria,
                hints: Array.isArray(result.challenge.hints) && result.challenge.hints.length > 0
                    ? result.challenge.hints
                    : fallbackChallenge.hints,
                concepts: Array.isArray(result.challenge.concepts) && result.challenge.concepts.length > 0
                    ? result.challenge.concepts
                    : fallbackChallenge.concepts,
                capabilities: Array.isArray(result.challenge.capabilities) && result.challenge.capabilities.length > 0
                    ? result.challenge.capabilities.slice(0, 2)
                    : fallbackChallenge.capabilities,
                projectTask: result.challenge.projectTask && typeof result.challenge.projectTask === "object"
                    ? result.challenge.projectTask
                    : fallbackChallenge.projectTask,
            }
            : fallbackChallenge;

        // Generar ID si no existe
        if (!challenge.id) {
            challenge.id = uuidv4();
        }

        const now = new Date();

        // Mover retos activos anteriores al historial para que "Todos" muestre solo lo mas reciente.
        await pool.query(
            `
            UPDATE custom_challenges
            SET status = 'abandoned', completed_at = ?, updated_at = ?
            WHERE user_id = ? AND status IN ('generated', 'in_progress')
            `,
            [now, now, auth.userId]
        );

        // Guardar nuevo reto en base de datos
        const customChallengeId = uuidv4();

        const query = `
      INSERT INTO custom_challenges 
      (id, user_id, challenge_data, status, created_at, updated_at)
      VALUES (?, ?, ?, 'generated', ?, ?)
    `;

        await pool.query(query, [
            customChallengeId,
            auth.userId,
            JSON.stringify(challenge),
            now,
            now,
        ]);

        await logAuditEvent({
            workspaceId: auth.workspaceId,
            userId: auth.userId,
            action: "ai.custom_challenge.generate",
            targetType: "custom_challenge",
            targetId: customChallengeId,
            status: "success",
            metadata: {
                language,
                difficulty: challenge.difficulty,
                quotaRemaining: quota.remaining,
            },
            ipAddress: auth.requestMeta.ipAddress,
            userAgent: auth.requestMeta.userAgent,
        });

        return NextResponse.json({
            success: true,
            customChallengeId,
            challenge,
            quota,
        });
    } catch (error) {
        console.error("Error generando reto personalizado:", error);
        return NextResponse.json(
            { error: "Error al generar el reto" },
            { status: 500 }
        );
    }
}
