"use client";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Indicador de progreso visual mejorado con animaciones
 */
export default function ProgressIndicator({
  current,
  total,
  label = "Progreso",
}) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">
          {current} / {total}
        </span>
      </div>

      {/* Barra de progreso */}
      <div className="relative w-full bg-muted rounded-full h-3 overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />

        {/* Efecto de brillo animado */}
        <motion.div
          className="absolute top-0 left-0 h-full w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{
            x: ["-100%", "400%"],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
            delay: 0.5,
          }}
        />
      </div>

      {/* Porcentaje */}
      <motion.div
        className="text-right"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <span className="text-2xl font-bold text-primary">{percentage}%</span>
      </motion.div>

      {/* Hitos con checkmarks animados */}
      <div className="flex gap-1 pt-2">
        <AnimatePresence>
          {Array.from({ length: total }).map((_, index) => (
            <motion.div
              key={index}
              className={`flex-1 h-1 rounded-full ${
                index < current ? "bg-primary" : "bg-muted"
              }`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * Indicador circular de progreso
 */
export function CircularProgress({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = (value / max) * 100;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Círculo de fondo */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted"
        />

        {/* Círculo de progreso */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className="text-primary"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>

      {/* Texto central */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-3xl font-bold text-foreground"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          {Math.round(percentage)}%
        </motion.span>
        <span className="text-xs text-muted-foreground">completado</span>
      </div>
    </div>
  );
}

/**
 * Barra de racha (streak) con fuego animado
 */
export function StreakIndicator({ days = 0 }) {
  return (
    <motion.div
      className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg
          className="w-6 h-6 text-orange-500"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2c1.1 0 2 .9 2 2 0 .74-.4 1.38-1 1.73v14.54c.6.35 1 .99 1 1.73 0 1.1-.9 2-2 2s-2-.9-2-2c0-.74.4-1.38 1-1.73V5.73c-.6-.35-1-.99-1-1.73 0-1.1.9-2 2-2m0 2c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z" />
        </svg>
      </motion.div>

      <div className="text-left">
        <div className="text-2xl font-bold text-orange-500">{days}</div>
        <div className="text-xs text-orange-600/80">días seguidos</div>
      </div>
    </motion.div>
  );
}
