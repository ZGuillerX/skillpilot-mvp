"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

/**
 * Sistema de pistas progresivas
 * Revela una pista a la vez con penalización en el score
 */
export default function ProgressiveHints({ hints = [], onHintRevealed }) {
  const [revealedCount, setRevealedCount] = useState(0);
  const PENALTY_PER_HINT = 5; // 5 puntos por pista

  const handleRevealHint = () => {
    if (revealedCount < hints.length) {
      setRevealedCount(revealedCount + 1);
      toast.info(`Pista revelada. Penalización: -${PENALTY_PER_HINT} puntos`);
      if (onHintRevealed) {
        onHintRevealed(PENALTY_PER_HINT);
      }
    }
  };

  const totalPenalty = revealedCount * PENALTY_PER_HINT;
  const canRevealMore = revealedCount < hints.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-yellow-500"
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
          <h3 className="text-sm font-semibold text-foreground">
            Pistas Progresivas
          </h3>
        </div>

        {totalPenalty > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs font-medium text-yellow-600"
          >
            -{totalPenalty} pts
          </motion.div>
        )}
      </div>

      {/* Indicadores de pistas */}
      <div className="flex gap-2">
        {hints.map((_, index) => (
          <div
            key={index}
            className={`flex-1 h-1 rounded-full transition-colors ${
              index < revealedCount ? "bg-yellow-500" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Lista de pistas reveladas */}
      <div className="space-y-3">
        <AnimatePresence>
          {hints.slice(0, revealedCount).map((hint, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: "auto" }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ duration: 0.3 }}
              className="flex gap-3 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg"
            >
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500 text-white flex items-center justify-center text-xs font-bold">
                {index + 1}
              </div>
              <p className="text-sm text-foreground flex-1">{hint}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Botón para revelar siguiente pista */}
      {canRevealMore && (
        <motion.button
          onClick={handleRevealHint}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full px-4 py-3 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-lg text-yellow-600 font-medium transition-colors flex items-center justify-center gap-2"
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
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          Revelar siguiente pista (-{PENALTY_PER_HINT} pts)
        </motion.button>
      )}

      {revealedCount === hints.length && hints.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-muted-foreground"
        >
          Has revelado todas las pistas disponibles
        </motion.div>
      )}

      {hints.length === 0 && (
        <div className="text-center text-sm text-muted-foreground py-4">
          No hay pistas disponibles para este reto
        </div>
      )}
    </div>
  );
}

/**
 * Componente simple para mostrar un tip o consejo
 */
export function Tip({ children, type = "info" }) {
  const colors = {
    info: "bg-blue-500/10 border-blue-500/20 text-blue-600",
    warning: "bg-yellow-500/10 border-yellow-500/20 text-yellow-600",
    success: "bg-green-500/10 border-green-500/20 text-green-600",
    error: "bg-red-500/10 border-red-500/20 text-red-600",
  };

  const icons = {
    info: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
    warning: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    ),
    success: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
    error: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 p-3 border rounded-lg ${colors[type]}`}
    >
      <svg
        className="w-5 h-5 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {icons[type]}
      </svg>
      <div className="text-sm">{children}</div>
    </motion.div>
  );
}
