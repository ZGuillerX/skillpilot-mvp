import { NextResponse } from "next/server";
import { askAI } from "@/lib/ai/ai";
import { SYSTEM_PLAN } from "@/lib/ai/prompts";
import { validateAllPlanResources } from "../../../../lib/url-validator";
import crypto from "node:crypto";

function normalizePlan(body) {
  const plan = { modules: [], totalEstimatedHours: 0, ...body };

  // Garantiza que los módulos tengan la estructura correcta
  if (!Array.isArray(plan.modules)) plan.modules = [];

  // Solo procesar módulos que ya existen y tienen recursos válidos
  plan.modules = plan.modules
    .map((m) => ({
      id: m.id || crypto.randomUUID(),
      title: m.title || "Módulo",
      description: m.description || "",
      resource: m.resource, // Keep original resource, don't add fallbacks
      outcomes:
        Array.isArray(m.outcomes) && m.outcomes.length
          ? m.outcomes
          : ["Objetivo de aprendizaje"],
      estimatedTimeHours: Number.isFinite(m.estimatedTimeHours)
        ? m.estimatedTimeHours
        : 2,
    }))
    .filter((m) => m.resource && m.resource.url); // Only keep modules with valid resources

  plan.totalEstimatedHours = plan.modules.reduce(
    (acc, m) => acc + (m.estimatedTimeHours || 0),
    0
  );

  if (!plan.startingChallenge) {
    plan.startingChallenge = {
      title: "Reto inicial",
      description:
        "Implementa una solución básica usando los conceptos fundamentales.",
      language: "generic",
      acceptanceCriteria: [
        "Funciona correctamente",
        "Código limpio y comentado",
        "Incluye documentación básica",
      ],
    };
  }

  return plan;
}

export async function POST(req) {
  try {
    const { goal, experience } = await req.json();

    if (!goal || typeof goal !== "string") {
      return NextResponse.json(
        {
          error:
            "Falta 'goal' (ej: 'back-end con Node.js' o 'análisis de datos con Python').",
        },
        { status: 400 }
      );
    }

    // 🚀 ahora usamos askAI en lugar de askJSON
    const aiRaw = await askAI({
      system: SYSTEM_PLAN,
      user: { goal, experience: experience || "" },
    });

    const plan = await normalizePlan({
      goal: aiRaw.goal || goal,
      level: aiRaw.level || "beginner",
      rationale:
        aiRaw.rationale || "Plan generado automáticamente según el objetivo.",
      modules: aiRaw.modules || [],
      totalEstimatedHours: aiRaw.totalEstimatedHours,
      startingChallenge: aiRaw.startingChallenge,
    });

    console.log("[v0] Starting URL validation for generated plan...");
    const validatedPlan = await validateAllPlanResources(plan);
    console.log("[v0] URL validation completed");

    return NextResponse.json(validatedPlan, { status: 200 });
  } catch (e) {
    console.error("plan endpoint error:", e);
    return NextResponse.json(
      {
        error:
          "No se pudo generar el plan. Revisa tu API key o inténtalo de nuevo.",
      },
      { status: 500 }
    );
  }
}
