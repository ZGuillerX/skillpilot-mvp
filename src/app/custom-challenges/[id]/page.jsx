"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Cookies from "js-cookie";
import MultiFileEditor from "@/components/MultiFileEditor";
import { getLearningPlan } from "@/lib/challengeManager";
import { getLiveProjectBoard, saveLiveProjectWeek } from "@/lib/userProgress";

const MONACO_THEMES = [
  { name: "Visual Studio Dark", value: "vs-dark", color: "#1e1e1e" },
  { name: "Visual Studio Light", value: "vs-light", color: "#fff" },
  { name: "GitHub Dark", value: "github-dark", color: "#0d1117" },
  { name: "GitHub Light", value: "github-light", color: "#fff" },
  { name: "Dracula", value: "dracula", color: "#282a36" },
  { name: "Monokai", value: "monokai", color: "#272822" },
  { name: "Solarized Dark", value: "solarized-dark", color: "#002b36" },
  { name: "One Dark", value: "onedark", color: "#282c34" },
  { name: "Nord", value: "nord", color: "#2e3440" },
];

const getDifficultyColor = (difficulty) => {
  switch (difficulty) {
    case "beginner":
      return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30";
    case "intermediate":
      return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30";
    case "advanced":
      return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30";
    default:
      return "text-gray-600 bg-gray-100";
  }
};

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
  } catch {
    const lang = challenge.language?.toLowerCase() || "javascript";
    let filename = "solution.js";
    if (lang.includes("python")) filename = "solution.py";
    else if (lang.includes("typescript")) filename = "solution.ts";
    else if (lang.includes("java")) filename = "Solution.java";
    else if (lang.includes("c++")) filename = "solution.cpp";
    return [
      {
        id: `file-0-${Date.now()}`,
        filename,
        language: lang,
        content: "// Escribe tu solución aquí\n",
        placeholder: "// Escribe tu solución aquí\n",
        required: true,
        description: "Archivo principal de la solución",
      },
    ];
  }
}

