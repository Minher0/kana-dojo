"use client";

// ─── Chiffre de tableau de départ (afficheur à palettes) ─────────────────────
// Compteur Solari : la valeur roule palette par palette depuis zéro.
// Le clac de palette est throttlé (max ~8/s) pour rester une texture,
// jamais un vacarme. Mouvement réduit : valeur directe, sans son.

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { figureEnter } from "./motion";
import { FlapDisplay } from "./flap-display";
import { sfx } from "@/lib/sfx";
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
  const [shown, setShown] = useState(reduce ? target : 0);
  const [prevTarget, setPrevTarget] = useState(target);
  const [animEpoch, setAnimEpoch] = useState(0);

  // Ajustement pendant le rendu quand la valeur change (pattern React :
  // pas d'effet de synchronisation), puis l'animation repart de zéro.
  if (prevTarget !== target) {
    setPrevTarget(target);
    setShown(reduce ? target : 0);
    setAnimEpoch((e) => e + 1);
  }

  // Clac de palette, throttlé : la texture sans le vacarme
  const lastTickRef = useRef(0);
  const flapTick = useCallback(() => {
    const now = performance.now();
    if (now - lastTickRef.current > 130) {
      lastTickRef.current = now;
      sfx.flap();
    }
  }, []);

  useEffect(() => {
    if (reduce || target === 0) return;

    let raf = 0;
    const started = performance.now();
    const dur = 620;
    const step = () => {
      const t = Math.min(1, (performance.now() - started) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(target * eased);
      setShown((prev) => (prev === next ? prev : next));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [animEpoch, target, reduce]);

  const empty = value === null;

  return (
    <motion.div
      variants={figureEnter}
      className={[
        "flex flex-col gap-1.5 rounded-lg border bg-card px-4 py-3",
        accent
          ? "border-line-h/35 bg-line-h-soft"
          : "border-border",
      ].join(" ")}
    >
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {Icon && <Icon size={13} weight="bold" aria-hidden />}
        {label}
      </span>
      {empty ? (
        <span className="tnum text-2xl font-bold leading-none tracking-tight">
          {fallback}
        </span>
      ) : (
        <FlapDisplay
          value={shown}
          suffix={suffix}
          onTick={flapTick}
          ariaValue={`${target}${suffix}`}
        />
      )}
    </motion.div>
  );
}
