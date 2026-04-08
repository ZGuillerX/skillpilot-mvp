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
import { getLiveProjectBoard, saveLiveProjectWeek } from "@/lib/userProgress";
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
  getBottleneckCapability,
  setPreferredLearningMode,
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
  if (lang.includes("typescript") || lang.includes("angular"))
    return "component.ts";
  if (lang.includes("vue")) return "Component.vue";
  if (lang.includes("react")) return "App.jsx";
  return "solution.js";
}

export default function InfiniteChallengeCard({ learningMode = "tutor" }) {
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
  const [bottleneckCapability, setBottleneckCapability] =
    useState("decomposicion");
  const [projectWeekData, setProjectWeekData] = useState(null);
  const [projectSaving, setProjectSaving] = useState(false);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const createDefaultProjectTasks = (projectTask) => {
    if (!projectTask) return [];
    return [
      {
        id: "task-1",
        label: "Definir alcance del incremento semanal",
        done: false,
      },
      {
        id: "task-2",
        label: "Implementar funcionalidad principal",
        done: false,
      },
      { id: "task-3", label: "Probar con casos normales y borde", done: false },
      { id: "task-4", label: "Documentar decision tecnica clave", done: false },
    ];
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
        newChallenge = await generateChallenge(index, { learningMode });
        setChallenge(newChallenge);
        setEvaluation(null);
        setIsCompleted(false);
        trackChallengeStarted(
          newChallenge.id,
          newChallenge.language,
          newChallenge.difficulty,
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

    const hasContent = files.some(
      (f) =>
        f.content &&
        f.content.trim() &&
        f.content.trim() !== (f.placeholder || "").trim(),
    );

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
          learningMode,
        }),
      });

      const result = await response.json();
      setEvaluation(result);

      if (result.success) {
        setIsCompleted(true);
        setTimerRunning(false);
        const timeSpentSeconds = Math.floor(
          (Date.now() - challengeStartTime) / 1000,
        );
        trackChallengeCompleted(
          challenge.id,
          result.score,
          1,
          timeSpentSeconds * 1000,
          showHints ? 1 : 0,
        );
        toast.success(`¡Aprobado! ${result.score}%`);
      } else {
        toast.error(`${result.score}% — Revisa el feedback`);
      }

      if (challenge && result) {
        const timeSpentSeconds = Math.floor(
          (Date.now() - challengeStartTime) / 1000,
        );
        result.timeSpent = timeSpentSeconds;
        result.hintsUsed = showHints ? 1 : 0;
        // Guarda también los archivos en el historial
        await saveChallengeToHistory(
          challenge,
          files[0]?.content || "",
          result,
          files,
        );
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
      prev.map((f) => ({
        ...f,
        content: f.placeholder || "// Tu código aquí\n",
      })),
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
    const loadData = async () => {
      const plan = await getLearningPlan();
      const bottleneck = await getBottleneckCapability();
      setBottleneckCapability(bottleneck || "decomposicion");
      setLearningPlan(plan);
      if (plan) await loadChallenge(0);
    };
    loadData();
  }, []);

  useEffect(() => {
    setPreferredLearningMode(learningMode);
    if (learningMode === "arena") {
      setShowHints(false);
    }
  }, [learningMode]);

  useEffect(() => {
    const syncProjectWeek = async () => {
      if (!learningPlan?.id || !challenge?.projectTask?.week) {
        setProjectWeekData(null);
        return;
      }

      const board = await getLiveProjectBoard(learningPlan.id);
      const weekKey = String(challenge.projectTask.week);
      const storedWeek = board?.weeks?.[weekKey];

      if (
        storedWeek &&
        Array.isArray(storedWeek.tasks) &&
        storedWeek.tasks.length > 0
      ) {
        setProjectWeekData(storedWeek);
        return;
      }

      const seededWeek = {
        title: challenge.projectTask.title,
        objective: challenge.projectTask.objective,
        tasks: createDefaultProjectTasks(challenge.projectTask),
      };

      try {
        await saveLiveProjectWeek({
          planId: learningPlan.id,
          week: weekKey,
          title: seededWeek.title,
          objective: seededWeek.objective,
          tasks: seededWeek.tasks,
        });
      } catch (error) {
        console.error("Error seeding live project week:", error);
      }

      setProjectWeekData(seededWeek);
    };

    syncProjectWeek();
  }, [
    learningPlan?.id,
    challenge?.projectTask?.week,
    challenge?.projectTask?.title,
    challenge?.projectTask?.objective,
  ]);

  const toggleProjectTask = async (taskId) => {
    if (!projectWeekData || !learningPlan?.id || !challenge?.projectTask?.week)
      return;

    const updatedTasks = projectWeekData.tasks.map((task) =>
      task.id === taskId ? { ...task, done: !task.done } : task,
    );

    const updatedWeek = { ...projectWeekData, tasks: updatedTasks };
    setProjectWeekData(updatedWeek);

    try {
      setProjectSaving(true);
      await saveLiveProjectWeek({
        planId: learningPlan.id,
        week: challenge.projectTask.week,
        title: updatedWeek.title,
        objective: updatedWeek.objective,
        tasks: updatedTasks,
      });
    } catch (error) {
      toast.error("No se pudo guardar el progreso del proyecto vivo");
      setProjectWeekData(projectWeekData);
    } finally {
      setProjectSaving(false);
    }
  };

  useEffect(() => {
    let interval;
    if (timerRunning) {
      interval = setInterval(() => setTimer((prev) => prev + 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning]);

  if (!learningPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="card-premium p-12 text-center max-w-md w-full animate-fade-in-up">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
            <svg
              className="w-10 h-10 text-white"
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
          <h3 className="text-2xl font-black text-foreground mb-3">
            Sin Plan de Aprendizaje
          </h3>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Crea tu plan personalizado para desbloquear retos infinitos
            adaptados a tu nivel.
          </p>
          <a
            href="/onboarding"
            className="btn-primary text-base px-8 py-3 inline-flex"
          >
            Crear Mi Plan
            <svg
              className="w-5 h-5"
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
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-background">
      {/* ── Header Superior ────────────────────────────────────────────────── */}
      <section className="flex-shrink-0 flex flex-col gap-2 px-6 py-3 border-b border-border/50 glass">
        <div className="flex items-start justify-between gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-black text-gradient">
                Retos Infinitos
              </h1>
              <span
                className={`badge-${learningMode === "arena" ? "secondary" : "primary"} text-[10px]`}
              >
                {learningMode === "arena" ? "Arena" : "Tutor"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {learningPlan?.goal} • {learningPlan?.language}
            </p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
              Enfoque: {bottleneckCapability}
            </p>
          </div>
          <div className="flex gap-4">
            <div className="glass rounded-xl px-4 py-2 text-center min-w-[80px] border border-primary/20">
              <div className="text-2xl font-black text-gradient mb-0">
                {stats.completed}
              </div>
              <div className="text-[10px] text-muted-foreground font-semibold">
                Completados
              </div>
            </div>
            <div className="glass rounded-xl px-4 py-2 text-center min-w-[80px] border border-yellow-500/20">
              <div className="text-2xl font-black text-yellow-500 mb-0">
                {stats.averageScore}%
              </div>
              <div className="text-[10px] text-muted-foreground font-semibold">
                Promedio
              </div>
            </div>
            <div className="glass rounded-xl px-4 py-2 text-center min-w-[80px] border border-emerald-500/20">
              <div className="text-2xl font-black text-emerald-500 mb-0">
                {stats.totalAttempts}
              </div>
              <div className="text-[10px] text-muted-foreground font-semibold">
                Intentos
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-6 pt-2 border-t border-border/30">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0 || isLoading}
              className="btn-ghost px-3 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
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

            <div className="glass px-5 py-2 rounded-xl border border-primary/20">
              <div className="text-base font-black text-gradient">
                Reto #{currentIndex + 1}
              </div>
              {challenge && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getDifficultyColor(challenge.difficulty)}`}
                  >
                    {challenge.difficulty}
                  </span>
                  {isCompleted && (
                    <div className="flex items-center gap-1 text-emerald-500">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                      </svg>
                      <span className="text-[10px] font-bold">Completado</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cronometro */}
            <div className="glass px-4 py-2 rounded-xl border border-cyan-500/30">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${timerRunning ? "bg-cyan-500 animate-pulse" : "bg-gray-500"}`}
                ></div>
                <svg
                  className="w-4 h-4 text-cyan-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span
                  className={`text-sm font-bold font-mono ${timerRunning ? "text-cyan-400" : "text-gray-500"}`}
                >
                  {formatTime(timer)}
                </span>
              </div>
            </div>

            {/* Indicador de archivos */}
            {files.length > 0 && (
              <div className="glass px-3 py-2 rounded-xl border border-purple-500/30">
                <div className="flex items-center gap-1.5">
                  <svg
                    className="w-4 h-4 text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="text-xs font-bold text-purple-400">
                    {files.length} archivo{files.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleNext}
              disabled={isLoading}
              className="btn-primary px-4 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
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

          <div className="text-right">
            <p className="text-[10px] text-muted-foreground mb-1 flex items-center justify-end gap-1">
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {challenge?.estimatedTimeMinutes} min estimado
            </p>
            {challenge?.concepts && (
              <div className="flex gap-1.5 flex-wrap justify-end">
                {challenge.concepts.slice(0, 3).map((concept, i) => (
                  <span key={i} className="badge-primary text-[9px]">
                    {concept}
                  </span>
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
              <section className="w-[420px] h-full border-r border-border/50 bg-card/50 backdrop-blur-sm flex flex-col">
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-4 border-b border-border/30">
                  <div className="flex-1">
                    <h2 className="text-lg font-black text-foreground leading-tight mb-2">
                      {challenge.title}
                    </h2>
                    <div className="flex items-center gap-2">
                      <span
                        className={`badge-${challenge.difficulty === "beginner" ? "success" : challenge.difficulty === "intermediate" ? "warning" : "danger"} text-[10px]`}
                      >
                        {challenge.difficulty}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {challenge.estimatedTimeMinutes} min
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setLeftPanelCollapsed(true)}
                    className="p-2 hover:bg-muted rounded-lg transition-all hover:scale-110 text-muted-foreground hover:text-foreground"
                    title="Expandir editor"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                      />
                    </svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 space-y-3">
                  <div className="flex flex-col gap-3">
                    {/* Descripción */}
                    <section className="rounded-lg border border-border overflow-hidden bg-white dark:bg-[#1a1a1a]">
                      <button
                        onClick={() => setShowDesc((v) => !v)}
                        className="w-full flex items-center justify-between px-3 py-2 font-semibold text-sm text-foreground hover:bg-muted transition-all"
                      >
                        <span>Descripción del reto</span>
                        <span>{showDesc ? "▼" : "▶"}</span>
                      </button>
                      {showDesc && (
                        <div className="px-3 py-3 border-t border-border">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {challenge.description}
                          </p>
                        </div>
                      )}
                    </section>

                    {/* Archivos del reto */}
                    {files.length > 0 && (
                      <section className="rounded-lg border border-border overflow-hidden bg-white dark:bg-[#1a1a1a]">
                        <div className="px-3 py-2 font-semibold text-sm text-foreground border-b border-border flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-purple-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                            />
                          </svg>
                          Archivos del reto
                        </div>
                        <div className="px-3 py-2 flex flex-col gap-1.5">
                          {files.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-start gap-2"
                            >
                              <div
                                className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${file.required ? "bg-primary" : "bg-gray-400"}`}
                              />
                              <div>
                                <p className="text-xs font-mono font-semibold text-foreground">
                                  {file.filename}
                                </p>
                                {file.description && (
                                  <p className="text-[10px] text-muted-foreground">
                                    {file.description}
                                  </p>
                                )}
                              </div>
                              {file.required && (
                                <span className="ml-auto text-[9px] text-primary font-semibold">
                                  requerido
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Criterios */}
                    <section className="rounded-lg border border-border overflow-hidden bg-white dark:bg-[#1a1a1a]">
                      <button
                        onClick={() => setShowCriteria((v) => !v)}
                        className="w-full flex items-center justify-between px-3 py-2 font-semibold text-sm text-foreground hover:bg-muted transition-all"
                      >
                        <span>✓ Criterios de aceptación</span>
                        <span>{showCriteria ? "▼" : "▶"}</span>
                      </button>
                      {showCriteria && (
                        <div className="px-3 py-3 border-t border-border">
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
                              ),
                            )}
                          </ul>
                        </div>
                      )}
                    </section>

                    {/* Capacidades cognitivas */}
                    {Array.isArray(challenge.capabilities) &&
                      challenge.capabilities.length > 0 && (
                        <section className="rounded-lg border border-border overflow-hidden bg-white dark:bg-[#1a1a1a]">
                          <div className="px-3 py-2 font-semibold text-sm text-foreground border-b border-border">
                            Capacidades foco
                          </div>
                          <div className="px-3 py-3 flex flex-wrap gap-2">
                            {challenge.capabilities.map((capability, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold"
                              >
                                {capability}
                              </span>
                            ))}
                          </div>
                        </section>
                      )}

                    {/* Proyecto vivo */}
                    {challenge.projectTask && (
                      <section className="rounded-lg border border-border overflow-hidden bg-white dark:bg-[#1a1a1a]">
                        <div className="px-3 py-2 font-semibold text-sm text-foreground border-b border-border">
                          Proyecto vivo
                        </div>
                        <div className="px-3 py-3 space-y-1">
                          <p className="text-xs text-primary font-semibold">
                            Semana {challenge.projectTask.week}:{" "}
                            {challenge.projectTask.title}
                          </p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {challenge.projectTask.objective}
                          </p>
                          {projectWeekData?.tasks?.length > 0 && (
                            <div className="mt-2 space-y-1.5">
                              {projectWeekData.tasks.map((task) => (
                                <button
                                  key={task.id}
                                  onClick={() => toggleProjectTask(task.id)}
                                  disabled={projectSaving}
                                  className="w-full flex items-center gap-2 text-left text-xs px-2 py-1.5 rounded bg-muted/60 hover:bg-muted transition disabled:opacity-60"
                                >
                                  <span
                                    className={`w-4 h-4 rounded border flex items-center justify-center ${task.done ? "bg-primary border-primary text-primary-foreground" : "border-border"}`}
                                  >
                                    {task.done ? "✓" : ""}
                                  </span>
                                  <span
                                    className={
                                      task.done
                                        ? "line-through text-muted-foreground"
                                        : "text-foreground"
                                    }
                                  >
                                    {task.label}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </section>
                    )}

                    {/* Ejemplos */}
                    {(challenge.exampleInput || challenge.exampleOutput) && (
                      <section className="rounded-lg border border-border overflow-hidden bg-white dark:bg-[#1a1a1a]">
                        <button
                          onClick={() => setShowExamples((v) => !v)}
                          className="w-full flex items-center justify-between px-3 py-2 font-semibold text-sm text-foreground hover:bg-muted transition-all"
                        >
                          <span>Ejemplos</span>
                          <span>{showExamples ? "▼" : "▶"}</span>
                        </button>
                        {showExamples && (
                          <div className="px-3 py-3 border-t border-border space-y-3">
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

                    {/* Pistas */}
                    {challenge.hints && challenge.hints.length > 0 && (
                      <section className="rounded-lg border border-border overflow-hidden bg-white dark:bg-[#1a1a1a]">
                        <button
                          onClick={() => setShowHints((v) => !v)}
                          className="w-full flex items-center justify-between px-3 py-2 font-semibold text-sm text-foreground hover:bg-muted transition-all"
                        >
                          <span>
                            {learningMode === "arena"
                              ? "💡 Pistas (penaliza enfoque)"
                              : "💡 Pistas"}
                          </span>
                          <span>{showHints ? "▼" : "▶"}</span>
                        </button>
                        {showHints && (
                          <div className="px-3 py-3 border-t border-border">
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

            {leftPanelCollapsed && (
              <button
                onClick={() => setLeftPanelCollapsed(false)}
                className="w-10 flex-shrink-0 glass border-r border-border/50 hover:bg-primary/10 transition-all flex items-center justify-center group"
                title="Mostrar descripcion"
              >
                <svg
                  className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 5l7 7-7 7M5 5l7 7-7 7"
                  />
                </svg>
              </button>
            )}
          </>
        )}

        {/* ── Right Panel - Multi-file Editor ──────────────────────────────── */}
        {challenge && (
          <section className="flex-1 h-full overflow-hidden flex flex-col bg-[#0d1117]">
            {/* Editor Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 glass border-b border-border/30">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="text-xs text-muted-foreground font-mono font-semibold">
                  {challenge.language}
                </span>
                {isGeneratingFiles && (
                  <span className="text-xs text-purple-400 flex items-center gap-2 animate-pulse">
                    <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    Generando archivos...
                  </span>
                )}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowThemeSelector((v) => !v)}
                  className="btn-ghost px-3 py-1.5 text-xs flex items-center gap-2"
                >
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
                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                    />
                  </svg>
                  Tema
                </button>
                {showThemeSelector && (
                  <div className="absolute right-0 top-full mt-2 glass border border-border/50 rounded-xl shadow-xl z-50 p-2 min-w-[180px] animate-fade-in-up">
                    <p className="text-[10px] text-muted-foreground font-semibold px-2 py-1 mb-1">
                      Seleccionar tema
                    </p>
                    <div className="flex flex-col gap-0.5">
                      {MONACO_THEMES.map((theme) => (
                        <button
                          key={theme.value}
                          onClick={() => {
                            setEditorTheme(theme.value);
                            setShowThemeSelector(false);
                          }}
                          className={`px-3 py-2 text-xs rounded-lg text-left transition-all flex items-center gap-2 ${editorTheme === theme.value ? "bg-primary/20 text-primary font-semibold" : "text-foreground/80 hover:bg-muted"}`}
                        >
                          <span
                            className="w-3 h-3 rounded-full border border-border"
                            style={{ backgroundColor: theme.color }}
                          ></span>
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
            <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 glass border-t border-border/30">
              <button
                onClick={handleSubmitCode}
                disabled={
                  isEvaluating || isGeneratingFiles || files.length === 0
                }
                className="btn-primary px-6 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isEvaluating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Evaluando...
                  </>
                ) : (
                  <>
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
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Ejecutar
                  </>
                )}
              </button>
              {(evaluation ||
                files.some((f) => f.content !== f.placeholder)) && (
                <button
                  onClick={retryChallenge}
                  className="btn-ghost px-4 py-2 text-sm"
                >
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
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Reintentar
                </button>
              )}
              {/* Info de archivos que se evaluaran */}
              {files.length > 1 && (
                <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Evaluando {files.length} archivos
                </span>
              )}
            </div>

            {/* ── Evaluation Feedback ───────────────────────────────────── */}
            {evaluation && (
              <div className="flex-shrink-0 bg-[#1e1e1e] border-t border-[#3e3e3e]">
                <button
                  onClick={() => setShowFeedback(!showFeedback)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-[#2d2d2d] hover:bg-[#3e3e3e] transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-bold ${evaluation.success ? "text-green-400" : "text-red-400"}`}
                    >
                      {evaluation.success ? "✓ Aprobado" : "✗ Rechazado"}
                    </span>
                    <span
                      className={`text-sm font-bold ${evaluation.success ? "text-green-400" : "text-red-400"}`}
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

                {showFeedback && (
                  <div className="max-h-[40vh] overflow-y-auto p-4 scrollbar-thin">
                    <div
                      className={`rounded-lg border-l-4 p-4 ${evaluation.success ? "bg-green-900/20 border-green-500" : "bg-red-900/20 border-red-500"}`}
                    >
                      <h3
                        className={`text-lg font-bold mb-2 ${evaluation.success ? "text-green-400" : "text-red-400"}`}
                      >
                        {evaluation.success
                          ? "✓ Código Aprobado"
                          : "✗ Código Rechazado"}
                      </h3>
                      <p className="text-sm text-gray-300 mb-3">
                        {evaluation.feedback}
                      </p>

                      {evaluation.feedbackLayers && (
                        <div className="mb-3 space-y-2 text-xs">
                          <div className="bg-[#111827] border border-gray-700 rounded p-2">
                            <p className="text-gray-400 font-semibold mb-1">
                              Rapido (10s)
                            </p>
                            <p className="text-gray-300">
                              {evaluation.feedbackLayers.rapido}
                            </p>
                          </div>
                          <div className="bg-[#111827] border border-gray-700 rounded p-2">
                            <p className="text-gray-400 font-semibold mb-1">
                              Tecnico (1 min)
                            </p>
                            <p className="text-gray-300">
                              {evaluation.feedbackLayers.tecnico}
                            </p>
                          </div>
                          <div className="bg-[#111827] border border-gray-700 rounded p-2">
                            <p className="text-gray-400 font-semibold mb-1">
                              Profundo (5 min)
                            </p>
                            <p className="text-gray-300">
                              {evaluation.feedbackLayers.profundo}
                            </p>
                          </div>
                        </div>
                      )}

                      {evaluation.dimensions && (
                        <div className="mb-3 pt-2 border-t border-gray-700">
                          <h4 className="text-sm font-semibold text-gray-300 mb-2">
                            Matriz de evaluacion
                          </h4>
                          <div className="grid grid-cols-2 gap-1">
                            {Object.entries(evaluation.dimensions)
                              .slice(0, 5)
                              .map(([key, value]) => (
                                <div
                                  key={key}
                                  className="text-xs flex items-center justify-between bg-[#111827] border border-gray-700 rounded px-2 py-1"
                                >
                                  <span className="text-gray-400 capitalize">
                                    {key.replace(/_/g, " ")}
                                  </span>
                                  <span className="text-gray-200 font-semibold">
                                    {value}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Feedback por archivo */}
                      {evaluation.filesFeedback &&
                        evaluation.filesFeedback.length > 0 && (
                          <div className="mb-3 space-y-1">
                            {evaluation.filesFeedback.map((fb, i) => {
                              const colors = {
                                ok: "text-green-400",
                                warning: "text-yellow-400",
                                error: "text-red-400",
                              };
                              const icons = {
                                ok: "✓",
                                warning: "⚠",
                                error: "✗",
                              };
                              return (
                                <div
                                  key={i}
                                  className="flex items-start gap-2 text-xs"
                                >
                                  <span
                                    className={`font-mono font-bold ${colors[fb.status]}`}
                                  >
                                    {icons[fb.status]}
                                  </span>
                                  <span className="font-mono text-gray-400">
                                    {fb.filename}:
                                  </span>
                                  <span className="text-gray-300">
                                    {fb.comment}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}

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
