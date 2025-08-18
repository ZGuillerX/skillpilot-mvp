export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              Plataforma de Aprendizaje IA
            </div>

            <h1 className="text-5xl md:text-6xl font-black text-foreground tracking-tight">
              Skill<span className="text-primary">Pilot</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Crea planes de aprendizaje personalizados con inteligencia
              artificial. Acelera tu crecimiento profesional con rutas
              optimizadas para tu nivel.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <a
                href="/onboarding"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl"
              >
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
                Crear Plan de Aprendizaje
              </a>

              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 bg-primary/20 rounded-full border-2 border-background"></div>
                  <div className="w-8 h-8 bg-secondary/20 rounded-full border-2 border-background"></div>
                  <div className="w-8 h-8 bg-accent/20 rounded-full border-2 border-background"></div>
                </div>
                <span className="text-sm">+1,000 desarrolladores</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Funcionalidades Principales
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Herramientas avanzadas para acelerar tu aprendizaje y desarrollo
            profesional
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-2">
              Generador de Planes IA
            </h3>
            <p className="text-muted-foreground">
              Crea planes de aprendizaje personalizados adaptados a tu nivel y
              objetivos específicos
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-2">
              Evaluación de Código
            </h3>
            <p className="text-muted-foreground">
              Sistema inteligente que evalúa tu código y proporciona
              retroalimentación detallada
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-2">
              Seguimiento de Progreso
            </h3>
            <p className="text-muted-foreground">
              Monitorea tu avance con métricas detalladas y visualizaciones
              interactivas
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-primary to-secondary">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            ¿Listo para acelerar tu aprendizaje?
          </h2>
          <p className="text-primary-foreground/90 text-lg mb-8 max-w-2xl mx-auto">
            Únete a miles de desarrolladores que ya están usando SkillPilot para
            mejorar sus habilidades
          </p>
          <a
            href="/onboarding"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary rounded-lg font-semibold hover:bg-gray-50 transition-colors shadow-lg"
          >
            Comenzar Ahora
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
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </a>
        </div>
      </div>
    </main>
  );
}
