"use client";

// ─── Confettis de pastilles (pluie de célébration) ───────────────────────────
// Réservé au service parfait et à l'arrivée en terminus : une pluie de
// pastilles de station aux couleurs des lignes. Le seul moment où le
// réseau « jette des fleurs ». GPU uniquement, générée une seule fois.

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

const COLORS = ["#5c8a63", "#d1873a", "#c8b53c", "#4f7d5b", "#e0993f"];

interface Piece {
  x: number;        // % de la largeur
  delay: number;
  dur: number;
  drift: number;    // dérive horizontale (px)
  size: number;
  color: string;
  round: boolean;   // pastille pleine ou anneau
  rot: number;
}

export function RoundelConfetti({ count = 26 }: { count?: number }) {
  const reduce = useReducedMotion();

  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: 6 + Math.random() * 88,
        delay: 0.15 + Math.random() * 0.9 + (i / count) * 0.3,
        dur: 1.3 + Math.random() * 1.1,
        drift: (Math.random() - 0.5) * 140,
        size: 5 + Math.round(Math.random() * 5),
        color: COLORS[i % COLORS.length],
        round: Math.random() > 0.4,
        rot: (Math.random() - 0.5) * 720,
      })),
    [count]
  );

  if (reduce) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          initial={{ y: -30, opacity: 0, rotate: 0 }}
          animate={{
            y: ["-30px", "115%"],
            x: [`${p.x}%`, `calc(${p.x}% + ${p.drift}px)`],
            rotate: p.rot,
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: p.dur,
            delay: p.delay,
            ease: [0.3, 0.6, 0.6, 1],
            times: [0, 0.12, 0.7, 1],
          }}
          className="absolute top-0"
          style={{
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            backgroundColor: p.round ? p.color : "transparent",
            border: p.round ? undefined : `2px solid ${p.color}`,
          }}
        />
      ))}
    </div>
  );
}
