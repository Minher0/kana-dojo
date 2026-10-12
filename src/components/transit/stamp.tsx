"use client";

// ─── Tampon officiel (hanko de validation) ───────────────────────────────────
// Le coup de tampon de l'agent de gare : arrivée lourde, très brève,
// rotation légère de repos. 「正」 pour une réponse juste, 「合格」 pour
// une session bouclée, 「満点」 pour le sans-faute. Couleur signal GO,
// jamais décorative.

import { motion, useReducedMotion } from "framer-motion";

interface StampProps {
  /** Glyphe(s) du tampon : 正, 合格, 満点… */
  text: string;
  /** Diamètre en px (le tampon est carré, centré). */
  size?: number;
  /** Teinte : go (vert) pour une réponse, gold (doré) pour les récompenses. */
  tone?: "go" | "gold";
  /** Léger angle de repos, comme un vrai coup de tampon. */
  angle?: number;
  className?: string;
  /** Délai avant le coup (s) — laisse respirer la cascade parente. */
  delay?: number;
}

export function Stamp({
  text,
  size = 96,
  tone = "go",
  angle = -8,
  className = "",
  delay = 0,
}: StampProps) {
  const reduce = useReducedMotion();

  const toneCls =
    tone === "gold"
      ? "border-warning text-warning"
      : "border-signal-go text-signal-go";

  const isSingle = text.length === 1;

  return (
    <motion.span
      aria-hidden
      initial={
        reduce
          ? { opacity: 0.85, scale: 1, rotate: angle }
          : { opacity: 0, scale: 2.2, rotate: angle + 14 }
      }
      animate={
        reduce
          ? { opacity: 0.85, scale: 1, rotate: angle }
          : { opacity: 0.85, scale: 1, rotate: angle }
      }
      transition={
        reduce
          ? { duration: 0.01 }
          : {
              type: "spring",
              stiffness: 700,
              damping: 34,
              delay,
            }
      }
      className={[
        "pointer-events-none inline-flex select-none items-center justify-center rounded-full border-[3px] font-kana font-black",
        toneCls,
        className,
      ].join(" ")}
      style={{ width: size, height: size }}
    >
      <span
        className={[
          "flex items-center justify-center leading-none",
          isSingle ? "flex-row" : "flex-row tracking-[0.08em]",
        ].join(" ")}
        style={{ fontSize: isSingle ? size * 0.52 : size * 0.3 }}
      >
        {text}
      </span>
      {/* Double anneau : l'encre déborde légèrement du premier cercle */}
      <span
        className={`pointer-events-none absolute inset-[6%] rounded-full border ${tone === "gold" ? "border-warning/50" : "border-signal-go/50"}`}
        style={{ borderWidth: 1.5 }}
      />
    </motion.span>
  );
}
