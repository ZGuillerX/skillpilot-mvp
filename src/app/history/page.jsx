"use client";
import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProgress } from '@/lib/userProgress';
import { useRouter, useSearchParams } from 'next/navigation';

function HistoryContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan');
  
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState(null);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const data = await getUserProgress();
      setProgress(data);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Cargando historial...</p>
        </div>
      </div>
    );
  }

  const history = progress?.challenge_history || [];
  const plans = progress?.learning_plan?.plans || [];
  const currentPlan = planId 
    ? plans.find(p => p.id === planId) 
    : progress?.learning_plan?.currentPlan;

  // Filtrar retos por plan si se especifica
  const filteredHistory = planId
    ? history.filter(entry => {
        // Aquí podrías agregar lógica para asociar retos con planes
        // Por ahora mostramos todos
        return true;
      })
    : history;

  const completedChallenges = filteredHistory.filter(entry => entry.evaluation?.success);
  const attemptedChallenges = filteredHistory.filter(entry => entry.evaluation && !entry.evaluation.success);

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Historial de Retos
            </h1>
            {currentPlan && (
              <p className="text-muted-foreground">
                Plan: {currentPlan.goal}
              </p>
            )}
          </div>
          <button
            onClick={() => router.push('/profile')}
            className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-primary/10 transition-colors"
          >
            Volver al perfil
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{completedChallenges.length}</p>
                <p className="text-sm text-muted-foreground">Completados</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{attemptedChallenges.length}</p>
                <p className="text-sm text-muted-foreground">Intentados</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{filteredHistory.length}</p>
                <p className="text-sm text-muted-foreground">Total retos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-card border border-border rounded-xl p-2 flex gap-2">
          <button
            onClick={() => setSelectedChallenge(null)}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              !selectedChallenge
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-primary/10'
            }`}
          >
            Todos ({filteredHistory.length})
          </button>
          <button
            onClick={() => setSelectedChallenge('completed')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedChallenge === 'completed'
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-primary/10'
            }`}
          >
            Completados ({completedChallenges.length})
          </button>
          <button
            onClick={() => setSelectedChallenge('attempted')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedChallenge === 'attempted'
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-primary/10'
            }`}
          >
            Intentados ({attemptedChallenges.length})
          </button>
        </div>

        {/* Challenge List */}
        <div className="space-y-4">
          {filteredHistory.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <svg className="w-16 h-16 text-muted-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-muted-foreground mb-4">No hay retos en el historial</p>
              <button
                onClick={() => router.push('/challenges')}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Ir a Retos Infinitos
              </button>
            </div>
          ) : (
            (selectedChallenge === 'completed' ? completedChallenges :
             selectedChallenge === 'attempted' ? attemptedChallenges :
             filteredHistory)
              .reverse()
              .map((entry, index) => (
                <ChallengeHistoryCard key={index} entry={entry} />
              ))
          )}
        </div>
      </div>
    </div>
  );
}

function ChallengeHistoryCard({ entry }) {
  const [expanded, setExpanded] = useState(false);
  const isCompleted = entry.evaluation?.success;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div
        className="p-6 cursor-pointer hover:bg-primary/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-foreground">
                {entry.challenge.title}
              </h3>
              {isCompleted ? (
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs font-semibold rounded-full">
                  Completado
                </span>
              ) : (
                <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 text-xs font-semibold rounded-full">
                  Intentado
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {new Date(entry.savedAt).toLocaleDateString('es-ES', { 
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              {entry.evaluation?.score !== undefined && (
                <>
                  <span>•</span>
                  <span>Score: {entry.evaluation.score}%</span>
                </>
              )}
              <span>•</span>
              <span>{entry.attempts || 1} intento{entry.attempts !== 1 ? 's' : ''}</span>
            </div>
          </div>

          <svg
            className={`w-5 h-5 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border p-6 bg-primary/5 space-y-4">
          <div>
            <h4 className="font-semibold text-foreground mb-2">Descripción</h4>
            <p className="text-sm text-muted-foreground">{entry.challenge.description}</p>
          </div>

          {entry.code && (
            <div>
              <h4 className="font-semibold text-foreground mb-2">Código</h4>
              <pre className="bg-background border border-border rounded-lg p-4 text-sm overflow-x-auto">
                <code>{entry.code}</code>
              </pre>
            </div>
          )}

          {entry.evaluation && (
            <div>
              <h4 className="font-semibold text-foreground mb-2">Evaluación</h4>
              <div className={`p-4 rounded-lg ${
                isCompleted 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
              }`}>
                <p className={`text-sm ${
                  isCompleted 
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-yellow-800 dark:text-yellow-200'
                }`}>
                  {entry.evaluation.feedback}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <HistoryContent />
    </Suspense>
  );
}
