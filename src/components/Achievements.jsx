"use client";
import { motion } from "framer-motion";
import { AnimatedBadge } from "./ui/Animations";
import {
  TargetIcon,
  FireIcon,
  MuscleIcon,
  StarIcon,
  AcademicCapIcon,
  TrophyIcon,
  CrownIcon,
  BrainIcon,
  LightningIcon,
  GlobeIcon,
} from "./ui/Icons";

/**
 * Sistema de logros y badges
 */

const ACHIEVEMENTS = {
  firstChallenge: {
    id: "first_challenge",
    title: "Primer Paso",
    description: "Completa tu primer reto",
    icon: <TargetIcon className="w-12 h-12" />,
    color: "from-blue-500 to-blue-600",
  },
  streak3: {
    id: "streak_3",
    title: "Constante",
    description: "3 días seguidos practicando",
    icon: <FireIcon className="w-12 h-12" />,
    color: "from-orange-500 to-red-500",
  },
  streak7: {
    id: "streak_7",
    title: "Dedicado",
    description: "7 días seguidos practicando",
    icon: <MuscleIcon className="w-12 h-12" />,
    color: "from-purple-500 to-pink-500",
  },
  perfectScore: {
    id: "perfect_score",
    title: "Perfección",
    description: "Obtén un score de 100%",
    icon: <StarIcon className="w-12 h-12" filled />,
    color: "from-yellow-500 to-amber-500",
  },
  challenges10: {
    id: "challenges_10",
    title: "Principiante",
    description: "Completa 10 retos",
    icon: <AcademicCapIcon className="w-12 h-12" />,
    color: "from-green-500 to-emerald-500",
  },
  challenges50: {
    id: "challenges_50",
    title: "Intermedio",
    description: "Completa 50 retos",
    icon: <TrophyIcon className="w-12 h-12" />,
    color: "from-indigo-500 to-purple-500",
  },
  challenges100: {
    id: "challenges_100",
    title: "Experto",
    description: "Completa 100 retos",
    icon: <CrownIcon className="w-12 h-12" />,
    color: "from-pink-500 to-rose-500",
  },
  noHints: {
    id: "no_hints",
    title: "Autodidacta",
    description: "Completa un reto sin usar pistas",
    icon: <BrainIcon className="w-12 h-12" />,
    color: "from-cyan-500 to-blue-500",
  },
  fastSolver: {
    id: "fast_solver",
    title: "Rápido",
    description: "Completa un reto en menos de 5 minutos",
    icon: <LightningIcon className="w-12 h-12" />,
    color: "from-yellow-400 to-orange-500",
  },
  multiLanguage: {
    id: "multi_language",
    title: "Políglota",
    description: "Completa retos en 3 lenguajes diferentes",
    icon: <GlobeIcon className="w-12 h-12" />,
    color: "from-teal-500 to-green-500",
  },
};

/**
 * Verifica qué logros ha desbloqueado el usuario
 */
export function checkAchievements(stats, history) {
  const unlocked = [];

  // Primer reto
  if (stats.completed >= 1) {
    unlocked.push(ACHIEVEMENTS.firstChallenge);
  }

  // Cantidad de retos
  if (stats.completed >= 10) unlocked.push(ACHIEVEMENTS.challenges10);
  if (stats.completed >= 50) unlocked.push(ACHIEVEMENTS.challenges50);
  if (stats.completed >= 100) unlocked.push(ACHIEVEMENTS.challenges100);

  // Score perfecto
  const hasPerfectScore = history.some(
    (entry) => entry.evaluation?.score === 100
  );
  if (hasPerfectScore) {
    unlocked.push(ACHIEVEMENTS.perfectScore);
  }

  // Sin pistas (implementar tracking de pistas usado)
  const hasNoHintsChallenge = history.some(
    (entry) => entry.evaluation?.success && entry.hintsUsed === 0
  );
  if (hasNoHintsChallenge) {
    unlocked.push(ACHIEVEMENTS.noHints);
  }

  // Múltiples lenguajes
  const languages = new Set(
    history.map((entry) => entry.challenge?.language).filter(Boolean)
  );
  if (languages.size >= 3) {
    unlocked.push(ACHIEVEMENTS.multiLanguage);
  }

  return unlocked;
}

