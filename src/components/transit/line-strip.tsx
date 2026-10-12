"use client";

// ─── Bandeau de ligne (afficheur embarqué) ───────────────────────────────────
// Le « route strip » suspendu au-dessus des portes : stations passées remplies,
// station courante annelée, à venir vides. Une rame voyage sur la voie et
// bondit à chaque station franchie. Version maîtrise pour les vues réseau.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Train } from "@phosphor-icons/react";
import { Roundel } from "./roundel";
import { SPRING_HOP } from "./motion";
import { KanaChar } from "@/lib/kana-data";
import { ProgressData, masteryOf } from "@/lib/srs-engine";
import { getCharState } from "@/lib/progress-store";
import { sfx } from "@/lib/sfx";

interface RouteStripProps {
  total: number;
  answered: number;
  script: "hiragana" | "katakana";
  className?: string;
}

/** Bandeau de progression d'une session (le trajet du train). */
export function RouteStrip({ total, answered, script, className = "" }: RouteStripProps) {
  const reduce = useReducedMotion();
  const lineBg = script === "katakana" ? "bg-line-k" : "bg-line-h";
  const lineBgSoft = script === "katakana" ? "bg-line-k/25" : "bg-line-h/25";
  const lineText =
    script === "katakana" ? "text-line-k" : "text-line-h";
  const dots = Array.from({ length: total }, (_, i) => i);

  // Mesure de la voie pour placer la rame (le contenu défile sur mobile)
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackW, setTrackW] = useState(0);

  useLayoutEffect(() => {
    const measure = () => {
      if (trackRef.current) setTrackW(trackRef.current.getBoundingClientRect().width);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    return () => ro.disconnect();
  }, [total]);

  // Clac de joint quand une station est franchie
  const prevAnswered = useRef(answered);
  useEffect(() => {
    if (answered > prevAnswered.current && !reduce) sfx.rail();
    prevAnswered.current = answered;
  }, [answered, reduce]);

  const trainX = trackW > 0 ? (answered / total) * trackW : 0;

  return (
    <div
      className={`overflow-x-auto py-1 ${className}`}
      role="img"
      aria-label={`${answered} stations franchies sur ${total}`}
    >
      <div ref={trackRef} className="relative flex w-max items-center">
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

        {/* La rame : voyage sur la voie, s'arrête à la station courante */}
        <motion.span
          aria-hidden
          className="absolute left-0 top-1/2 z-10 flex -translate-y-[52%] items-center"
          initial={false}
          animate={{ x: trainX }}
          transition={reduce ? { duration: 0 } : SPRING_HOP}
        >
          <span className={`flex size-4 items-center justify-center rounded-[5px] ${lineBg} shadow-sm`}>
            <Train
              size={11}
              weight="fill"
              className={script === "katakana" ? "text-line-k-foreground" : "text-line-h-foreground"}
              mirrored
            />
          </span>
          <span className={`h-[3px] w-5 rounded-full ${lineBgSoft} blur-[1px]`} />
        </motion.span>

        <span className={`tnum ml-2 shrink-0 text-xs font-bold ${lineText}`}>
          {answered}/{total}
        </span>
      </div>
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
