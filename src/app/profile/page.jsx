"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUserProgress,
  clearAllPlans,
  switchPlan,
  deleteLearningPlan,
} from "@/lib/userProgress";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [switching, setSwitching] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const data = await getUserProgress();
      setProgress(data);
    } catch (error) {
      console.error("Error loading progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearPlans = async () => {
    if (
      !confirm(
        "¿Estás seguro? Esto eliminará todos tus planes y progreso de retos."
      )
    ) {
      return;
    }

    setClearing(true);
    try {
      await clearAllPlans();
      await loadProgress();
      alert("Todos los planes han sido eliminados exitosamente");
    } catch (error) {
      alert("Error al eliminar los planes: " + error.message);
    } finally {
      setClearing(false);
    }
  };

  const handleSwitchPlan = async (planId) => {
    setSwitching(planId);
    try {
      await switchPlan(planId);
      await loadProgress();
      alert("Plan cambiado exitosamente. Ve a Retos Infinitos para continuar.");
      router.push("/challenges");
    } catch (error) {
      alert("Error al cambiar de plan: " + error.message);
    } finally {
      setSwitching(null);
    }
  };

  const handleDeletePlan = async (planId, planName) => {
    if (
      !confirm(
        `¿Estás seguro de eliminar el plan "${planName}"? Esto también eliminará todos los retos asociados.`
      )
    ) {
      return;
    }

    setDeleting(planId);
    try {
      await deleteLearningPlan(planId);
      await loadProgress();
      alert("Plan eliminado exitosamente");
    } catch (error) {
      alert("Error al eliminar el plan: " + error.message);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  const plans = progress?.learning_plan?.plans || [];
  const currentPlan = progress?.learning_plan?.currentPlan;

  // Calcular estadísticas solo del plan activo
  const currentPlanChallenges = currentPlan
    ? progress?.challenge_history?.filter(
        (entry) => entry.planId === currentPlan.id
      ) || []
    : [];

  const completedChallenges = currentPlanChallenges.filter(
    (entry) => entry.evaluation?.success
  ).length;

  const totalChallenges = currentPlanChallenges.length;

  const scores = currentPlanChallenges
    .filter((entry) => entry.evaluation?.score !== undefined)
    .map((entry) => entry.evaluation.score);

  const averageScore =
    scores.length > 0
      ? Math.round(
          scores.reduce((sum, score) => sum + score, 0) / scores.length
        )
      : 0;

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-card border border-border rounded-xl p-8">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-3xl font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {user?.name}
              </h1>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {completedChallenges}
                </p>
                <p className="text-sm text-muted-foreground">
                  Retos completados
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
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
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {plans.length}/5
                </p>
                <p className="text-sm text-muted-foreground">
                  Planes guardados
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600 dark:text-green-400"
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
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {averageScore}%
                </p>
                <p className="text-sm text-muted-foreground">Score promedio</p>
              </div>
            </div>
          </div>
        </div>

        {/* Plans List */}
        <div className="bg-card border border-border rounded-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              Mis Planes de Aprendizaje
            </h2>
            {plans.length > 0 && (
              <button
                onClick={handleClearPlans}
                disabled={clearing}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
              >
                {clearing ? "Eliminando..." : "Limpiar todos"}
              </button>
            )}
          </div>

          {plans.length === 0 ? (
            <div className="text-center py-12">
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
              <p className="text-muted-foreground mb-4">
                No tienes planes de aprendizaje guardados
              </p>
              <button
                onClick={() => router.push("/onboarding")}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Crear mi primer plan
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {plans.map((plan, index) => {
                const planChallenges =
                  progress?.challenge_history?.filter(
                    (entry) => entry.planId === plan.id
                  ) || [];
                const completedCount = planChallenges.filter(
                  (entry) => entry.evaluation?.success
                ).length;

                return (
                  <div
                    key={plan.id}
                    className="border border-border rounded-lg p-6 hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            {plan.goal}
                          </h3>
                          {progress?.learning_plan?.currentPlan?.id ===
                            plan.id && (
                            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs font-semibold rounded-full">
                              Activo
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                          <span className="inline-flex items-center gap-1">
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
                                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                              />
                            </svg>
                            {plan.level}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(plan.createdAt).toLocaleDateString(
                              "es-ES",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </span>
                          <span>•</span>
                          <span>
                            {completedCount} reto
                            {completedCount !== 1 ? "s" : ""} completado
                            {completedCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeletePlan(plan.id, plan.goal)}
                        disabled={deleting === plan.id}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                        title="Eliminar plan"
                      >
                        {deleting === plan.id ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                        ) : (
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {progress?.learning_plan?.currentPlan?.id === plan.id ? (
                        <span className="px-4 py-1.5 text-sm font-medium text-muted-foreground border border-border rounded-lg cursor-not-allowed">
                          Plan activo
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSwitchPlan(plan.id)}
                          disabled={switching === plan.id}
                          className="px-4 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                          {switching === plan.id
                            ? "Cambiando..."
                            : "Activar plan"}
                        </button>
                      )}

                      <a
                        href={`/history?plan=${plan.id}`}
                        className="px-4 py-1.5 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-primary/10 transition-colors inline-flex items-center gap-2"
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
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                        Ver retos ({planChallenges.length})
                      </a>
                    </div>
                  </div>
                );
              })}

              {plans.length >= 5 && (
                <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Has alcanzado el límite de 5 planes. Elimina algunos para
                    crear nuevos.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
