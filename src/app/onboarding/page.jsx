"use client";
import { useState } from "react";
import PlanView from "../../components/PlanView";

export default function Onboarding() {
  const [goal, setGoal] = useState("");
  const [experience, setExperience] = useState("");
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handleGenerate() {
    setLoading(true);
    setErr("");
    setPlan(null);
    try {
      const res = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, experience }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error generando plan");
      setPlan(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Generador de Planes IA
            </div>

            <h1 className="text-4xl font-black text-foreground">
              Crea tu Ruta de Aprendizaje
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Describe tu objetivo de aprendizaje y tu experiencia actual.
              Nuestra IA creará un plan personalizado para ti.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-card-foreground">
                ¿Qué quieres aprender? *
              </label>
              <input
                className="w-full border border-border rounded-lg px-4 py-3 bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                placeholder="Ej: Desarrollo web con React, Python para ciencia de datos..."
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-card-foreground">
                Cuéntanos sobre tu experiencia (opcional)
              </label>
              <textarea
                className="w-full border border-border rounded-lg px-4 py-3 bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors resize-none"
                rows={4}
                placeholder="Ej: Soy principiante, tengo experiencia en HTML/CSS, trabajo como diseñador..."
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !goal}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading ? (
                <>
                  <svg
                    className="w-5 h-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Generando plan...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Generar Plan de Aprendizaje
                </>
              )}
            </button>

            {err && (
              <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <svg
                  className="w-5 h-5 text-destructive flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-destructive font-medium">{err}</p>
              </div>
            )}
          </div>
        </div>

        {plan && (
          <div className="mt-12">
            <PlanView plan={plan} />
          </div>
        )}
      </div>
    </div>
  );
}