export default function CustomChallengeEditorPage() {
  const { id } = useParams();
  const router = useRouter();

  const [challenge, setChallenge] = useState(null);
  const [files, setFiles] = useState([]);
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(true);
  const [isGeneratingFiles, setIsGeneratingFiles] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(true);
  const [editorTheme, setEditorTheme] = useState("vs-dark");
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [challengeStartTime, setChallengeStartTime] = useState(null);
  const [learningMode, setLearningMode] = useState("tutor");
  const [showDesc, setShowDesc] = useState(true);
  const [showCriteria, setShowCriteria] = useState(true);
  const [showExamples, setShowExamples] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [learningPlan, setLearningPlan] = useState(null);
  const [projectWeekData, setProjectWeekData] = useState(null);
  const [projectSaving, setProjectSaving] = useState(false);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const createDefaultProjectTasks = () => [
    {
      id: "task-1",
      label: "Definir alcance del incremento semanal",
      done: false,
    },
    { id: "task-2", label: "Implementar funcionalidad principal", done: false },
    { id: "task-3", label: "Probar con casos normales y borde", done: false },
    { id: "task-4", label: "Documentar decision tecnica clave", done: false },
  ];

  // Cargar reto
  useEffect(() => {
    const load = async () => {
      setIsLoadingChallenge(true);
      try {
        const token = Cookies.get("token");
        const res = await fetch(`/api/user/custom-challenges/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("No encontrado");
        const data = await res.json();
        const ch = data.challenge.challenge_data;
        setChallenge(ch);
        setIsCompleted(data.challenge.status === "completed");
        if (data.challenge.status !== "completed") {
          setTimerRunning(true);
          setChallengeStartTime(Date.now());
          await fetch(`/api/user/custom-challenges/${id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: "in_progress" }),
          });
        }

        setIsGeneratingFiles(true);
        const generatedFiles = await generateFilesForChallenge(ch);
        setFiles(generatedFiles);
      } catch {
        toast.error("Error al cargar el reto");
        router.push("/custom-challenges");
      } finally {
        setIsLoadingChallenge(false);
        setIsGeneratingFiles(false);
      }
    };
    if (id) load();
  }, [id]);

  useEffect(() => {
    const loadPlan = async () => {
      const plan = await getLearningPlan();
      setLearningPlan(plan || null);
    };
    loadPlan();
  }, []);

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
        tasks: createDefaultProjectTasks(),
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

    const previous = projectWeekData;
    const updatedTasks = previous.tasks.map((task) =>
      task.id === taskId ? { ...task, done: !task.done } : task,
    );
    const updatedWeek = { ...previous, tasks: updatedTasks };
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
      setProjectWeekData(previous);
    } finally {
      setProjectSaving(false);
    }
  };

  // Timer
  useEffect(() => {
    let interval;
    if (timerRunning) {
      interval = setInterval(() => setTimer((p) => p + 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning]);

  useEffect(() => {
    if (learningMode === "arena") {
      setShowHints(false);
    }
  }, [learningMode]);

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
      setShowFeedback(true);

      const token = Cookies.get("token");

      if (result.success) {
        setIsCompleted(true);
        setTimerRunning(false);
        toast.success(`¡Aprobado! ${result.score}%`);
        await fetch(`/api/user/custom-challenges/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: "completed", score: result.score }),
        });
      } else {
        toast.error(`${result.score}% — Revisa el feedback`);
        await fetch(`/api/user/custom-challenges/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ score: result.score }),
        });
      }
    } catch (err) {
      console.error(err);
      setEvaluation({
        success: false,
        score: 0,
        feedback: "Error al evaluar. Intenta de nuevo.",
        suggestions: [],
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const retryChallenge = () => {
    setFiles((prev) =>
      prev.map((f) => ({
        ...f,
        content: f.placeholder || "// Tu código aquí\n",
      })),
    );
    setEvaluation(null);
    setTimer(0);
    setTimerRunning(true);
    setChallengeStartTime(Date.now());
    setIsCompleted(false);
  };

  if (isLoadingChallenge) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando reto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-background">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <section className="flex-shrink-0 flex flex-col gap-2 px-6 py-2 border-b border-border bg-white/90 dark:bg-[#16161a]/90 shadow-sm">
        <div className="flex items-start justify-between gap-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/custom-challenges")}
              className="p-1.5 hover:bg-muted rounded-lg transition text-muted-foreground hover:text-foreground"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground mb-0.5">
                Reto Personalizado
              </h1>
              <p className="text-xs text-muted-foreground">
                {challenge?.language} • {challenge?.estimatedTimeMinutes} min
                estimado
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-1.5 border-t border-border">
          <div className="px-2 py-1 bg-muted rounded-lg flex items-center gap-1">
            <button
              onClick={() => setLearningMode("tutor")}
              className={`text-[10px] px-2 py-0.5 rounded font-semibold ${learningMode === "tutor" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Tutor
            </button>
            <button
              onClick={() => setLearningMode("arena")}
              className={`text-[10px] px-2 py-0.5 rounded font-semibold ${learningMode === "arena" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Arena
            </button>
          </div>

          <div className="px-4 py-1 bg-muted rounded-lg flex items-center gap-2">
            {challenge && (
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getDifficultyColor(challenge.difficulty)}`}
              >
                {challenge.difficulty}
              </span>
            )}
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

          <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center gap-2">
            <svg
              className="w-4 h-4 text-blue-500"
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
              className={`text-sm font-bold ${timerRunning ? "text-blue-500" : "text-gray-500"}`}
            >
              {formatTime(timer)}
            </span>
          </div>

          {files.length > 0 && (
            <div className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-lg flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5 text-purple-400"
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
              <span className="text-xs font-semibold text-purple-400">
                {files.length} archivo{files.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {challenge?.concepts && (
            <div className="ml-auto flex gap-1.5 flex-wrap justify-end">
              {challenge.concepts.slice(0, 3).map((concept, i) => (
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
      </section>

      {/* ── Main Content ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-row w-full overflow-hidden bg-background">
        {challenge && (
          <>
            {/* Panel izquierdo */}
            {!leftPanelCollapsed && (
              <section className="w-[420px] h-full border-r border-border bg-white dark:bg-[#0f0f0f] flex flex-col flex-shrink-0">
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

                <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 scrollbar-thin">
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
                className="w-8 flex-shrink-0 bg-white dark:bg-[#1a1a1a] border-r border-border hover:bg-muted transition flex items-center justify-center"
                title="Mostrar descripción"
              >
                ▶
              </button>
            )}
          </>
        )}

        {/* ── Panel derecho — Editor ──────────────────────────────────────── */}
        {challenge && (
          <section className="flex-1 h-full overflow-hidden flex flex-col bg-[#1e1e1e]">
            {/* Editor Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 bg-[#2d2d2d] border-b border-[#3e3e3e]">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-semibold">
                  {challenge.language}
                </span>
                {isGeneratingFiles && (
                  <span className="text-xs text-purple-400 flex items-center gap-1">
                    <div className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin" />
                    generando archivos...
                  </span>
                )}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowThemeSelector((v) => !v)}
                  className="px-2 py-1 text-xs rounded hover:bg-[#3e3e3e] text-gray-300 flex items-center gap-1"
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
                          className={`px-2 py-1 text-xs rounded text-left hover:bg-[#3e3e3e] transition ${editorTheme === theme.value ? "bg-primary text-primary-foreground" : "text-gray-300"}`}
                        >
                          {theme.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Editor */}
            <MultiFileEditor
              files={files}
              onFilesChange={setFiles}
              language={challenge.language}
              theme={editorTheme}
              filesFeedback={evaluation?.filesFeedback || []}
              isLoading={isGeneratingFiles && files.length === 0}
            />

            {/* ── Botones de acción ─────────────────────────────────────── */}
            <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-[#2d2d2d] border-t border-[#3e3e3e]">
              <button
                onClick={handleSubmitCode}
                disabled={
                  isEvaluating || isGeneratingFiles || files.length === 0
                }
                className="px-4 py-1.5 rounded bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {isEvaluating ? "Evaluando..." : "Ejecutar"}
              </button>
              {(evaluation ||
                files.some((f) => f.content !== f.placeholder)) && (
                <button
                  onClick={retryChallenge}
                  className="px-4 py-1.5 rounded bg-muted text-foreground text-sm font-semibold hover:bg-muted/80 transition"
                >
                  Reintentar
                </button>
              )}
              {files.length > 1 && (
                <span className="text-xs text-gray-500 ml-auto">
                  Evaluando {files.length} archivos
                </span>
              )}
            </div>

            {/* ── Feedback de evaluación ────────────────────────────────── */}
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
