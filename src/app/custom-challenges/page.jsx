"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import CustomChallengeForm from "@/components/CustomChallengeForm";
import CustomChallengeCard from "@/components/CustomChallengeCard";
import { StarIcon, BrainIcon, TargetIcon } from "@/components/ui/Icons";
import { toast } from "sonner";
import Cookies from "js-cookie";

function CustomChallengesContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (authLoading) return; // Esperar a que se cargue la autenticación

    if (!user) {
      router.push("/login");
      return;
    }
    loadChallenges();
  }, [user, activeTab, authLoading]);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      const token = Cookies.get("token");
      const response = await fetch(
        `/api/user/custom-challenges?type=${activeTab}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!response.ok) throw new Error("Error al cargar retos");

      const data = await response.json();
      setChallenges(data.challenges || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar los retos");
    } finally {
      setLoading(false);
    }
  };

  const handleChallengeCreated = async (newChallenge) => {
    setRefreshing(true);
    await loadChallenges();
    setRefreshing(false);
    setActiveTab("all");
  };

  const handleStatusChange = (challengeId, newStatus) => {
    setChallenges((prev) =>
      prev.map((c) => (c.id === challengeId ? { ...c, status: newStatus } : c)),
    );
  };

  const handleFavoriteChange = (challengeId, isFavorite) => {
    setChallenges((prev) =>
      prev.map((c) =>
        c.id === challengeId ? { ...c, is_favorite: isFavorite } : c,
      ),
    );
  };

  const tabs = [
    {
      id: "all",
      label: "Todos los Retos",
      icon: <TargetIcon className="w-4 h-4" />,
    },
    {
      id: "favorites",
      label: "Favoritos",
      icon: <StarIcon className="w-4 h-4" />,
    },
    {
      id: "history",
      label: "Historial",
      icon: <BrainIcon className="w-4 h-4" />,
    },
  ];

  const tabDescription = {
    all: "Todos los retos personalizados que creaste con IA",
    favorites: "Retos guardados para retomarlos rapido",
    history: "Retos completados o abandonados",
  };

  return (
    <>
      {authLoading && (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Cargando...</p>
          </div>
        </div>
      )}

      {!authLoading && !user && null}

      {!authLoading && user && (
        <div className="min-h-screen bg-background">
          {/* Header */}
          <div className="bg-gradient-to-b from-violet-500/10 to-purple-500/5 border-b border-border">
            <div className="max-w-6xl mx-auto px-4 py-8">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-violet-500/20 rounded-lg">
                    <BrainIcon className="w-8 h-8 text-violet-400" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">
                      Retos Personalizados
                    </h1>
                    <p className="text-muted-foreground mt-1">
                      Crea retos únicos con la ayuda de IA basados en tus ideas
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
            {/* Formulario para crear retos */}
            <CustomChallengeForm onChallengeCreated={handleChallengeCreated} />

            {/* Tabs */}
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Apartados
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {tabs.map((tab) => (
                    <button
                      key={`card-${tab.id}`}
                      onClick={() => setActiveTab(tab.id)}
                      className={`text-left rounded-xl border p-4 transition-all ${
                        activeTab === tab.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={
                            activeTab === tab.id
                              ? "text-primary"
                              : "text-muted-foreground"
                          }
                        >
                          {tab.icon}
                        </span>
                        <span className="font-semibold text-foreground">
                          {tab.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {tabDescription[tab.id]}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 border-b border-border overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 font-medium whitespace-nowrap flex items-center gap-2 border-b-2 transition-all ${
                      activeTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Loading state */}
              {(loading || refreshing) && (
                <div className="flex justify-center items-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-4">
                      Cargando retos...
                    </p>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!loading && !refreshing && challenges.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 space-y-4"
                >
                  <div className="text-5xl"></div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {activeTab === "all" && "No hay retos aún"}
                    {activeTab === "favorites" && "No hay favoritos"}
                    {activeTab === "history" && "No hay historial"}
                  </h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    {activeTab === "all" &&
                      "Comienza creando tu primer reto personalizado. ¡La IA lo generará para ti!"}
                    {activeTab === "favorites" &&
                      "Agrega retos a favoritos para acceder a ellos rápidamente."}
                    {activeTab === "history" &&
                      "Aquí aparecerán los retos que hayas completado o abandonado."}
                  </p>
                </motion.div>
              )}

              {/* Grid de retos */}
              {!loading && !refreshing && challenges.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {challenges.map((challenge, idx) => (
                    <motion.div
                      key={challenge.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <CustomChallengeCard
                        challenge={challenge}
                        onStatusChange={(status) =>
                          handleStatusChange(challenge.id, status)
                        }
                        onFavoriteChange={(isFavorite) =>
                          handleFavoriteChange(challenge.id, isFavorite)
                        }
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function CustomChallengesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Cargando...</p>
          </div>
        </div>
      }
    >
      <CustomChallengesContent />
    </Suspense>
  );
}
