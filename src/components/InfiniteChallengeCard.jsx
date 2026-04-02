"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

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

import MultiFileEditor from "@/components/MultiFileEditor";
import {
  trackChallengeCompleted,
  trackChallengeStarted,
} from "@/lib/analytics";
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

// ─── Genera los archivos para un challenge via API ───────────────────────────
async function generateFilesForChallenge(challenge) {
  try {
    const response = await fetch("/api/ai/generate-files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challenge }),
    });
    if (!response.ok) throw new Error("Error generando archivos");
    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error("Error generando archivos:", error);
    // Fallback: un archivo según el lenguaje
    return [
      {
        id: `file-0-${Date.now()}`,
        filename: getDefaultFilename(challenge.language),
        language: challenge.language?.toLowerCase() || "javascript",
        content: "// Escribe tu solución aquí\n",
        placeholder: "// Escribe tu solución aquí\n",
        required: true,
        description: "Archivo principal de la solución",
      },
    ];
  }
}

function getDefaultFilename(language) {
  const lang = language?.toLowerCase() || "";
  if (lang.includes("python")) return "solution.py";
  if (lang.includes("typescript") || lang.includes("angular")) return "component.ts";
  if (lang.includes("vue")) return "Component.vue";
  if (lang.includes("react")) return "App.jsx";
  return "solution.js";
}

