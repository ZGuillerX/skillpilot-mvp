"use client";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import eventEmitter, { EVENTS } from "@/lib/events";
import { getUserProgress } from "@/lib/userProgress";
import { checkAchievements } from "./Achievements";

/**
 * Componente invisible que escucha eventos de retos completados
 * y muestra notificaciones de logros desbloqueados
 */
export default function AchievementListener() {
  const previousUnlockedRef = useRef(new Set());
  const isInitializedRef = useRef(false);

  const checkForNewAchievements = async () => {
    try {
      // Obtener progreso actual
      const progress = await getUserProgress();
      const currentPlan = progress?.learning_plan?.currentPlan;

      if (!currentPlan) return;

      const history =
        progress?.challenge_history?.filter(
          (entry) => entry.planId === currentPlan.id
        ) || [];

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

      // Calcular logros desbloqueados
      const unlockedAchievements = checkAchievements(stats, history);
      const currentUnlockedIds = new Set(unlockedAchievements.map((a) => a.id));

      console.log("🎯 AchievementListener - Verificando logros:", {
        completed: stats.completed,
        historyLength: history.length,
        unlockedCount: currentUnlockedIds.size,
        unlocked: Array.from(currentUnlockedIds),
        isInitialized: isInitializedRef.current,
      });

      // Solo mostrar notificaciones después de la inicialización
      if (isInitializedRef.current) {
        // Encontrar nuevos logros
        const newAchievements = unlockedAchievements.filter(
          (achievement) => !previousUnlockedRef.current.has(achievement.id)
        );

        if (newAchievements.length > 0) {
          console.log(
            "🎉 NUEVOS LOGROS DETECTADOS:",
            newAchievements.map((a) => a.title)
          );

          // Mostrar notificación para cada nuevo logro
          newAchievements.forEach((achievement) => {
            toast.success(`🏆 ¡Logro desbloqueado!`, {
              description: `${achievement.title}: ${achievement.description}`,
              duration: 6000,
            });
          });
        }
      } else {
        console.log("💾 Inicializando logros sin notificaciones");
        isInitializedRef.current = true;
      }

      // Actualizar referencia de logros previos
      previousUnlockedRef.current = currentUnlockedIds;
    } catch (error) {
      console.error("Error checking achievements:", error);
    }
  };

  useEffect(() => {
    // Inicializar con los logros actuales
    checkForNewAchievements();

    // Escuchar eventos de retos completados
    const handleChallengeCompleted = () => {
      console.log(
        "🔔 Evento de reto completado recibido - verificando logros..."
      );
      // Esperar un poco para que se guarde el reto
      setTimeout(() => {
        checkForNewAchievements();
      }, 500);
    };

    eventEmitter.on(EVENTS.CHALLENGE_COMPLETED, handleChallengeCompleted);
    eventEmitter.on(EVENTS.CHALLENGE_SAVED, handleChallengeCompleted);

    return () => {
      eventEmitter.off(EVENTS.CHALLENGE_COMPLETED, handleChallengeCompleted);
      eventEmitter.off(EVENTS.CHALLENGE_SAVED, handleChallengeCompleted);
    };
  }, []);

  // Este componente no renderiza nada
  return null;
}
