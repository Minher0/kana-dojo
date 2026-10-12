"use client";

// ─── Bandeau LED de quai (afficheur défilant) ────────────────────────────────
// Le ruban ambré des gares japonaises : texte défilant en points lumineux,
// sur fond noir même en mode jour (un LED reste un LED). Le défilement
// repart de zéro à chaque changement de contenu (clé modifiée).

import { useReducedMotion } from "framer-motion";

interface LedTickerProps {
  /** Fragments séparés par des losanges dans le défilement. */
  items: string[];
  /** Durée d'un cycle complet (s) — dépend de la longueur du contenu. */
  duration?: number;
  className?: string;
  /** Texte du aria-label (le défilement n'est pas lisible par lecteur d'écran). */
  label?: string;
}

export function LedTicker({
  items,
  duration = 18,
  className = "",
  label,
}: LedTickerProps) {
  const reduce = useReducedMotion();
  const content = items.join("  ◆  ");
  const half = `${content}  ◆  `;

  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={[
        "led-ticker relative overflow-hidden rounded-md",
        className,
      ].join(" ")}
    >
      <div
        className="led-flow flex w-max items-center whitespace-nowrap py-1.5"
        style={{
          animationDuration: `${duration}s`,
          animationPlayState: reduce ? "paused" : "running",
        }}
      >
        {/* Deux copies : le défilement boucle sans couture */}
        <span className="led-text px-4">{half}</span>
        <span className="led-text px-4" aria-hidden>{half}</span>
      </div>
    </div>
  );
}
