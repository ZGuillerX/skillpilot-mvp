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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-primary/10 to-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-accent/10 to-cyan-600/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative glass border-b border-border/30">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center space-y-6 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 glass border border-primary/20 rounded-full text-sm font-semibold">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <span className="text-foreground/80">Impulsado por IA</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-black text-foreground leading-tight">
              Crea tu Ruta de
              <br />
              <span className="text-gradient">Aprendizaje</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Describe tu objetivo y nuestra IA creara un plan personalizado con
              modulos, retos y proyectos adaptados a tu nivel.
            </p>
          </div>
        </div>
      </div>

      <div className="relative max-w-4xl mx-auto px-6 py-12">
        <div
          className="card-premium p-8 animate-fade-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-bold text-foreground flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                ¿Que quieres aprender?
              </label>
              <input
                className="input-premium w-full"
                placeholder="Ej: Desarrollo web con React, Python para ciencia de datos..."
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-foreground flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Cuentanos sobre tu experiencia (opcional)
              </label>
              <textarea
                className="input-premium w-full min-h-[120px] resize-none"
                rows={4}
                placeholder="Ej: Soy principiante, tengo experiencia en HTML/CSS, trabajo como diseñador..."
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !goal}
              className="btn-primary w-full sm:w-auto px-10 py-4 text-base"
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
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl animate-shake">
                <svg
                  className="w-5 h-5 text-red-400 flex-shrink-0"
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
                <p className="text-red-400 font-medium">{err}</p>
              </div>
            )}
          </div>
        </div>

        {plan && (
          <div className="mt-12 animate-fade-in-up">
            <PlanView plan={plan} />
          </div>
        )}
      </div>
    </div>
  );
}
