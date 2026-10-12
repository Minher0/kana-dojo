"use client";

// ─── Bandeau de ligne (afficheur embarqué) ───────────────────────────────────
// Le « route strip » suspendu au-dessus des portes : stations passées remplies,
// station courante annelée, à venir vides. Version maîtrise pour les vues réseau.

import { motion, useReducedMotion } from "framer-motion";
import { Roundel } from "./roundel";
import { KanaChar } from "@/lib/kana-data";
import { ProgressData, masteryOf } from "@/lib/srs-engine";
import { getCharState } from "@/lib/progress-store";

interface RouteStripProps {
  total: number;
  answered: number;
  script: "hiragana" | "katakana";
  className?: string;
}

/** Bandeau de progression d'une session (le trajet du train). */
export function RouteStrip({ total, answered, script, className = "" }: RouteStripProps) {
  const lineBg = script === "katakana" ? "bg-line-k" : "bg-line-h";
  const lineText =
    script === "katakana" ? "text-line-k" : "text-line-h";
  const dots = Array.from({ length: total }, (_, i) => i);

  return (
    <div
      className={`flex items-center gap-2 overflow-x-auto py-1 ${className}`}
      role="img"
      aria-label={`${answered} stations franchies sur ${total}`}
    >
      {dots.map((i) => {
        const passed = i < answered;
        const current = i === answered;
        return (
          <span key={i} className="flex items-center">
            {i > 0 && (
              <span className="mx-1 h-[2px] w-4 shrink-0 rounded-full bg-muted-foreground/25" aria-hidden />
            )}
            <span
              className={[
                "inline-block shrink-0 rounded-full border-2 transition-colors duration-200",
                passed ? `border-transparent ${lineBg} size-3`
                  : current ? "border-muted-foreground/70 size-3.5"
                    : "border-muted-foreground/45 size-2.5 bg-transparent",
              ].join(" ")}
            />
          </span>
        );
      })}
      <span className={`tnum ml-2 shrink-0 text-xs font-bold ${lineText}`}>
        {answered}/{total}
      </span>
    </div>
  );
}

interface MasteryStripProps {
  chars: KanaChar[];
  progress: ProgressData;
  className?: string;
  size?: number;
}

/** Bandeau d'état du réseau : une pastille par station du pool. */
export function MasteryStrip({ chars, progress, className = "", size = 10 }: MasteryStripProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : "hidden"}
      animate="shown"
      variants={{
        hidden: {},
        shown: { transition: { staggerChildren: 0.004 } },
      }}
      className={`flex flex-wrap gap-[5px] ${className}`}
    >
      {chars.map((c) => {
        const state = getCharState(progress, c.id);
        const level = masteryOf(state);
        return (
          <motion.span
            key={c.id}
            variants={{
              hidden: { opacity: 0, scale: 0.5 },
              shown: {
                opacity: 1,
                scale: 1,
                transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
              },
            }}
            title={`${c.kana} ${c.romaji} · ${labelOf(level)}`}
            className="cursor-default"
          >
            <Roundel level={level} size={size} script={c.script} />
          </motion.span>
        );
      })}
    </motion.div>
  );
}

function labelOf(level: ReturnType<typeof masteryOf>): string {
  switch (level) {
    case "new":
      return "nouvelle";
    case "learning":
      return "en interruption";
    case "familiar":
      return "en travaux";
    case "mastered":
      return "maîtrisée";
  }
}
