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
  const [searchQuery, setSearchQuery] = useState("");
  const [maxResults, setMaxResults] = useState(5);
  const [searchHistory, setSearchHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const searchStorageKey = user
    ? `custom_challenges_search_history_${user.id}`
    : null;

  useEffect(() => {
    if (authLoading) return; // Esperar a que se cargue la autenticación

    if (!user) {
      router.push("/login");
      return;
    }
    loadChallenges();
  }, [user, activeTab, authLoading]);

  useEffect(() => {
    if (!searchStorageKey) return;
    try {
      const saved = localStorage.getItem(searchStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSearchHistory(parsed.slice(0, 10));
        }
      }
    } catch (error) {
      console.error("No se pudo cargar historial de búsqueda:", error);
    }
  }, [searchStorageKey]);

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

  const saveSearchHistory = (query) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const updated = [
      trimmed,
      ...searchHistory.filter(
        (item) => item.toLowerCase() !== trimmed.toLowerCase(),
      ),
    ].slice(0, 10);

    setSearchHistory(updated);

    if (searchStorageKey) {
      localStorage.setItem(searchStorageKey, JSON.stringify(updated));
    }
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    if (searchStorageKey) {
      localStorage.removeItem(searchStorageKey);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    saveSearchHistory(searchQuery);
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

  const isHistoryTab = activeTab === "history";

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredChallenges = challenges.filter((challenge) => {
    if (!normalizedSearch) return true;

    const data = challenge.challenge_data || challenge;
    const haystack = [
      data.title,
      data.description,
      data.language,
      ...(data.concepts || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedSearch);
  });

  const displayedChallenges = isHistoryTab
    ? filteredChallenges.slice(0, maxResults)
    : challenges;

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

              {/* Busqueda solo en historial */}
              {isHistoryTab && (
                <div className="bg-card border border-border rounded-xl p-4 space-y-4">
                  <div className="flex flex-col lg:flex-row gap-3">
                    <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por titulo, descripcion, lenguaje o concepto"
                        className="flex-1 px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition"
                      >
                        Buscar
                      </button>
                    </form>

                    <div className="flex items-center gap-2">
                      <label className="text-sm text-muted-foreground whitespace-nowrap">
                        Max retos
                      </label>
                      <select
                        value={maxResults}
                        onChange={(e) => setMaxResults(Number(e.target.value))}
                        className="px-3 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">
                        Historial de busqueda
                      </h3>
                      {searchHistory.length > 0 && (
                        <button
                          onClick={clearSearchHistory}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Limpiar
                        </button>
                      )}
                    </div>
                    {searchHistory.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Aun no hay busquedas guardadas.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {searchHistory.map((item) => (
                          <button
                            key={item}
                            onClick={() => setSearchQuery(item)}
                            className="px-2.5 py-1 text-xs rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

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
              {!loading && !refreshing && displayedChallenges.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 space-y-4"
                >
                  <div className="text-5xl"></div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {isHistoryTab && normalizedSearch && "No se encontraron resultados"}
                    {activeTab === "all" && "No hay retos aún"}
                    {activeTab === "favorites" && "No hay favoritos"}
                    {activeTab === "history" && "No hay historial"}
                  </h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    {isHistoryTab && normalizedSearch &&
                      "Prueba con otra palabra o revisa tu historial de busqueda."}
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
              {!loading && !refreshing && displayedChallenges.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {displayedChallenges.map((challenge, idx) => (
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
