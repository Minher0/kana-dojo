"use client";

// ─── Traînées de vitesse (la rame en mouvement) ──────────────────────────────
// Bribes de quai filant derrière la vitre : traits horizontaux balayés
// au changement de question. Montées une fois par question (clé = étape),
// jamais répétées. Pur GPU, invisibles si mouvement réduit.

import { motion, useReducedMotion } from "framer-motion";

const STREAKS = [
  { top: "12%", w: "34%", dur: 0.38, delay: 0 },
  { top: "38%", w: "55%", dur: 0.34, delay: 0.03 },
  { top: "63%", w: "40%", dur: 0.42, delay: 0.02 },
  { top: "84%", w: "26%", dur: 0.36, delay: 0.05 },
];

/** Superposée au panneau de station : les objets filent vers l'arrière. */
export function PassStreaks({ color }: { color: string }) {
  const reduce = useReducedMotion();
  if (reduce) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {STREAKS.map((s, i) => (
        <motion.span
          key={i}
          initial={{ x: "-140%", opacity: 0 }}
          animate={{ x: "240%", opacity: [0, 0.6, 0] }}
          transition={{
            duration: s.dur,
            delay: s.delay,
            ease: [0.3, 0.1, 0.4, 1],
            times: [0, 0.25, 1],
          }}
          className="absolute h-[3px] rounded-full"
          style={{
            top: s.top,
            width: s.w,
            background: `linear-gradient(90deg, transparent, ${color}66, transparent)`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Ambiance de bord (rails qui défilent) ───────────────────────────────────
// Le plancher du monde pendant une session : traverses de rail qui glissent
// au bas de l'écran, très sombres, très lentes. La sensation d'être assis
// dans la rame sans jamais gêner la lecture.

export function RailAmbience({ script }: { script: "hiragana" | "katakana" }) {
  const reduce = useReducedMotion();
  const tint = script === "katakana" ? "#d1873a" : "#5c8a63";

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 bottom-0 z-0 h-16 overflow-hidden opacity-60 dark:opacity-40"
    >
      {/* Deux voies, vitesses différentes : la parallaxe du voyage */}
      {[0, 1].map((track) => (
        <div
          key={track}
          className="kd-railway absolute inset-x-0"
          style={{
            bottom: `${track * 22}px`,
            height: 3,
            // Rail continu + joints réguliers : c'est le passage des joints qui bouge
            background: `repeating-linear-gradient(90deg, var(--border) 0 46px, transparent 46px 64px)`,
            animationDuration: `${7 + track * 4}s`,
            animationPlayState: reduce ? "paused" : "running",
          }}
        />
      ))}
      {/* Traverses : le pas régulier de la voie */}
      <div
        className="kd-sleepers absolute inset-x-0 bottom-0 h-12"
        style={{
          background: `repeating-linear-gradient(90deg, transparent 0 30px, color-mix(in oklab, ${tint} 18%, transparent) 30px 33px)`,
          animationDuration: "5.5s",
          animationPlayState: reduce ? "paused" : "running",
        }}
      />
    </div>
  );
}
