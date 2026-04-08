"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getUserProgress } from "@/lib/userProgress";
import {
  getAdaptiveMemory,
  getBottleneckCapability,
} from "@/lib/challengeManager";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import AchievementsGrid from "@/components/Achievements";
import { FadeIn } from "@/components/ui/Animations";
import { toast } from "sonner";
import { ChartIcon, TrophyIcon } from "@/components/ui/Icons";
import eventEmitter, { EVENTS } from "@/lib/events";

export default function StatsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("analytics"); // analytics | achievements | capabilities
  const [adaptiveMemory, setAdaptiveMemory] = useState(null);
  const [bottleneck, setBottleneck] = useState("decomposicion");

  useEffect(() => {
    // Esperar a que termine de verificar autenticación
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }
    loadProgress();

    // Actualizar estadísticas cada 10 segundos
    const interval = setInterval(() => {
      loadProgress(true); // Silencioso, sin loading spinner
    }, 10000);

    return () => clearInterval(interval);
  }, [user, authLoading, router]);

  // Listener para actualizar en tiempo real cuando se completa un reto
  useEffect(() => {
    const handleChallengeEvent = () => {
      console.log("🔄 Challenge event detected, refreshing stats...");
      loadProgress(true); // Actualización silenciosa
    };

    eventEmitter.on(EVENTS.CHALLENGE_COMPLETED, handleChallengeEvent);
    eventEmitter.on(EVENTS.CHALLENGE_SAVED, handleChallengeEvent);

    return () => {
      eventEmitter.off(EVENTS.CHALLENGE_COMPLETED, handleChallengeEvent);
      eventEmitter.off(EVENTS.CHALLENGE_SAVED, handleChallengeEvent);
    };
  }, []);

  const loadProgress = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await getUserProgress();
      setProgress(data);
      const memory = await getAdaptiveMemory();
      setAdaptiveMemory(memory);
      const bottleneckCapability = await getBottleneckCapability();
      setBottleneck(bottleneckCapability);
    } catch (error) {
      console.error("Error loading progress:", error);
      if (!silent) toast.error("Error al cargar las estadísticas");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadProgress(true);
      toast.success("Estadísticas actualizadas");
    } catch (error) {
      toast.error("Error al actualizar");
    } finally {
      setRefreshing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  const currentPlan = progress?.learning_plan?.currentPlan;
  const history = currentPlan
    ? progress?.challenge_history?.filter(
        (entry) => entry.planId === currentPlan.id,
      ) || []
    : [];

  const completedChallenges = history.filter(
    (entry) => entry.evaluation?.success,
  ).length;

  const scores = history
    .filter((entry) => entry.evaluation?.score !== undefined)
    .map((entry) => entry.evaluation.score);

  const averageScore =
    scores.length > 0
      ? Math.round(
          scores.reduce((sum, score) => sum + score, 0) / scores.length,
        )
      : 0;

  const stats = {
    completed: completedChallenges,
    averageScore: averageScore,
    totalAttempts: history.length,
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <FadeIn>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  {activeTab === "analytics" ? (
                    <ChartIcon className="w-8 h-8 text-primary" />
                  ) : (
                    <TrophyIcon className="w-8 h-8 text-primary" />
                  )}
                  <h1 className="text-4xl font-bold text-foreground">
                    {activeTab === "analytics" ? "Estadísticas" : "Logros"}
                  </h1>
                </div>
                {currentPlan && (
                  <p className="text-muted-foreground mt-2">
                    Plan actual:{" "}
                    <span className="font-medium">{currentPlan.goal}</span>
                  </p>
                )}
              </div>

              {/* Tabs y botón de refresh */}
              <div className="flex gap-2">
                {/* Botón de actualizar */}
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors disabled:opacity-50"
                  title="Actualizar estadísticas"
                >
                  <svg
                    className={`w-5 h-5 text-foreground ${
                      refreshing ? "animate-spin" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>

                {/* Tabs */}
              </div>
              <div className="flex gap-2 bg-muted p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab("analytics")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                    activeTab === "analytics"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ChartIcon className="w-4 h-4" />
                  Analíticas
                </button>
                <button
                  onClick={() => setActiveTab("achievements")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                    activeTab === "achievements"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <TrophyIcon className="w-4 h-4" />
                  Logros
                </button>
                <button
                  onClick={() => setActiveTab("capabilities")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                    activeTab === "capabilities"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ChartIcon className="w-4 h-4" />
                  Capacidades
                </button>
              </div>
            </div>
          </FadeIn>

          {/* Content */}
          {!currentPlan ? (
            <FadeIn delay={0.2}>
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <svg
                  className="w-16 h-16 text-muted-foreground mx-auto mb-4"
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
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No hay plan activo
                </h3>
                <p className="text-muted-foreground mb-6">
                  Crea un plan de aprendizaje para empezar a ver tus
                  estadísticas
                </p>
                <button
                  onClick={() => router.push("/onboarding")}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                >
                  Crear Plan
                </button>
              </div>
            </FadeIn>
          ) : (
            <div>
              {activeTab === "analytics" ? (
                <AnalyticsDashboard stats={stats} history={history} />
              ) : activeTab === "capabilities" ? (
                <CapabilitiesPanel
                  adaptiveMemory={adaptiveMemory}
                  bottleneck={bottleneck}
                  history={history}
                />
              ) : (
                <AchievementsGrid stats={stats} history={history} />
              )}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

function getWeekKey(dateValue) {
  const d = new Date(dateValue || Date.now());
  const start = new Date(Date.UTC(d.getFullYear(), 0, 1));
  const dayMs = 24 * 60 * 60 * 1000;
  const week = Math.ceil(((d - start) / dayMs + start.getUTCDay() + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function buildCapabilityWeeklyEvolution(history = []) {
  const buckets = {};
  history.forEach((entry) => {
    const dims = entry?.evaluation?.dimensions;
    if (!dims || typeof dims !== "object") return;
    const week = getWeekKey(entry.completedAt || entry.savedAt);
    if (!buckets[week]) buckets[week] = { sum: {}, count: {} };
    Object.entries(dims).forEach(([k, v]) => {
      if (typeof v !== "number") return;
      buckets[week].sum[k] = (buckets[week].sum[k] || 0) + v;
      buckets[week].count[k] = (buckets[week].count[k] || 0) + 1;
    });
  });

  return Object.entries(buckets)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([week, data]) => {
      const averages = {};
      Object.keys(data.sum).forEach((k) => {
        averages[k] = Math.round(data.sum[k] / data.count[k]);
      });
      return { week, averages };
    })
    .slice(-8);
}

function CapabilitiesPanel({ adaptiveMemory, bottleneck, history }) {
  const scores = adaptiveMemory?.capabilityScores || {};
  const evolution = buildCapabilityWeeklyEvolution(history);
  const capabilities = Object.entries(scores);

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-xl font-bold text-foreground mb-2">
          Mapa de capacidades
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Tu cuello de botella actual es{" "}
          <span className="font-semibold text-primary">{bottleneck}</span>.
        </p>
        <div className="space-y-3">
          {capabilities.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Aun no hay datos de capacidades.
            </p>
          )}
          {capabilities.map(([name, value]) => (
            <div key={name}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="capitalize text-foreground">
                  {name.replace(/_/g, " ")}
                </span>
                <span className="text-muted-foreground font-semibold">
                  {value}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{
                    width: `${Math.max(0, Math.min(100, value || 0))}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-xl font-bold text-foreground mb-2">
          Evolucion semanal
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Promedio semanal por capacidad (ultimas 8 semanas con actividad).
        </p>
        {evolution.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aun no hay suficientes evaluaciones para mostrar evolucion.
          </p>
        ) : (
          <div className="space-y-3">
            {evolution.map((row) => (
              <div
                key={row.week}
                className="border border-border rounded-lg p-3"
              >
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  {row.week}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(row.averages)
                    .slice(0, 6)
                    .map(([k, v]) => (
                      <div
                        key={k}
                        className="text-xs flex items-center justify-between bg-muted/60 rounded px-2 py-1"
                      >
                        <span className="capitalize text-foreground">
                          {k.replace(/_/g, " ")}
                        </span>
                        <span className="font-semibold text-primary">{v}</span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
