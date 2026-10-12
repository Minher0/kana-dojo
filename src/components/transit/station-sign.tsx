"use client";

// ─── Panneau de signalétique de station ──────────────────────────────────────
// Reprend la grammaire des panneaux de quai japonais : bande de ligne en tête
// avec code de station, grand glyphe central, transcription en dessous.
// La transcription se révèle après la réponse : le panneau se complète.

import { AnimatePresence, motion } from "framer-motion";
import { lineOf, stationCodeOf } from "./tokens";
import { revealEnter, QUESTION_ENTER_SIDE } from "./motion";
import { Stamp } from "./stamp";
import { KanaChar } from "@/lib/kana-data";
import type { Direction } from "@/lib/session-engine";

const BAND_CLS: Record<"hiragana" | "katakana", string> = {
  hiragana: "bg-line-h text-line-h-foreground",
  katakana: "bg-line-k text-line-k-foreground",
};

interface StationSignProps {
  char: KanaChar;
  direction: Direction;
  /** true après la réponse : la ligne du bas se révèle. */
  revealed: boolean;
  isRetake?: boolean;
  correct?: boolean | null;
}

export function StationSign({ char, direction, revealed, isRetake, correct }: StationSignProps) {
  const line = lineOf(char.script);
  const code = stationCodeOf(char);
  const isKana2Romaji = direction === "kana2romaji";

  const glyph = isKana2Romaji ? char.kana : char.romaji;
  const under = isKana2Romaji ? char.romaji : char.kana;
  const altText =
    isKana2Romaji && char.altRomaji?.length
      ? `variantes : ${char.altRomaji.join(", ")}`
      : null;

  return (
    <div
      className={[
        "sign-panel relative overflow-hidden",
        correct === false ? "border-signal-stop/50" : "",
        correct === true ? "border-signal-go/50" : "",
      ].join(" ")}
      aria-live="off"
    >
      {/* Bande de ligne : code de station + nom de ligne, comme une suspente */}
      <div
        className={`line-band flex items-center justify-between px-4 py-2 sm:px-5 ${BAND_CLS[char.script]}`}
      >
        <span className="flex items-baseline gap-2.5">
          <span className="tnum text-sm font-extrabold tracking-[0.04em]">{code}</span>
          <span className="text-xs font-bold uppercase tracking-[0.14em] opacity-90">
            {line.name}
          </span>
        </span>
        <span className="flex items-center gap-2">
          {/* Feux de signal : aspect selon la réponse, éteints sinon */}
          <span
            aria-hidden
            className={[
              "signal-lamp inline-block rounded-full transition-colors duration-150",
              correct === true
                ? "bg-line-h-foreground shadow-[0_0_8px_rgba(255,255,255,0.45)]"
                : "bg-black/25",
            ].join(" ")}
          />
          <span
            aria-hidden
            className={[
              "signal-lamp inline-block rounded-full transition-colors duration-150",
              correct === false
                ? "bg-signal-stop shadow-[0_0_8px_var(--signal-stop)]"
                : "bg-black/25",
            ].join(" ")}
          />
          {isRetake && (
            <span className="ml-1 rounded-sm bg-black/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]">
              Reprise
            </span>
          )}
        </span>
      </div>

      {/* Zone d'affichage : le glyphe et sa transcription */}
      <div className="relative flex min-h-[13rem] flex-col items-center justify-center gap-1 px-6 py-8 sm:min-h-[15rem]">
        {/* Tampon officiel : coupé sur la réponse juste, et rien sinon. */}
        {correct === true && (
          <Stamp
            text="正"
            size={86}
            tone="go"
            angle={-9}
            delay={0.12}
            className="absolute right-3 top-2 sm:right-5 sm:top-3"
          />
        )}
        <motion.span
          key={`glyph-${glyph}`}
          initial={false}
          animate={{ scale: [0.86, 1], opacity: [0.4, 1], filter: ["blur(6px)", "blur(0px)"] }}
          transition={QUESTION_ENTER_SIDE}
          className={[
            "select-none leading-none",
            isKana2Romaji
              ? "font-kana text-[6.5rem] font-black sm:text-[8.5rem]"
              : "tnum text-[4.5rem] font-extrabold lowercase tracking-tight sm:text-[6rem]",
          ].join(" ")}
          role="img"
          aria-label={`Quelle est la transcription de ${glyph} ?`}
        >
          {glyph}
        </motion.span>

        <AnimatePresence mode="wait">
          {revealed ? (
            <motion.span
              key="revealed"
              variants={revealEnter}
              initial="hidden"
              animate="shown"
              exit={{ opacity: 0, y: -3, filter: "blur(2px)", transition: { duration: 0.1 } }}
              className="flex flex-col items-center gap-0.5"
            >
              <span
                className={[
                  "text-2xl font-bold sm:text-3xl",
                  isKana2Romaji ? "tnum lowercase" : "font-kana",
                  correct === false ? "text-signal-stop" : "text-foreground",
                ].join(" ")}
              >
                {under}
              </span>
              {altText && (
                <span className="text-[11px] text-muted-foreground">{altText}</span>
              )}
            </motion.span>
          ) : (
            <motion.span
              key="pending"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.08 } }}
              aria-hidden
              className="flex gap-1.5 pt-2"
            >
              {[0, 1, 2].map((i) => (
                <span key={i} className="size-1.5 rounded-full bg-muted-foreground/35" />
              ))}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
