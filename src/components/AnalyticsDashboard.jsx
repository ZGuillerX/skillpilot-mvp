"use client";
import { useState, useEffect } from "react";
import analytics from "@/lib/analytics";
import { FadeIn, StaggerContainer, StaggerItem } from "./ui/Animations";
import { CircularProgress } from "./ui/ProgressIndicator";
import {
  ChartIcon,
  CheckCircleIcon,
  StarIcon,
  TargetIcon,
  TrendingUpIcon,
  FilmIcon,
  RocketIcon,
  LightBulbIcon,
} from "./ui/Icons";

/**
 * Dashboard de analíticas del usuario
 */
export default function AnalyticsDashboard({ stats, history }) {
  const [sessionStats, setSessionStats] = useState(null);
  const [challengeMetrics, setChallengeMetrics] = useState(null);

  useEffect(() => {
    // Actualizar stats cada 10 segundos
    const updateStats = () => {
      setSessionStats(analytics.getSessionStats());
      setChallengeMetrics(analytics.getChallengeMetrics());
    };

    updateStats();
    const interval = setInterval(updateStats, 10000);

    return () => clearInterval(interval);
  }, []);

  // Calcular métricas adicionales
  const successRate =
    stats.totalAttempts > 0
      ? Math.round((stats.completed / stats.totalAttempts) * 100)
      : 0;

  const recentChallenges = history.slice(-10).reverse();

  return (
    <div className="space-y-8">
      {/* Título */}
      <FadeIn>
        <div className="flex items-center gap-2">
          <ChartIcon className="w-8 h-8 text-primary" />
          <h2 className="text-3xl font-bold text-foreground">Analíticas</h2>
        </div>
      </FadeIn>

      {/* Métricas principales en cards */}
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StaggerItem>
          <MetricCard
            title="Retos Completados"
            value={stats.completed}
            IconComponent={CheckCircleIcon}
            color="from-green-500 to-emerald-500"
          />
        </StaggerItem>

        <StaggerItem>
          <MetricCard
            title="Promedio de Score"
            value={`${stats.averageScore}%`}
            IconComponent={StarIcon}
            color="from-yellow-500 to-amber-500"
          />
        </StaggerItem>

        <StaggerItem>
          <MetricCard
            title="Total Intentos"
            value={stats.totalAttempts}
            IconComponent={TargetIcon}
            color="from-blue-500 to-cyan-500"
          />
        </StaggerItem>

        <StaggerItem>
          <MetricCard
            title="Tasa de Éxito"
            value={`${successRate}%`}
            IconComponent={TrendingUpIcon}
            color="from-purple-500 to-pink-500"
          />
        </StaggerItem>
      </StaggerContainer>

      {/* Gráficos circulares */}
      <FadeIn delay={0.3}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Progreso General
            </h3>
            <div className="flex justify-center">
              <CircularProgress value={stats.completed} max={100} />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Score Promedio
            </h3>
            <div className="flex justify-center">
              <CircularProgress value={stats.averageScore} max={100} />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Tasa de Éxito
            </h3>
            <div className="flex justify-center">
              <CircularProgress value={successRate} max={100} />
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Métricas de sesión */}
      {sessionStats && challengeMetrics && (
        <FadeIn delay={0.4}>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <FilmIcon className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-bold text-foreground">
                Sesión Actual
              </h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatItem
                label="Eventos"
                value={sessionStats.totalEvents}
                IconComponent={FilmIcon}
              />
              <StatItem
                label="Retos Iniciados"
                value={challengeMetrics.started}
                IconComponent={RocketIcon}
              />
              <StatItem
                label="Retos Completados"
                value={challengeMetrics.completed}
                IconComponent={CheckCircleIcon}
              />
              <StatItem
                label="Pistas Usadas"
                value={challengeMetrics.hintsUsed}
                IconComponent={LightBulbIcon}
              />
            </div>

            {challengeMetrics.languagesUsed.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Lenguajes practicados:
                </p>
                <div className="flex gap-2 flex-wrap">
                  {challengeMetrics.languagesUsed.map((lang) => (
                    <span
                      key={lang}
                      className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </FadeIn>
      )}

      {/* Historial reciente */}
      <FadeIn delay={0.5}>
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-xl font-bold text-foreground mb-4">
            📜 Historial Reciente
          </h3>

          <div className="space-y-3">
            {recentChallenges.length > 0 ? (
              recentChallenges.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      entry.evaluation?.success
                        ? "bg-green-500/20 text-green-600"
                        : "bg-red-500/20 text-red-600"
                    }`}
                  >
                    {entry.evaluation?.success ? "✓" : "✗"}
                  </div>

                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground text-sm">
                      {entry.challenge?.title || "Reto"}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {entry.challenge?.language} •{" "}
                      {entry.challenge?.difficulty}
                    </p>
                  </div>

                  {entry.evaluation?.score !== undefined && (
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">
                        {entry.evaluation.score}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {entry.attempts || 1} intento(s)
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No hay retos completados aún
              </p>
            )}
          </div>
        </div>
      </FadeIn>
    </div>
  );
}

/**
 * Card de métrica individual
 */
function MetricCard({ title, value, IconComponent, color }) {
  return (
    <div
      className={`bg-gradient-to-br ${color} p-6 rounded-xl shadow-lg text-white`}
    >
      <div className="flex items-center justify-between mb-2">
        {IconComponent && <IconComponent className="w-8 h-8" />}
      </div>
      <div className="text-4xl font-bold mb-1">{value}</div>
      <div className="text-sm text-white/80">{title}</div>
    </div>
  );
}

/**
 * Item de estadística simple
 */
function StatItem({ label, value, IconComponent }) {
  return (
    <div className="text-center p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center justify-center mb-1">
        {IconComponent && <IconComponent className="w-6 h-6" />}
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
