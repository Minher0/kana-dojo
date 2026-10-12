"use client";

// ─── Pastille de station ─────────────────────────────────────────────────────
// Le cercle de gare, décliné en 4 états réseau :
// vide (nouvelle) / incident (en apprentissage) / demi (familière) / pleine (maîtrisée)

import { motion, useReducedMotion } from "framer-motion";
import { stationStateOf } from "./tokens";
import type { MasteryLevel } from "@/lib/srs-engine";

const DOT_CLS: Record<string, string> = {
  empty: "bg-transparent border-muted-foreground/30",
  alert: "bg-transparent border-signal-stop border-2",
  half: "bg-warning/60 border-warning",
  full: "bg-line-h border-line-h",
};

/** Pastille de station active : couleur de la ligne roulante. */
const ACTIVE_CLS: Record<"hiragana" | "katakana", string> = {
  hiragana: "bg-line-h border-line-h",
  katakana: "bg-line-k border-line-k",
};

interface RoundelProps {
  level: MasteryLevel;
  size?: number;
  /** Station courante du quiz : remplie à la couleur de ligne. */
  active?: boolean;
  script?: "hiragana" | "katakana";
  className?: string;
  title?: string;
}

export function Roundel({
  level,
  size = 12,
  active = false,
  script = "hiragana",
  className = "",
  title,
}: RoundelProps) {
  const reduce = useReducedMotion();
  const state = stationStateOf(level);
  const cls = active
    ? ACTIVE_CLS[script]
    : DOT_CLS[state.dot];

  return (
    <motion.span
      title={title}
      aria-hidden={!title}
      aria-label={title}
      animate={active && !reduce ? { scale: 1.25 } : { scale: 1 }}
      transition={{ type: "spring", duration: 0.3, bounce: 0 }}
      style={{ width: size, height: size }}
      className={`inline-block shrink-0 rounded-full border transition-colors ${cls} ${className}`}
    />
  );
}
