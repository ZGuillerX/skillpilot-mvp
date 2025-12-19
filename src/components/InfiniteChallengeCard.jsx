"use client";
import { useState, useEffect } from "react";

const MONACO_THEMES = [
  { name: "Visual Studio Dark", value: "vs-dark", color: "#1e1e1e" },
  { name: "Visual Studio Light", value: "vs-light", color: "#fff" },
  { name: "GitHub Dark", value: "github-dark", color: "#0d1117" },
  { name: "GitHub Light", value: "github-light", color: "#fff" },
  { name: "Dracula", value: "dracula", color: "#282a36" },
  { name: "Monokai", value: "monokai", color: "#272822" },
  { name: "Solarized Dark", value: "solarized-dark", color: "#002b36" },
  { name: "Solarized Light", value: "solarized-light", color: "#fdf6e3" },
  { name: "One Dark", value: "onedark", color: "#282c34" },
  { name: "Nord", value: "nord", color: "#2e3440" },
];

import Editor from "@/components/Editor";
import {
  getCurrentChallengeIndex,
  setCurrentChallengeIndex,
  getChallengeFromHistory,
  saveChallengeToHistory,
  generateChallenge,
  getLearningPlan,
  getCompletedChallengesCount,
  getAverageScore,
  getTotalAttempts,
} from "@/lib/challengeManager";