/**
 * Componente de badge individual
 */
export function Badge({ achievement, unlocked = false, delay = 0 }) {
  return (
    <AnimatedBadge delay={delay}>
      <motion.div
        className={`relative p-4 rounded-xl border-2 transition-all ${
          unlocked
            ? "bg-gradient-to-br " +
              achievement.color +
              " border-white/20 shadow-lg"
            : "bg-muted border-border grayscale opacity-50"
        }`}
        whileHover={unlocked ? { scale: 1.05, rotate: 5 } : {}}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {/* Icono */}
        <div className="text-center mb-2 text-white flex items-center justify-center">
          {achievement.icon}
        </div>

        {/* Título */}
        <h4
          className={`text-sm font-bold text-center mb-1 ${
            unlocked ? "text-white" : "text-muted-foreground"
          }`}
        >
          {achievement.title}
        </h4>

        {/* Descripción */}
        <p
          className={`text-xs text-center ${
            unlocked ? "text-white/80" : "text-muted-foreground"
          }`}
        >
          {achievement.description}
        </p>

        {/* Badge de bloqueado */}
        {!unlocked && (
          <div className="absolute top-2 right-2">
            <svg
              className="w-4 h-4 text-muted-foreground"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C9.243 2 7 4.243 7 7v3H6c-1.103 0-2 .897-2 2v8c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-8c0-1.103-.897-2-2-2h-1V7c0-2.757-2.243-5-5-5zM9 7c0-1.654 1.346-3 3-3s3 1.346 3 3v3H9V7z" />
            </svg>
          </div>
        )}
      </motion.div>
    </AnimatedBadge>
  );
}

/**
 * Grid de logros
 */
export default function AchievementsGrid({ stats = {}, history = [] }) {
  const unlockedAchievements = checkAchievements(stats, history);
  const unlockedIds = new Set(unlockedAchievements.map((a) => a.id));

  const allAchievements = Object.values(ACHIEVEMENTS);
  const unlockedCount = unlockedAchievements.length;
  const totalCount = allAchievements.length;
  const progress = Math.round((unlockedCount / totalCount) * 100);

  return (
    <div className="space-y-6">
      {/* Header con progreso */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrophyIcon className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Logros</h2>
          </div>
          <div className="text-sm text-muted-foreground">
            {unlockedCount} / {totalCount}
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="relative w-full bg-muted rounded-full h-2 overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Grid de badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {allAchievements.map((achievement, index) => (
          <Badge
            key={achievement.id}
            achievement={achievement}
            unlocked={unlockedIds.has(achievement.id)}
            delay={index * 0.05}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Notificación de logro desbloqueado
 */
export function AchievementUnlocked({ achievement, onClose }) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      exit={{ scale: 0, rotate: 180 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="fixed top-20 right-4 z-50 max-w-sm"
    >
      <div
        className={`bg-gradient-to-br ${achievement.color} p-6 rounded-xl shadow-2xl border-2 border-white/20`}
      >
        {/* Confeti animado */}
        <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/50 rounded-full"
              initial={{
                x: "50%",
                y: "50%",
                scale: 0,
              }}
              animate={{
                x: `${Math.random() * 100}%`,
                y: `${Math.random() * 100}%`,
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 1,
                delay: i * 0.05,
                ease: "easeOut",
              }}
            />
          ))}
        </div>

        <div className="relative text-center text-white">
          <div className="text-6xl mb-3">{achievement.icon}</div>
          <h3 className="text-xl font-bold mb-1">¡Logro Desbloqueado!</h3>
          <h4 className="text-lg font-semibold mb-2">{achievement.title}</h4>
          <p className="text-sm text-white/90">{achievement.description}</p>

          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
          >
            Continuar
          </button>
        </div>
      </div>
    </motion.div>
  );
}
