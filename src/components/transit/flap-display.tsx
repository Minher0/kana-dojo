"use client";

// ─── Afficheur à palettes (split-flap) ───────────────────────────────────────
// Les tableaux Solari des grandes gares : chaque chiffre est une palette qui
// roule vers sa valeur. Odomètre à ressort + couture centrale (la ligne
// d'ombre du pivot). Le clac sonore est joué par le parent, throttlé.

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

interface FlapDigitProps {
  digit: number;
  /** Hauteur d'une palette en px (largeur ≈ 0.62 × hauteur). */
  size?: number;
}

function FlapDigit({ digit, size = 30 }: FlapDigitProps) {
  return (
    <span
      className="flap-cell relative inline-flex items-center justify-center overflow-hidden"
      style={{ width: size * 0.62, height: size }}
      aria-hidden
    >
      <motion.span
        className="flap-column absolute inset-x-0 top-0 flex flex-col"
        initial={false}
        animate={{ y: -digit * size }}
        transition={{
          type: "spring",
          stiffness: 320,
          damping: 32,
        }}
      >
        {DIGITS.map((d) => (
          <span
            key={d}
            className="flex shrink-0 items-center justify-center tabular-nums"
            style={{ height: size, fontSize: size * 0.62 }}
          >
            {d}
          </span>
        ))}
      </motion.span>
      {/* Couture de pivot : le relief de la palette */}
      <span className="flap-seam pointer-events-none absolute inset-x-0 top-1/2" />
    </span>
  );
}

interface FlapDisplayProps {
  /** Valeur affichée (décompte animé géré par le parent). */
  value: number;
  suffix?: string;
  size?: number;
  onTick?: () => void;
  ariaValue?: string;
}

/** Afficheur complet : palettes numériques + suffixe fixe (%, j, s…). */
export function FlapDisplay({
  value,
  suffix = "",
  size = 30,
  onTick,
  ariaValue,
}: FlapDisplayProps) {
  const reduce = useReducedMotion();
  const text = String(Math.max(0, Math.round(value)));
  const chars = text.split("");

  return (
    <span
      className="inline-flex items-center gap-1"
      role="img"
      aria-label={ariaValue ?? `${text}${suffix}`}
    >
      <span className="flap-board inline-flex gap-[3px] rounded-md px-1.5 py-1">
        {chars.map((ch, i) => (
          <FlapObserver
            key={`${chars.length - i}`}
            digit={Number(ch)}
            size={size}
            onTick={onTick}
            reduce={!!reduce}
          />
        ))}
      </span>
      {suffix && (
        <span className="tnum text-xl font-bold leading-none tracking-tight">
          {suffix}
        </span>
      )}
    </span>
  );
}

/** Paquet digit + observateur de changement (déclenche le clac). */
function FlapObserver({
  digit,
  size,
  onTick,
  reduce,
}: {
  digit: number;
  size: number;
  onTick?: () => void;
  reduce: boolean;
}) {
  const prev = useRef(digit);
  useEffect(() => {
    if (prev.current !== digit && !reduce) {
      prev.current = digit;
      onTick?.();
    }
  }, [digit, onTick, reduce]);
  return <FlapDigit digit={digit} size={size} />;
}