export default function InfiniteChallengeCard() {
  const [showCriteria, setShowCriteria] = useState(true);
  const [showExamples, setShowExamples] = useState(false);
  const [showDesc, setShowDesc] = useState(true);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [challenge, setChallenge] = useState(null);

  // ── Multi-file state ──────────────────────────────────────────────────────
  const [files, setFiles] = useState([]); // array de { id, filename, language, content, required, description }
  const [isGeneratingFiles, setIsGeneratingFiles] = useState(false);

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
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [challengeStartTime, setChallengeStartTime] = useState(null);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const updateStats = async () => {
    const [completed, averageScore, totalAttempts] = await Promise.all([
      getCompletedChallengesCount(),
      getAverageScore(),
      getTotalAttempts(),
    ]);
    setStats({ completed, averageScore, totalAttempts });
  };

  // ── Carga un challenge y genera sus archivos ──────────────────────────────
  const loadChallenge = async (index) => {
    setIsLoading(true);
    setIsCompleted(false);
    setTimer(0);
    setTimerRunning(true);
    setChallengeStartTime(Date.now());
    setEvaluation(null);
    setFiles([]);

    try {
      setCurrentChallengeIndex(index);
      setCurrentIndex(index);

      let newChallenge;
      const entry = await getChallengeFromHistory(index);

      if (entry && entry.challenge) {
        newChallenge = entry.challenge;
        setChallenge(newChallenge);
        setIsCompleted(entry.evaluation?.success || false);
        setEvaluation(entry.evaluation || null);

        // Restaurar archivos guardados o regenerar
        if (entry.files && entry.files.length > 0) {
          setFiles(entry.files);
        } else {
          await loadFiles(newChallenge);
        }
      } else {
        newChallenge = await generateChallenge(index);
        setChallenge(newChallenge);
        setEvaluation(null);
        setIsCompleted(false);
        trackChallengeStarted(
          newChallenge.id,
          newChallenge.language,
          newChallenge.difficulty
        );
        await loadFiles(newChallenge);
      }

      await updateStats();
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
      setFiles([
        {
          id: `fallback-${Date.now()}`,
          filename: "solution.js",
          language: "javascript",
          content: "// Escribe tu solución aquí\n",
          required: true,
          description: "Archivo de solución",
        },
      ]);
      setEvaluation(null);
      setIsCompleted(false);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Genera los archivos desde la API ─────────────────────────────────────
  const loadFiles = async (challengeData) => {
    setIsGeneratingFiles(true);
    try {
      const generatedFiles = await generateFilesForChallenge(challengeData);
      setFiles(generatedFiles);
    } finally {
      setIsGeneratingFiles(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) loadChallenge(currentIndex - 1);
  };

  const handleNext = () => loadChallenge(currentIndex + 1);

  // ── Evalúa todos los archivos ─────────────────────────────────────────────
  const handleSubmitCode = async () => {
    if (!challenge) return;

    const hasContent = files.some((f) => f.content && f.content.trim() &&
      f.content.trim() !== (f.placeholder || "").trim());

    if (!hasContent) {
      toast.warning("Escribe tu solución antes de ejecutar");
      return;
    }

    setIsEvaluating(true);

    try {
      const response = await fetch("/api/ai/evaluate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: files.map((f) => ({
            filename: f.filename,
            language: f.language,
            content: f.content,
          })),
          challenge: {
            title: challenge.title,
            description: challenge.description,
            language: challenge.language,
            acceptanceCriteria: challenge.acceptanceCriteria,
            exampleInput: challenge.exampleInput,
            exampleOutput: challenge.exampleOutput,
          },
        }),
      });

      const result = await response.json();
      setEvaluation(result);

      if (result.success) {
        setIsCompleted(true);
        setTimerRunning(false);
        const timeSpentSeconds = Math.floor(
          (Date.now() - challengeStartTime) / 1000
        );
        trackChallengeCompleted(
          challenge.id,
          result.score,
          1,
          timeSpentSeconds * 1000,
          showHints ? 1 : 0
        );
        toast.success(`¡Aprobado! ${result.score}%`);
      } else {
        toast.error(`${result.score}% — Revisa el feedback`);
      }

      if (challenge && result) {
        const timeSpentSeconds = Math.floor(
          (Date.now() - challengeStartTime) / 1000
        );
        result.timeSpent = timeSpentSeconds;
        result.hintsUsed = showHints ? 1 : 0;
        // Guarda también los archivos en el historial
        await saveChallengeToHistory(challenge, files[0]?.content || "", result, files);
        await updateStats();
      }
    } catch (error) {
      console.error("Error evaluating code:", error);
      const errorResult = {
        success: false,
        score: 0,
        feedback: "Error al evaluar el código. Por favor intenta de nuevo.",
        suggestions: ["Verifica la sintaxis", "Revisa los requisitos"],
        filesFeedback: [],
      };
      setEvaluation(errorResult);
    } finally {
      setIsEvaluating(false);
    }
  };

  const retryChallenge = () => {
    // Resetea los archivos a sus placeholders originales
    setFiles((prev) =>
      prev.map((f) => ({ ...f, content: f.placeholder || "// Tu código aquí\n" }))
    );
    setEvaluation(null);
    setShowHints(false);
    setTimer(0);
    setTimerRunning(true);
    setChallengeStartTime(Date.now());
    setIsCompleted(false);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "beginner": return "text-green-600 bg-green-100";
      case "intermediate": return "text-yellow-600 bg-yellow-100";
      case "advanced": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const plan = await getLearningPlan();
      setLearningPlan(plan);
      if (plan) await loadChallenge(0);
    };
    loadData();
  }, []);

  useEffect(() => {
    let interval;
    if (timerRunning) {
      interval = setInterval(() => setTimer((prev) => prev + 1), 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [timerRunning]);

  if (!learningPlan) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-card-foreground mb-2">Sin Plan de Aprendizaje</h3>
        <p className="text-muted-foreground mb-4">Necesitas generar un plan de aprendizaje primero para acceder a los retos infinitos.</p>
        <a href="/onboarding" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          Crear Plan de Aprendizaje
        </a>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-background">
      {/* ── Header Superior ────────────────────────────────────────────────── */}
      <section className="flex-shrink-0 flex flex-col gap-2 px-6 py-2 border-b border-border bg-white/90 dark:bg-[#16161a]/90 shadow-sm">
        <div className="flex items-start justify-between gap-8">
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-foreground mb-0.5">Retos Infinitos</h1>
            <p className="text-xs text-muted-foreground">{learningPlan?.goal} • {learningPlan?.language}</p>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-2xl font-black text-primary mb-0">{stats.completed}</div>
              <div className="text-[10px] text-muted-foreground font-semibold">Completados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-yellow-500 mb-0">{stats.averageScore}%</div>
              <div className="text-[10px] text-muted-foreground font-semibold">Promedio</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-green-500 mb-0">{stats.totalAttempts}</div>
              <div className="text-[10px] text-muted-foreground font-semibold">Intentos</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-6 pt-1.5 border-t border-border">
          <div className="flex items-center gap-2">
            <button onClick={handlePrevious} disabled={currentIndex === 0 || isLoading}
              className="px-3 py-1.5 rounded-lg bg-muted text-foreground text-sm font-semibold hover:bg-muted/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Anterior
            </button>

            <div className="px-4 py-1 bg-muted rounded-lg">
              <div className="text-base font-black text-foreground">Reto #{currentIndex + 1}</div>
              {challenge && (
                <div className="flex items-center gap-2 mt-0">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getDifficultyColor(challenge.difficulty)}`}>
                    {challenge.difficulty}
                  </span>
                  {isCompleted && (
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                  )}
                </div>
              )}
            </div>

            {/* Cronómetro */}
            <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className={`text-sm font-bold ${timerRunning ? "text-blue-500" : "text-gray-500"}`}>
                  {formatTime(timer)}
                </span>
              </div>
            </div>

            {/* Indicador de archivos */}
            {files.length > 0 && (
              <div className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-xs font-semibold text-purple-400">
                    {files.length} archivo{files.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            )}

            <button onClick={handleNext} disabled={isLoading}
              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 flex items-center gap-1">
              Siguiente
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-muted-foreground mb-0.5">{challenge?.estimatedTimeMinutes} min estimado</p>
            {challenge?.concepts && (
              <div className="flex gap-1.5 flex-wrap justify-end">
                {challenge.concepts.slice(0, 2).map((concept, i) => (
                  <span key={i} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">{concept}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-row gap-0 w-full overflow-hidden bg-background">
        {challenge && (
          <>
            {!leftPanelCollapsed && (
              <section className="w-[420px] h-full border-r border-border bg-white dark:bg-[#0f0f0f] flex flex-col">
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 pb-3 border-b border-border">
                  <div>
                    <h2 className="text-base font-bold text-foreground">{challenge.title}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-medium">
                        {challenge.difficulty}
                      </span>
                      <span className="text-xs text-muted-foreground">{challenge.estimatedTimeMinutes} min</span>
                    </div>
                  </div>
                  <button onClick={() => setLeftPanelCollapsed(true)}
                    className="p-1.5 hover:bg-muted rounded transition" title="Expandir editor">
                    ◀
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 scrollbar-thin">
                  <div className="flex flex-col gap-3">
                    {/* Descripción */}
                    <section className="rounded-lg border border-border overflow-hidden bg-white dark:bg-[#1a1a1a]">
                      <button onClick={() => setShowDesc((v) => !v)}
                        className="w-full flex items-center justify-between px-3 py-2 font-semibold text-sm text-foreground hover:bg-muted transition-all">
                        <span>Descripción del reto</span>
                        <span>{showDesc ? "▼" : "▶"}</span>
                      </button>
                      {showDesc && (
                        <div className="px-3 py-3 border-t border-border">
                          <p className="text-sm text-muted-foreground leading-relaxed">{challenge.description}</p>
                        </div>
                      )}
                    </section>

                    {/* Archivos del reto */}
                    {files.length > 0 && (
                      <section className="rounded-lg border border-border overflow-hidden bg-white dark:bg-[#1a1a1a]">
                        <div className="px-3 py-2 font-semibold text-sm text-foreground border-b border-border flex items-center gap-2">
                          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                          Archivos del reto
                        </div>
                        <div className="px-3 py-2 flex flex-col gap-1.5">
                          {files.map((file) => (
                            <div key={file.id} className="flex items-start gap-2">
                              <div className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${file.required ? "bg-primary" : "bg-gray-400"}`} />
                              <div>
                                <p className="text-xs font-mono font-semibold text-foreground">{file.filename}</p>
                                {file.description && (
                                  <p className="text-[10px] text-muted-foreground">{file.description}</p>
                                )}
                              </div>
                              {file.required && (
                                <span className="ml-auto text-[9px] text-primary font-semibold">requerido</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Criterios */}
                    <section className="rounded-lg border border-border overflow-hidden bg-white dark:bg-[#1a1a1a]">
                      <button onClick={() => setShowCriteria((v) => !v)}
                        className="w-full flex items-center justify-between px-3 py-2 font-semibold text-sm text-foreground hover:bg-muted transition-all">
                        <span>✓ Criterios de aceptación</span>
                        <span>{showCriteria ? "▼" : "▶"}</span>
                      </button>
                      {showCriteria && (
                        <div className="px-3 py-3 border-t border-border">
                          <ul className="space-y-2">
                            {challenge.acceptanceCriteria?.map((criteria, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex gap-2 items-start">
                                <span className="text-primary mt-0.5">✓</span>
                                <span>{criteria}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </section>

                    {/* Ejemplos */}
                    {(challenge.exampleInput || challenge.exampleOutput) && (
                      <section className="rounded-lg border border-border overflow-hidden bg-white dark:bg-[#1a1a1a]">
                        <button onClick={() => setShowExamples((v) => !v)}
                          className="w-full flex items-center justify-between px-3 py-2 font-semibold text-sm text-foreground hover:bg-muted transition-all">
                          <span>Ejemplos</span>
                          <span>{showExamples ? "▼" : "▶"}</span>
                        </button>
                        {showExamples && (
                          <div className="px-3 py-3 border-t border-border space-y-3">
                            {challenge.exampleInput && (
                              <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Entrada:</label>
                                <code className="block p-2 bg-muted rounded text-xs font-mono text-primary overflow-x-auto">{challenge.exampleInput}</code>
                              </div>
                            )}
                            {challenge.exampleOutput && (
                              <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Salida esperada:</label>
                                <code className="block p-2 bg-muted rounded text-xs font-mono text-green-600 dark:text-green-400 overflow-x-auto">{challenge.exampleOutput}</code>
                              </div>
                            )}
                          </div>
                        )}
                      </section>
                    )}

                    {/* Pistas */}
                    {challenge.hints && challenge.hints.length > 0 && (
                      <section className="rounded-lg border border-border overflow-hidden bg-white dark:bg-[#1a1a1a]">
                        <button onClick={() => setShowHints((v) => !v)}
                          className="w-full flex items-center justify-between px-3 py-2 font-semibold text-sm text-foreground hover:bg-muted transition-all">
                          <span>💡 Pistas</span>
                          <span>{showHints ? "▼" : "▶"}</span>
                        </button>
                        {showHints && (
                          <div className="px-3 py-3 border-t border-border">
                            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                              <ul className="space-y-2">
                                {challenge.hints.map((hint, i) => (
                                  <li key={i} className="text-sm text-yellow-900 dark:text-yellow-200 flex gap-2 items-start">
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

            {leftPanelCollapsed && (
              <button onClick={() => setLeftPanelCollapsed(false)}
                className="w-8 flex-shrink-0 bg-white dark:bg-[#1a1a1a] border-r border-border hover:bg-muted transition flex items-center justify-center"
                title="Mostrar descripción">
                ▶
              </button>
            )}
          </>
        )}

        {/* ── Right Panel - Multi-file Editor ──────────────────────────────── */}
        {challenge && (
          <section className="flex-1 h-full overflow-hidden flex flex-col bg-[#1e1e1e]">
            {/* Editor Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 bg-[#2d2d2d] border-b border-[#3e3e3e]">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-semibold">{challenge.language}</span>
                {isGeneratingFiles && (
                  <span className="text-xs text-purple-400 flex items-center gap-1">
                    <div className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin" />
                    generando archivos...
                  </span>
                )}
              </div>
              <div className="relative">
                <button type="button" onClick={() => setShowThemeSelector((v) => !v)}
                  className="px-2 py-1 text-xs rounded hover:bg-[#3e3e3e] text-gray-300 flex items-center gap-1">
                  🎨 Tema
                </button>
                {showThemeSelector && (
                  <div className="absolute right-0 top-full mt-1 bg-[#2d2d2d] border border-[#3e3e3e] rounded shadow-lg z-50 p-2 min-w-[150px]">
                    <div className="flex flex-col gap-1">
                      {MONACO_THEMES.map((theme) => (
                        <button key={theme.value}
                          onClick={() => { setEditorTheme(theme.value); setShowThemeSelector(false); }}
                          className={`px-2 py-1 text-xs rounded text-left hover:bg-[#3e3e3e] transition ${editorTheme === theme.value ? "bg-primary text-primary-foreground" : "text-gray-300"}`}>
                          {theme.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Multi-file Editor con tabs ─────────────────────────────── */}
            <MultiFileEditor
              files={files}
              onFilesChange={setFiles}
              language={challenge.language}
              theme={editorTheme}
              filesFeedback={evaluation?.filesFeedback || []}
              isLoading={isGeneratingFiles && files.length === 0}
            />

            {/* Action Buttons */}
            <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-[#2d2d2d] border-t border-[#3e3e3e]">
              <button onClick={handleSubmitCode}
                disabled={isEvaluating || isGeneratingFiles || files.length === 0}
                className="px-4 py-1.5 rounded bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition">
                {isEvaluating ? "Evaluando..." : "Ejecutar"}
              </button>
              {(evaluation || files.some((f) => f.content !== f.placeholder)) && (
                <button onClick={retryChallenge}
                  className="px-4 py-1.5 rounded bg-muted text-foreground text-sm font-semibold hover:bg-muted/80 transition">
                  Reintentar
                </button>
              )}
              {/* Info de archivos que se evaluarán */}
              {files.length > 1 && (
                <span className="text-xs text-gray-500 ml-auto">
                  Evaluando {files.length} archivos
                </span>
              )}
            </div>

            {/* ── Evaluation Feedback ───────────────────────────────────── */}
            {evaluation && (
              <div className="flex-shrink-0 bg-[#1e1e1e] border-t border-[#3e3e3e]">
                <button onClick={() => setShowFeedback(!showFeedback)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-[#2d2d2d] hover:bg-[#3e3e3e] transition-all">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${evaluation.success ? "text-green-400" : "text-red-400"}`}>
                      {evaluation.success ? "✓ Aprobado" : "✗ Rechazado"}
                    </span>
                    <span className={`text-sm font-bold ${evaluation.success ? "text-green-400" : "text-red-400"}`}>
                      {evaluation.score}%
                    </span>
                  </div>
                  <span className="text-gray-400 transition-transform duration-300"
                    style={{ transform: showFeedback ? "rotate(180deg)" : "rotate(0deg)" }}>
                    ▼
                  </span>
                </button>

                {showFeedback && (
                  <div className="max-h-[40vh] overflow-y-auto p-4 scrollbar-thin">
                    <div className={`rounded-lg border-l-4 p-4 ${evaluation.success ? "bg-green-900/20 border-green-500" : "bg-red-900/20 border-red-500"}`}>
                      <h3 className={`text-lg font-bold mb-2 ${evaluation.success ? "text-green-400" : "text-red-400"}`}>
                        {evaluation.success ? "✓ Código Aprobado" : "✗ Código Rechazado"}
                      </h3>
                      <p className="text-sm text-gray-300 mb-3">{evaluation.feedback}</p>

                      {/* Feedback por archivo */}
                      {evaluation.filesFeedback && evaluation.filesFeedback.length > 0 && (
                        <div className="mb-3 space-y-1">
                          {evaluation.filesFeedback.map((fb, i) => {
                            const colors = { ok: "text-green-400", warning: "text-yellow-400", error: "text-red-400" };
                            const icons = { ok: "✓", warning: "⚠", error: "✗" };
                            return (
                              <div key={i} className="flex items-start gap-2 text-xs">
                                <span className={`font-mono font-bold ${colors[fb.status]}`}>{icons[fb.status]}</span>
                                <span className="font-mono text-gray-400">{fb.filename}:</span>
                                <span className="text-gray-300">{fb.comment}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {evaluation.suggestions && evaluation.suggestions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <h4 className="text-sm font-semibold text-gray-300 mb-2">💡 Sugerencias:</h4>
                          <ul className="space-y-1">
                            {evaluation.suggestions.map((suggestion, i) => (
                              <li key={i} className="text-sm text-gray-400 flex gap-2 items-start">
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