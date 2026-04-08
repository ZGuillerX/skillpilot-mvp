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
        label: "Comenzar Ahora",
        href: "/onboarding",
        helper: "Gratis. Sin tarjeta de credito.",
      };
    }

    if (!currentPlan) {
      return {
        label: "Crear Mi Plan",
        href: "/onboarding",
        helper: "Define tu objetivo y domina el codigo.",
      };
    }

    return {
      label: "Continuar Ruta",
      href: "/challenges",
      helper: `${currentPlan.goal}`,
    };
  }, [user, currentPlan]);

  const stats = [
    { value: "∞", label: "Retos Generados" },
    { value: "10+", label: "Lenguajes" },
    { value: "IA", label: "Personalizada" },
    { value: "24/7", label: "Disponible" },
  ];

  const features = [
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      ),
      title: "IA Personalizada",
      description:
        "Retos adaptados a tu nivel y objetivos. La IA analiza tu progreso y ajusta la dificultad.",
      color: "from-blue-500 to-cyan-500",
      href: "/onboarding",
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
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
      ),
      title: "Practica Infinita",
      description:
        "Genera retos ilimitados en cualquier tecnologia. Nunca te quedaras sin contenido nuevo.",
      color: "from-purple-500 to-pink-500",
      href: "/challenges",
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      title: "Progreso Visual",
      description:
        "Dashboard con metricas detalladas. Ve tu crecimiento dia a dia con estadisticas claras.",
      color: "from-emerald-500 to-teal-500",
      href: "/stats",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Define tu Meta",
      desc: "Cuentanos que quieres lograr y en cuanto tiempo.",
    },
    {
      number: "02",
      title: "Recibe tu Plan",
      desc: "La IA crea una ruta personalizada para ti.",
    },
    {
      number: "03",
      title: "Practica Diario",
      desc: "Completa retos cortos y recibe feedback instant.",
    },
    {
      number: "04",
      title: "Domina el Codigo",
      desc: "Alcanza tus objetivos con consistencia.",
    },
  ];

  return (
    <main className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-full blur-3xl animate-float" />
          <div
            className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gradient-to-r from-purple-600/30 to-cyan-600/30 rounded-full blur-3xl animate-float"
            style={{ animationDelay: "-2s" }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />

          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium text-foreground/80">
                  Impulsado por Inteligencia Artificial
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight">
                <span className="text-foreground">Domina el</span>
                <br />
                <span className="text-gradient">Codigo</span>
                <br />
                <span className="text-foreground/60">Paso a Paso</span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
                La plataforma que adapta el aprendizaje a tu ritmo. Retos
                personalizados, feedback instantaneo y una ruta clara hacia tus
                objetivos.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href={primaryAction.href}
                  className="btn-primary text-lg px-8 py-4 group"
                >
                  {primaryAction.label}
                  <svg
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </a>
                <a
                  href="/challenges"
                  className="btn-secondary text-lg px-8 py-4"
                >
                  Ver Demo
                </a>
              </div>

              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-emerald-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {authLoading || loadingPlan
                  ? "Cargando..."
                  : primaryAction.helper}
              </p>
            </div>

            {/* Right Content - Stats Grid */}
            <div
              className="hidden lg:grid grid-cols-2 gap-4 animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              {stats.map((stat, i) => (
                <div
                  key={stat.label}
                  className="card-premium p-8 text-center group"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="text-4xl font-black text-gradient mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Stats */}
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 lg:hidden animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="glass rounded-xl p-4 text-center"
              >
                <div className="text-2xl font-bold text-gradient">
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 animate-fade-in-up">
            <span className="badge-primary mb-4">Caracteristicas</span>
            <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4">
              Todo lo que Necesitas
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Herramientas poderosas diseñadas para acelerar tu crecimiento como
              desarrollador.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <a
                key={feature.title}
                href={feature.href}
                className="card-premium group p-8 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-gradient transition-all">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {feature.description}
                </p>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all">
                  Explorar
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 animate-fade-in-up">
            <span className="badge-secondary mb-4">Proceso</span>
            <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4">
              Como Funciona
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Cuatro pasos simples para transformar tu carrera como
              desarrollador.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className="relative group animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                )}
                <div className="relative glass rounded-2xl p-6 hover:border-primary/50 transition-colors">
                  <span className="text-5xl font-black text-gradient opacity-20 absolute top-4 right-4">
                    {step.number}
                  </span>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xl mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent" />

        <div className="relative max-w-4xl mx-auto px-6 text-center animate-fade-in-up">
          <div className="glass rounded-3xl p-12 md:p-16 border border-primary/20">
            <h2 className="text-4xl md:text-5xl font-black text-foreground mb-6">
              Listo para
              <span className="text-gradient"> Empezar?</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Mejora tus habilidades de programación con retos personalizados
              por IA. Tu primer reto te espera.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={primaryAction.href}
                className="btn-primary text-lg px-10 py-4 group"
              >
                {primaryAction.label}
                <svg
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </a>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Sin compromisos. Cancela cuando quieras.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="font-bold text-foreground">SkillPilot</span>
            </div>
            <p className="text-sm text-muted-foreground">
              2024 SkillPilot. Aprende codigo, domina tu futuro.
            </p>
            <div className="flex gap-6">
              <a
                href="/challenges"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Retos
              </a>
              <a
                href="/stats"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Stats
              </a>
              <a
                href="/profile"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Perfil
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
