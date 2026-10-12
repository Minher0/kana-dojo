"use client";

// ─── Chiffre de tableau de départ ────────────────────────────────────────────
// Afficheur de service : libellé compact + grande valeur tabulaire.
// Compteur en motion values (jamais de setState pour une valeur continue),
// animé une seule fois au chargement, désactivé si mouvement réduit.

import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { figureEnter } from "./motion";
import type { Icon } from "@phosphor-icons/react";

interface FigureProps {
  icon?: Icon;
  label: string;
  value: number | null;
  suffix?: string;
  /** Texte de repli quand la valeur est nulle. */
  fallback?: string;
  accent?: boolean;
}

export function Figure({
  icon: Icon,
  label,
  value,
  suffix = "",
  fallback = "n.d.",
  accent = false,
}: FigureProps) {
  const reduce = useReducedMotion();
  const target = value ?? 0;
  const mv = useMotionValue(reduce ? target : target);
  const rounded = useTransform(mv, (v) => `${Math.round(v)}${suffix}`);
  const doneRef = useRef(false);

  useEffect(() => {
    if (value === null || reduce || doneRef.current) return;
    doneRef.current = true;
    const controls = animate(0, value, {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => mv.set(v),
    });
    return () => controls.stop();
  }, [value, reduce, mv]);

  const shown = value === null ? fallback : null;

  return (
    <motion.div
      variants={figureEnter}
      className={[
        "flex flex-col gap-1 rounded-lg border bg-card px-4 py-3",
        accent
          ? "border-line-h/35 bg-line-h-soft"
          : "border-border",
      ].join(" ")}
    >
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {Icon && <Icon size={13} weight="bold" aria-hidden />}
        {label}
      </span>
      {shown !== null ? (
        <span className="tnum text-2xl font-bold leading-none tracking-tight">
          {shown}
        </span>
      ) : (
        <motion.span
          className="tnum text-2xl font-bold leading-none tracking-tight"
          aria-label={`${value}${suffix}`}
        >
          {rounded}
        </motion.span>
      )}
    </motion.div>
  );
}
