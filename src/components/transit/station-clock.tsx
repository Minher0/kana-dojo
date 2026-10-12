"use client";

// ─── Horloge de quai ─────────────────────────────────────────────────────────
// L'horloge de la gare, chiffres tabulaires, deux-points qui clignotent
// comme un cœur de service. Store externe par seconde : un seul objet
// cache par seconde (contrat useSyncExternalStore), composant isolé.

import { useSyncExternalStore } from "react";
import { useReducedMotion } from "framer-motion";

interface ClockText {
  sec: number;
  h: string;
  m: string;
  s: string;
}

let cached: ClockText | null = null;

function snapshot(): ClockText {
  const d = new Date();
  const sec = Math.floor(d.getTime() / 1000);
  if (!cached || cached.sec !== sec) {
    cached = {
      sec,
      h: String(d.getHours()).padStart(2, "0"),
      m: String(d.getMinutes()).padStart(2, "0"),
      s: String(d.getSeconds()).padStart(2, "0"),
    };
  }
  return cached;
}

const EMPTY: ClockText = { sec: 0, h: "--", m: "--", s: "--" };

function subscribe(cb: () => void): () => void {
  const id = window.setInterval(cb, 1000);
  return () => window.clearInterval(id);
}

export function StationClock({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  const now = useSyncExternalStore(subscribe, snapshot, () => EMPTY);

  return (
    <span
      className={`tnum select-none text-sm font-bold tabular-nums text-muted-foreground ${className}`}
      role="timer"
      aria-label={`${now.h} heures ${now.m}`}
    >
      {now.h}
      <span
        className={reduce ? "" : "kd-blink mx-[1px]"}
        style={!reduce ? { animationDuration: "1s" } : undefined}
        aria-hidden
      >
        :
      </span>
      {now.m}
      <span className="sr-only">:{now.s}</span>
    </span>
  );
}
