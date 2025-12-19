"use client";

import InfiniteChallengeCard from "@/components/InfiniteChallengeCard";
import Editor from "@/components/Editor";
import { useState } from "react";

const DEFAULT_LANGUAGE = "javascript"; // Puede ser modificado por IA

export default function ChallengesPage() {
  // En el futuro, language puede venir de IA o props
  const [language] = useState(DEFAULT_LANGUAGE);
  const [code, setCode] = useState("");

  return <InfiniteChallengeCard />;
}
