"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { BrainIcon } from "./ui/Icons";
import Cookies from "js-cookie";

export default function CustomChallengeForm({ onChallengeCreated }) {
  const [idea, setIdea] = useState("");
  const [language, setLanguage] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [loading, setLoading] = useState(false);

  const languages = [
    "JavaScript",
    "Python",
    "Java",
    "C++",
    "TypeScript",
    "SQL",
    "HTML/CSS",
    "React",
    "Node.js",
  ];

  const difficulties = ["beginner", "intermediate", "advanced"];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!idea.trim() || !language) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    setLoading(true);

    try {
      const token = Cookies.get("token");
      const response = await fetch("/api/ai/custom-challenges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          idea,
          language,
          difficulty: difficulty || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al generar el reto");
      }

      const data = await response.json();

      toast.success("¡Reto generado exitosamente!");

      // Limpiar formulario
      setIdea("");
      setLanguage("");
      setDifficulty("");

      // Llamar callback si existe
      if (onChallengeCreated) {
        onChallengeCreated(data.challenge);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Error al generar el reto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-200/20 rounded-xl p-6 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-violet-500/20 rounded-lg">
          <BrainIcon className="w-6 h-6 text-violet-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">
            Crea tu Propio Reto
          </h3>
          <p className="text-sm text-muted-foreground">
            La IA generará un reto personalizado basado en tu idea
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Input de idea */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Tu Idea de Reto
          </label>
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Ej: Crear una función que valide si un email es válido usando expresiones regulares"
            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            rows="4"
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {idea.length} caracteres (mínimo 10)
          </p>
        </div>

        {/* Selecciona lenguaje */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Lenguaje de Programación *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {languages.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                disabled={loading}
                className={`py-2 px-3 rounded-lg font-medium transition-all ${
                  language === lang
                    ? "bg-violet-500 text-white border border-violet-500"
                    : "bg-background border border-border hover:border-violet-500"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Selecciona dificultad (opcional) */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Dificultad (Opcional)
          </label>
          <div className="flex gap-2">
            {difficulties.map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => setDifficulty(diff)}
                disabled={loading}
                className={`py-2 px-4 rounded-lg font-medium capitalize transition-all ${
                  difficulty === diff
                    ? "bg-purple-500 text-white border border-purple-500"
                    : "bg-background border border-border hover:border-purple-500"
                }`}
              >
                {diff === "beginner" && "Principiante"}
                {diff === "intermediate" && "Intermedio"}
                {diff === "advanced" && "Avanzado"}
              </button>
            ))}
          </div>
        </div>

        {/* Botón submit */}
        <button
          type="submit"
          disabled={loading || !idea.trim() || !language}
          className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Generando reto...
            </span>
          ) : (
            "Generar Reto con IA "
          )}
        </button>
      </form>
    </motion.div>
  );
}
