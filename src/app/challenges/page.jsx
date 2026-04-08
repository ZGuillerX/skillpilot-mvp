"use client";

import InfiniteChallengeCard from "@/components/InfiniteChallengeCard";
import { useState } from "react";

export default function ChallengesPage() {
  const [learningMode, setLearningMode] = useState("tutor");

  return (
    <>
      {/* Mode Selector - Premium Floating Card */}
      <div className="fixed top-[80px] right-6 z-50 glass rounded-2xl border border-primary/20 shadow-xl animate-fade-in-up">
        <div className="px-4 py-3 flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-semibold">
            Modo de Aprendizaje
          </span>
          <div className="flex bg-muted/50 rounded-xl p-1">
            <button
              onClick={() => setLearningMode("tutor")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-2 ${
                learningMode === "tutor"
                  ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              Tutor
            </button>
            <button
              onClick={() => setLearningMode("arena")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-2 ${
                learningMode === "arena"
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Arena
            </button>
          </div>
        </div>
      </div>

      <InfiniteChallengeCard learningMode={learningMode} />
    </>
  );
}
