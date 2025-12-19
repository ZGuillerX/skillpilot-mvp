"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getUserProgress } from "@/lib/userProgress";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import AchievementsGrid from "@/components/Achievements";
import { FadeIn } from "@/components/ui/Animations";
import { toast } from "sonner";
import { ChartIcon, TrophyIcon } from "@/components/ui/Icons";

export default function StatsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("analytics"); // analytics | achievements

  useEffect(() => {
    // Esperar a que termine de verificar autenticación
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }
    loadProgress();
  }, [user, authLoading, router]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const data = await getUserProgress();
      setProgress(data);
    } catch (error) {
      console.error("Error loading progress:", error);
      toast.error("Error al cargar las estadísticas");
    } finally {
      setLoading(false);
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
        (entry) => entry.planId === currentPlan.id
      ) || []
    : [];

  const completedChallenges = history.filter(
    (entry) => entry.evaluation?.success
  ).length;

  const scores = history
    .filter((entry) => entry.evaluation?.score !== undefined)
    .map((entry) => entry.evaluation.score);

  const averageScore =
    scores.length > 0
      ? Math.round(
          scores.reduce((sum, score) => sum + score, 0) / scores.length
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

              {/* Tabs */}
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
