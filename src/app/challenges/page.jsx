"use client";

import InfiniteChallengeCard from "@/components/InfiniteChallengeCard";
import { useState } from "react";

export default function ChallengesPage() {
  const [learningMode, setLearningMode] = useState("tutor");

  return (
    <>
      <div className="fixed top-[72px] right-4 z-50 px-2 py-1.5 rounded-lg bg-background/95 border border-border backdrop-blur flex items-center gap-1.5">
        <span className="text-[11px] text-muted-foreground font-semibold">
          Modo:
        </span>
        <button
          onClick={() => setLearningMode("tutor")}
          className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
            learningMode === "tutor"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          }`}
        >
          Tutor
        </button>
        <button
          onClick={() => setLearningMode("arena")}
          className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
            learningMode === "arena"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          }`}
        >
          Arena
        </button>
      </div>

      <InfiniteChallengeCard learningMode={learningMode} />
    </>
  );
}