export default function InfiniteChallengeCard() {
  const [showCriteria, setShowCriteria] = useState(true);
  const [showExamples, setShowExamples] = useState(false);
  const [showEditor, setShowEditor] = useState(true);
  const [showDesc, setShowDesc] = useState(true);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [learningPlan, setLearningPlan] = useState(null);
  const [showHints, setShowHints] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(true);
  const [stats, setStats] = useState({
    completed: 0,
    averageScore: 0,
    totalAttempts: 0,
  });
  const [editorTheme, setEditorTheme] = useState("vs-dark");

  const updateStats = () => {
    setStats({
      completed: getCompletedChallengesCount(),
      averageScore: getAverageScore(),
      totalAttempts: getTotalAttempts(),
    });
  };

  const loadChallenge = async (index) => {
    setIsLoading(true);
    setIsCompleted(false);
    try {
      setCurrentChallengeIndex(index);
      setCurrentIndex(index);
      const entry = getChallengeFromHistory(index);
      if (entry && entry.challenge) {
        setChallenge(entry.challenge);
        setCode(entry.code || "");
        setEvaluation(entry.evaluation || null);
        setIsCompleted(entry.evaluation?.success || false);
      } else {
        const newChallenge = await generateChallenge(index);
        setChallenge(newChallenge);
        setCode("");
        setEvaluation(null);
        setIsCompleted(false);
      }
      updateStats();
    } catch (error) {
      console.error("Error loading challenge:", error);
      const fallbackChallenge = {
        title: "Reto de ejemplo",
        description: "Resuelve el problema propuesto.",
        language: "javascript",
        exampleInput: "",
        exampleOutput: "",
        difficulty: "beginner",
        acceptanceCriteria: [
          "El código ejecuta sin errores",
          "Sigue buenas prácticas",
          "Está bien comentado",
        ],
        hints: ["Revisa la sintaxis", "Prueba con ejemplos simples"],
        concepts: ["Sintaxis básica"],
        estimatedTimeMinutes: 20,
      };
      setChallenge(fallbackChallenge);
      setCode("");
      setEvaluation(null);
      setIsCompleted(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      loadChallenge(currentIndex - 1);
    }
  };

  const handleNext = () => {
    loadChallenge(currentIndex + 1);
  };

  const handleSubmitCode = async () => {
    if (!code.trim() || !challenge) return;

    setIsEvaluating(true);

    try {
      const response = await fetch("/api/ai/evaluate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          challenge: {
            title: challenge.title,
            description: challenge.description,
            language: challenge.language,
            acceptanceCriteria: challenge.acceptanceCriteria,
          },
        }),
      });

      const result = await response.json();
      setEvaluation(result);

      if (result.success) {
        setIsCompleted(true);
      }

      if (challenge && result) {
        saveChallengeToHistory(challenge, code, result);
        updateStats();
      }
    } catch (error) {
      console.error("Error evaluating code:", error);
      const errorResult = {
        success: false,
        score: 0,
        feedback: "Error al evaluar el código. Por favor intenta de nuevo.",
        suggestions: ["Verifica la sintaxis", "Revisa los requisitos"],
      };
      setEvaluation(errorResult);

      if (challenge) {
        saveChallengeToHistory(challenge, code, errorResult);
        updateStats();
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  const retryChallenge = () => {
    setCode("");
    setEvaluation(null);
    setShowHints(false);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "beginner":
        return "text-green-600 bg-green-100";
      case "intermediate":
        return "text-yellow-600 bg-yellow-100";
      case "advanced":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  useEffect(() => {
    const plan = getLearningPlan();
    setLearningPlan(plan);
    if (plan) {
      loadChallenge(0);
    }
  }, []);

  if (!learningPlan) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-muted-foreground"
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
        <h3 className="text-lg font-semibold text-card-foreground mb-2">
          Sin Plan de Aprendizaje
        </h3>
        <p className="text-muted-foreground mb-4">
          Necesitas generar un plan de aprendizaje primero para acceder a los
          retos infinitos.
        </p>
        <a
          href="/onboarding"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Crear Plan de Aprendizaje
        </a>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-background">
      {/* Header Superior */}
      <section className="flex-shrink-0 flex flex-col gap-2 px-6 py-2 border-b border-border bg-white/90 dark:bg-[#16161a]/90 shadow-sm">
        {/* Primera fila: Título + Estadísticas */}
        <div className="flex items-start justify-between gap-8">
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-foreground mb-0.5">
              Retos Infinitos
            </h1>
            <p className="text-xs text-muted-foreground">
              {learningPlan?.goal} • {learningPlan?.language}
            </p>
          </div>

          {/* Estadísticas */}
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-2xl font-black text-primary mb-0">
                {stats.completed}
              </div>
              <div className="text-[10px] text-muted-foreground font-semibold">
                Completados
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-yellow-500 mb-0">
                {stats.averageScore}%
              </div>
              <div className="text-[10px] text-muted-foreground font-semibold">
                Promedio
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-green-500 mb-0">
                {stats.totalAttempts}
              </div>
              <div className="text-[10px] text-muted-foreground font-semibold">
                Intentos
              </div>
            </div>
          </div>
        </div>

        {/* Segunda fila: Navegación + Info del Reto */}
        <div className="flex items-center justify-between gap-6 pt-1.5 border-t border-border">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0 || isLoading}
              className="px-3 py-1.5 rounded-lg bg-muted text-foreground text-sm font-semibold hover:bg-muted/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 flex items-center gap-1"
            >
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Anterior
            </button>

            <div className="px-4 py-1 bg-muted rounded-lg">
              <div className="text-base font-black text-foreground">
                Reto #{currentIndex + 1}
              </div>
              {challenge && (
                <div className="flex items-center gap-2 mt-0">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getDifficultyColor(
                      challenge.difficulty
                    )}`}
                  >
                    {challenge.difficulty}
                  </span>
                  {isCompleted && (
                    <svg
                      className="w-5 h-5 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleNext}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 flex items-center gap-1"
            >
              Siguiente
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Indicador de Progreso */}
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground mb-0.5">
              {challenge?.estimatedTimeMinutes}
              min estimado
            </p>
            {challenge?.concepts && (
              <div className="flex gap-1.5 flex-wrap justify-end">
                {challenge.concepts.slice(0, 2).map((concept, i) => (
                  <span
                    key={i}
                    className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="flex-1 flex flex-row gap-0 w-full overflow-hidden bg-background">
        {challenge && (
          <>
            {!leftPanelCollapsed && (
              <section className="w-[420px] h-full border-r border-border bg-white dark:bg-[#0f0f0f] flex flex-col">
                {/* Header con botón de colapsar - Fijo */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 pb-3 border-b border-border">
                  <div>
                    <h2 className="text-base font-bold text-foreground">
                      {challenge.title}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-medium">
                        {challenge.difficulty}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {challenge.estimatedTimeMinutes} min
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setLeftPanelCollapsed(true)}
                    className="p-1.5 hover:bg-muted rounded transition"
                    title="Expandir editor"
                  >
                    ◀
                  </button>
                </div>

                {/* Contenedor con scroll para las secciones */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 scrollbar-thin">
                  <div className="flex flex-col gap-3">
                    {/* Description Panel */}
                    <section className="rounded-lg border border-border overflow-hidden bg-white dark:bg-[#1a1a1a] transition-all duration-300">
                      <button
                        onClick={() => setShowDesc((v) => !v)}
                        className="w-full flex items-center justify-between px-3 py-2 font-semibold text-sm text-foreground hover:bg-muted transition-all"
                      >
                        <span className="flex items-center gap-2">
                          📝 Descripción del reto
                        </span>
                        <span className="transition-transform duration-300">
                          {showDesc ? "▼" : "▶"}
                        </span>
                      </button>
                      {showDesc && (
                        <div className="px-3 py-3 border-t border-border animate-fade-in">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {challenge.description}
                          </p>
                        </div>
                      )}
                    </section>

                    {/* Criteria Panel */}
                    <section className="rounded-lg border border-border overflow-hidden bg-white dark:bg-[#1a1a1a] transition-all duration-300">
                      <button
                        onClick={() => setShowCriteria((v) => !v)}
                        className="w-full flex items-center justify-between px-3 py-2 font-semibold text-sm text-foreground hover:bg-muted transition-all"
                      >
                        <span className="flex items-center gap-2">
                          ✓ Criterios de aceptación
                        </span>
                        <span className="transition-transform duration-300">
                          {showCriteria ? "▼" : "▶"}
                        </span>
                      </button>
                      {showCriteria && (
                        <div className="px-3 py-3 border-t border-border animate-fade-in">
                          <ul className="space-y-2">
                            {challenge.acceptanceCriteria?.map(
                              (criteria, i) => (
                                <li
                                  key={i}
                                  className="text-sm text-muted-foreground flex gap-2 items-start"
                                >
                                  <span className="text-primary mt-0.5">✓</span>
                                  <span>{criteria}</span>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </section>

                    {/* Examples Panel */}
                    {(challenge.exampleInput || challenge.exampleOutput) && (
                      <section className="rounded-lg border border-border overflow-hidden bg-white dark:bg-[#1a1a1a] transition-all duration-300">
                        <button
                          onClick={() => setShowExamples((v) => !v)}
                          className="w-full flex items-center justify-between px-3 py-2 font-semibold text-sm text-foreground hover:bg-muted transition-all"
                        >
                          <span className="flex items-center gap-2">
                            📋 Ejemplos
                          </span>
                          <span className="transition-transform duration-300">
                            {showExamples ? "▼" : "▶"}
                          </span>
                        </button>
                        {showExamples && (
                          <div className="px-3 py-3 border-t border-border space-y-3 animate-fade-in">
                            {challenge.exampleInput && (
                              <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                                  Entrada:
                                </label>
                                <code className="block p-2 bg-muted rounded text-xs font-mono text-primary overflow-x-auto">
                                  {challenge.exampleInput}
                                </code>
                              </div>
                            )}
                            {challenge.exampleOutput && (
                              <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                                  Salida esperada:
                                </label>
                                <code className="block p-2 bg-muted rounded text-xs font-mono text-green-600 dark:text-green-400 overflow-x-auto">
                                  {challenge.exampleOutput}
                                </code>
                              </div>
                            )}
                          </div>
                        )}
                      </section>
                    )}

                    {/* Hints Panel */}
                    {challenge.hints && challenge.hints.length > 0 && (
                      <section className="rounded-lg border border-border overflow-hidden bg-white dark:bg-[#1a1a1a] transition-all duration-300">
                        <button
                          onClick={() => setShowHints((v) => !v)}
                          className="w-full flex items-center justify-between px-3 py-2 font-semibold text-sm text-foreground hover:bg-muted transition-all"
                        >
                          <span className="flex items-center gap-2">
                            💡 Pistas
                          </span>
                          <span className="transition-transform duration-300">
                            {showHints ? "▼" : "▶"}
                          </span>
                        </button>
                        {showHints && (
                          <div className="px-3 py-3 border-t border-border animate-fade-in">
                            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                              <ul className="space-y-2">
                                {challenge.hints.map((hint, i) => (
                                  <li
                                    key={i}
                                    className="text-sm text-yellow-900 dark:text-yellow-200 flex gap-2 items-start"
                                  >
                                    <span className="text-yellow-600">💡</span>
                                    <span>{hint}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </section>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Botón para expandir panel izquierdo cuando está colapsado */}
            {leftPanelCollapsed && (
              <button
                onClick={() => setLeftPanelCollapsed(false)}
                className="w-8 flex-shrink-0 bg-white dark:bg-[#1a1a1a] border-r border-border hover:bg-muted transition flex items-center justify-center"
                title="Mostrar descripción"
              >
                ▶
              </button>
            )}
          </>
        )}

        {/* Right Panel - Editor */}
        {challenge && (
          <section className="flex-1 h-full overflow-hidden flex flex-col bg-[#1e1e1e]">
            {/* Editor Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 bg-[#2d2d2d] border-b border-[#3e3e3e]">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-semibold">
                  {challenge.language}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Theme Selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowThemeSelector((v) => !v)}
                    className="px-2 py-1 text-xs rounded hover:bg-[#3e3e3e] text-gray-300 flex items-center gap-1"
                    aria-label="Configurar tema"
                  >
                    🎨 Tema
                  </button>
                  {showThemeSelector && (
                    <div className="absolute right-0 top-full mt-1 bg-[#2d2d2d] border border-[#3e3e3e] rounded shadow-lg z-50 p-2 min-w-[150px]">
                      <div className="flex flex-col gap-1">
                        {MONACO_THEMES.map((theme) => (
                          <button
                            key={theme.value}
                            onClick={() => {
                              setEditorTheme(theme.value);
                              setShowThemeSelector(false);
                            }}
                            className={`px-2 py-1 text-xs rounded text-left hover:bg-[#3e3e3e] transition ${
                              editorTheme === theme.value
                                ? "bg-primary text-primary-foreground"
                                : "text-gray-300"
                            }`}
                          >
                            {theme.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 overflow-hidden bg-[#1e1e1e]">
              <Editor
                language={challenge.language?.toLowerCase() || "javascript"}
                value={code}
                onChange={setCode}
                height="100%"
                theme={editorTheme}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-[#2d2d2d] border-t border-[#3e3e3e]">
              <button
                onClick={handleSubmitCode}
                disabled={!code.trim() || isEvaluating}
                className="px-4 py-1.5 rounded bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {isEvaluating ? "Evaluando..." : "Ejecutar"}
              </button>
              {(evaluation || code) && (
                <button
                  onClick={retryChallenge}
                  className="px-4 py-1.5 rounded bg-muted text-foreground text-sm font-semibold hover:bg-muted/80 transition"
                >
                  Reintentar
                </button>
              )}
            </div>

            {/* Evaluation Feedback - Colapsable */}
            {evaluation && (
              <div className="flex-shrink-0 bg-[#1e1e1e] border-t border-[#3e3e3e]">
                {/* Header colapsable del feedback */}
                <button
                  onClick={() => setShowFeedback(!showFeedback)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-[#2d2d2d] hover:bg-[#3e3e3e] transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-bold ${
                        evaluation.success ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {evaluation.success ? "✓ Aprobado" : "✗ Rechazado"}
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        evaluation.success ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {evaluation.score}%
                    </span>
                  </div>
                  <span
                    className="text-gray-400 transition-transform duration-300"
                    style={{
                      transform: showFeedback
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    }}
                  >
                    ▼
                  </span>
                </button>

                {/* Contenido del feedback */}
                {showFeedback && (
                  <div className="max-h-[40vh] overflow-y-auto p-4 scrollbar-thin animate-fade-in">
                    <div
                      className={`rounded-lg border-l-4 p-4 ${
                        evaluation.success
                          ? "bg-green-900/20 border-green-500"
                          : "bg-red-900/20 border-red-500"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3
                          className={`text-lg font-bold ${
                            evaluation.success
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {evaluation.success
                            ? "✓ Código Aprobado"
                            : "✗ Código Rechazado"}
                        </h3>
                      </div>

                      <p className="text-sm text-gray-300 mb-3">
                        {evaluation.feedback}
                      </p>

                      {evaluation.suggestions &&
                        evaluation.suggestions.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-700">
                            <h4 className="text-sm font-semibold text-gray-300 mb-2">
                              💡 Sugerencias:
                            </h4>
                            <ul className="space-y-1">
                              {evaluation.suggestions.map((suggestion, i) => (
                                <li
                                  key={i}
                                  className="text-sm text-gray-400 flex gap-2 items-start"
                                >
                                  <span className="text-blue-400">•</span>
                                  <span>{suggestion}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
