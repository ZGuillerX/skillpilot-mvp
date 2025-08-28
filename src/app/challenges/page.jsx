import InfiniteChallengeCard from "@/components/InfiniteChallengeCard";

export default function ChallengesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
              Retos de Programación IA
            </div>

            <h1 className="text-4xl font-black text-foreground">
              Retos Infinitos
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Practica y mejora tus habilidades con retos progresivos generados
              por inteligencia artificial. Avanza a tu ritmo y construye una
              base sólida de conocimiento.
            </p>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <InfiniteChallengeCard />
      </div>

      {/* Footer con tips */}
      <div className="bg-muted/50 border-t border-border">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-foreground mb-2">
              💡 Tips para resolver retos
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
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
              <h3 className="font-semibold text-foreground">
                Lee con atención
              </h3>
              <p className="text-sm text-muted-foreground">
                Comprende bien el problema antes de empezar a escribir código
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto">
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
              <h3 className="font-semibold text-foreground">
                Prueba paso a paso
              </h3>
              <p className="text-sm text-muted-foreground">
                Escribe y prueba tu código en pequeños incrementos
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto">
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
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground">No te rindas</h3>
              <p className="text-sm text-muted-foreground">
                Usa las pistas y aprende de los errores. ¡La práctica hace al
                maestro!
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <a
              href="/onboarding"
              className="text-primary hover:text-primary/80 font-medium text-sm"
            >
              ← Volver al generador de planes
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
