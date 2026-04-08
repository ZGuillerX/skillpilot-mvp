"use client";

import { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  useEffect(() => {
    const loadProgress = async () => {
      if (!user) {
        setCurrentPlan(null);
        return;
      }

      try {
        setLoadingPlan(true);
        const token = Cookies.get("token");
        const res = await fetch("/api/user/progress", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          setCurrentPlan(null);
          return;
        }

        const data = await res.json();
        const plan = data?.progress?.learning_plan?.currentPlan || null;
        setCurrentPlan(plan);
      } catch {
        setCurrentPlan(null);
      } finally {
        setLoadingPlan(false);
      }
    };

    if (!authLoading) {
      loadProgress();
    }
  }, [user, authLoading]);

  const primaryAction = useMemo(() => {
    if (!user) {
      return {
        label: "Empezar mi ruta",
        href: "/onboarding",
        helper: "Te guiamos paso a paso desde cero.",
      };
    }

    if (!currentPlan) {
      return {
        label: "Crear mi primer plan",
        href: "/onboarding",
        helper: "Define tu objetivo y recibe una ruta clara.",
      };
    }

    return {
      label: "Continuar siguiente paso",
      href: "/challenges",
      helper: `Plan activo: ${currentPlan.goal}`,
    };
  }, [user, currentPlan]);

  return (
    <main className="min-h-screen bg-background">
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="max-w-3xl space-y-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold">
              Ruta clara para aprender programacion
            </span>

            <h1 className="text-4xl md:text-5xl font-black text-foreground leading-tight">
              Aprende sin perderte.
              <br />
              <span className="text-primary">Un paso a la vez.</span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed">
              SkillPilot organiza tu camino en tres modos simples: aprender,
              practicar y construir. Siempre sabras cual es tu siguiente paso.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
              <a
                href={primaryAction.href}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                {primaryAction.label}
              </a>
              <p className="text-sm text-muted-foreground">
                {authLoading || loadingPlan
                  ? "Cargando tu progreso..."
                  : primaryAction.helper}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          <article className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
              1
            </div>
            <h2 className="text-xl font-bold text-foreground">Aprender</h2>
            <p className="text-sm text-muted-foreground">
              Define tu meta y recibe un plan guiado con modulos claros para no
              sentirte perdido.
            </p>
            <a
              href="/onboarding"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Crear o ajustar plan
            </a>
          </article>

          <article className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center text-accent font-bold">
              2
            </div>
            <h2 className="text-xl font-bold text-foreground">Practicar</h2>
            <p className="text-sm text-muted-foreground">
              Entrena con retos guiados y feedback inmediato para consolidar lo
              que vas aprendiendo.
            </p>
            <a
              href="/challenges"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Ir a practica
            </a>
          </article>

          <article className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="w-10 h-10 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary font-bold">
              3
            </div>
            <h2 className="text-xl font-bold text-foreground">Construir</h2>
            <p className="text-sm text-muted-foreground">
              Crea tus propios retos con IA para aplicar lo aprendido en casos
              mas reales.
            </p>
            <a
              href="/custom-challenges"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Crear reto propio
            </a>
          </article>
        </div>
      </section>
    </main>
  );
}
