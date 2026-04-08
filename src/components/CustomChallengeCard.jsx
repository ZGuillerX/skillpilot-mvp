"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { StarIcon, LightBulbIcon } from "./ui/Icons";
import Cookies from "js-cookie";

export default function CustomChallengeCard({
  challenge,
  onStatusChange,
  onFavoriteChange,
}) {
  const router = useRouter();
  const [showHints, setShowHints] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggleFavorite = async () => {
    setIsUpdating(true);
    try {
      const token = Cookies.get("token");
      const isFavorite = challenge.is_favorite ? 0 : 1;
      const response = await fetch(
        `/api/user/custom-challenges/${challenge.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            isFavorite: isFavorite === 1,
          }),
        },
      );

      if (!response.ok) throw new Error("Error al actualizar favorito");

      toast.success(
        isFavorite ? "Agregado a favoritos ⭐" : "Removido de favoritos",
      );
      if (onFavoriteChange) onFavoriteChange(isFavorite === 1);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const data = challenge.challenge_data || challenge;
  const statusColors = {
    generated: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    in_progress: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    completed: "bg-green-500/20 text-green-400 border-green-500/30",
  };

  const difficultyColors = {
    beginner: "bg-green-500/20 text-green-400",
    intermediate: "bg-yellow-500/20 text-yellow-400",
    advanced: "bg-red-500/20 text-red-400",
  };

  const difficultyLabels = {
    beginner: "Principiante",
    intermediate: "Intermedio",
    advanced: "Avanzado",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-background border border-border rounded-xl p-6 space-y-4 hover:border-primary/50 transition-all"
    >
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground">{data.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {data.description}
            </p>
          </div>
          {challenge.is_favorite && (
            <StarIcon className="w-5 h-5 text-amber-400 flex-shrink-0" filled />
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mt-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[challenge.status] || statusColors.generated}`}
          >
            {challenge.status === "generated" && "Generado"}
            {challenge.status === "in_progress" && "En Progreso"}
            {challenge.status === "completed" && "Completado"}
            {challenge.status === "abandoned" && "Abandonado"}
          </span>

          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${difficultyColors[data.difficulty]}`}
          >
            {difficultyLabels[data.difficulty]}
          </span>

          <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
            {data.language}
          </span>

          <span className="px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            ⏱️ {data.estimatedTimeMinutes} min
          </span>
        </div>
      </div>

      {/* Criterios de aceptación */}
      <div className="space-y-2">
        <h4 className="font-semibold text-sm text-foreground">
          Criterios de Aceptación
        </h4>
        <ul className="space-y-1">
          {data.acceptanceCriteria?.map((criterion, idx) => (
            <li key={idx} className="text-sm text-muted-foreground flex gap-2">
              <span className="text-primary">✓</span>
              <span>{criterion}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Conceptos */}
      {data.concepts && data.concepts.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-foreground">Conceptos</h4>
          <div className="flex flex-wrap gap-2">
            {data.concepts.map((concept, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded"
              >
                {concept}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Ejemplos */}
      {(data.exampleInput || data.exampleOutput) && (
        <div className="space-y-2 bg-background/50 p-3 rounded-lg border border-border">
          <h4 className="font-semibold text-sm text-foreground">Ejemplo</h4>
          {data.exampleInput && (
            <div>
              <p className="text-xs text-muted-foreground">Entrada:</p>
              <code className="text-xs bg-background p-2 rounded block overflow-x-auto">
                {data.exampleInput}
              </code>
            </div>
          )}
          {data.exampleOutput && (
            <div>
              <p className="text-xs text-muted-foreground">Salida:</p>
              <code className="text-xs bg-background p-2 rounded block overflow-x-auto">
                {data.exampleOutput}
              </code>
            </div>
          )}
        </div>
      )}

      {/* Pistas */}
      {data.hints && data.hints.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowHints(!showHints)}
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <LightBulbIcon className="w-4 h-4" />
            {showHints ? "Ocultar" : "Mostrar"} Pistas ({data.hints.length})
          </button>

          {showHints && (
            <div className="space-y-2 pl-4 border-l-2 border-primary">
              {data.hints.map((hint, idx) => (
                <p key={idx} className="text-sm text-muted-foreground">
                  💡 {hint}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-muted-foreground border-t border-border pt-3">
        <span>Intentos: {challenge.attempts_count}</span>
        <span>Mejor score: {challenge.best_score}%</span>
      </div>

      {/* Acciones */}
      <div className="space-y-2 pt-3 border-t border-border">
        {/* Botón principal Comenzar / Reanudar / Ver resultado */}
        <button
          onClick={() => router.push(`/custom-challenges/${challenge.id}`)}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition-all ${
            challenge.status === "completed"
              ? "bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30"
              : challenge.status === "in_progress"
                ? "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
          }`}
        >
          {challenge.status === "completed" ? (
            <>
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
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              Ver solución
            </>
          ) : challenge.status === "in_progress" ? (
            <>
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
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
              </svg>
              Reanudar
            </>
          ) : (
            <>
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
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
              Comenzar
            </>
          )}
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleToggleFavorite}
            disabled={isUpdating}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg font-medium text-sm transition-all disabled:opacity-50 ${
                "col-span-2"
              } ${
              challenge.is_favorite
                ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-400"
                : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
            }`}
          >
            <StarIcon className="w-4 h-4" filled={challenge.is_favorite} />
            {challenge.is_favorite ? "Favorito" : "Guardar"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
