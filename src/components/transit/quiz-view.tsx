"use client";

// ─── Vue Trajet (quiz) ────────────────────────────────────────────────────────
// Le panneau de quai affiche la station, les portes du quai proposent
// les réponses. Les ratées retournent en interruption : le train y revient.
// Écran de fin : l'arrivée en terminus, seul moment de délice chorégraphié.

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowsClockwise,
  Check,
  Path,
  Train,
  X,
} from "@phosphor-icons/react";
import {
  QUESTION_ENTER,
  QUESTION_EXIT,
  SPRING_ARRIVE,
  panelEnter,
} from "./motion";
import { RouteStrip } from "./line-strip";
import { StationSign } from "./station-sign";
import {
  SessionState,
  SessionResult,
  answerCurrent,
  advance,
  getSessionResult,
} from "@/lib/session-engine";
import { applyAnswer, ProgressData } from "@/lib/srs-engine";

interface QuizViewProps {
  session: SessionState | null;
  update: (mutator: (p: ProgressData) => void) => void;
  bump: () => void;
  onExit: () => void;
  onRestart: () => void;
}

type Feedback =
  | { kind: "idle" }
  | { kind: "correct"; expected: string }
  | { kind: "wrong"; expected: string; given: string };

export function QuizView({ session, update, bump, onExit, onRestart }: QuizViewProps) {
  const [feedback, setFeedback] = useState<Feedback>({ kind: "idle" });
  const [typed, setTyped] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const recordedRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const reduce = useReducedMotion();

  const q = session?.current;
  const finished = !!session?.finished;
  const result = finished && session ? getSessionResult(session) : null;

  // ── Enregistrement de la session terminée, une seule fois ──
  useEffect(() => {
    if (finished && session && !recordedRef.current) {
      recordedRef.current = true;
      update((p) => {
        p.sessionsCount += 1;
        const key = new Date().toISOString().slice(0, 10);
        const log = p.daily[key] ?? { attempts: 0, correct: 0, timeSpentMs: 0 };
        log.timeSpentMs += Date.now() - session.startedAt;
        p.daily[key] = log;
      });
    }
  }, [finished, session, update]);

  // ── Nettoyage du minuteur d'avance ──
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  // ── Focus auto en mode saisie ──
  useEffect(() => {
    if (q?.mode === "typing" && !finished && feedback.kind === "idle") {
      inputRef.current?.focus();
    }
  }, [q, finished, feedback]);

  const submitAnswer = useCallback(
    (answer: string) => {
      if (!session || !session.current || feedback.kind !== "idle" || session.finished) return;
      const { correct, expected, charId } = answerCurrent(session, answer);
      update((p) => {
        applyAnswer(p, charId, correct);
      });
      setFeedback(
        correct
          ? { kind: "correct", expected }
          : { kind: "wrong", expected, given: answer }
      );
      bump();

      // Temps de lecture du panneau avant de repartir
      const delay = correct ? 650 : 1900;
      timerRef.current = window.setTimeout(() => {
        advance(session);
        setFeedback({ kind: "idle" });
        setTyped("");
        bump();
      }, delay);
    },
    [session, feedback, update, bump]
  );

  // ── Raccourcis clavier : 1-4 en mode choix, Échap pour quitter ──
  // Règle Emil : le geste clavier est instantané, seul le panneau réagit.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !finished) {
        e.preventDefault();
        onExit();
        return;
      }
      if (!q || q.mode !== "choice" || finished) return;
      if (feedback.kind !== "idle") return;
      const idx = Number(e.key) - 1;
      if (idx >= 0 && idx < q.options.length) {
        e.preventDefault();
        const opt = q.options[idx];
        submitAnswer(q.direction === "kana2romaji" ? opt.romaji : opt.kana);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [q, finished, feedback, submitAnswer, onExit]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && typed.trim()) {
      e.preventDefault();
      submitAnswer(typed);
    }
  };

  // ── Écran d'arrivée ──
  if (finished && result && session) {
    return (
      <ArrivalBoard
        result={result}
        script={session.pool[0]?.script ?? "hiragana"}
        reduce={reduce ?? false}
        onRestart={onRestart}
        onExit={onExit}
      />
    );
  }

  // ── Session introuvable ──
  if (!session || !q) {
    return (
      <div className="flex flex-col items-center gap-4 pt-20 text-muted-foreground">
        <p className="text-sm">Aucun train en service.</p>
        <button
          type="button"
          onClick={onExit}
          className="rounded-lg border border-border px-4 py-2 text-sm font-bold transition-colors hover:border-line-h/50 hover:text-line-h"
        >
          Retour à la gare
        </button>
      </div>
    );
  }

  const pendingRequeue = session.requeueAfter.length;
  const isRetake = session.mistakes.has(q.char.id);
  const isKana2Romaji = q.direction === "kana2romaji";
  const lineText = q.char.script === "katakana" ? "text-line-k" : "text-line-h";

  return (
    <motion.div
      initial={reduce ? false : "hidden"}
      animate="shown"
      variants={panelEnter}
      className="mx-auto flex w-full max-w-xl flex-col gap-4"
    >
      {/* ── Afficheur embarqué : quitter + trajet + reprises ── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onExit}
          aria-label="Quitter la session (Échap)"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-line-h/50 hover:text-line-h active:scale-[0.96]"
        >
          <ArrowLeft size={17} weight="bold" />
        </button>
        <div className="min-w-0 flex-1">
          <RouteStrip
            total={session.sessionSize}
            answered={session.askedIds.size}
            script={q.char.script}
          />
        </div>
        {pendingRequeue > 0 && (
          <span className="flex shrink-0 items-center gap-1 rounded-md border border-signal-stop/30 px-2.5 py-1 text-[11px] font-bold text-signal-stop">
            <ArrowsClockwise size={13} weight="bold" aria-hidden />
            <span className="tnum">{pendingRequeue}</span>
          </span>
        )}
      </div>

      {/* ── Le panneau de la station ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${session.step}-${q.char.id}`}
          initial={reduce ? false : { opacity: 0, y: 10, filter: "blur(3px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: QUESTION_ENTER }}
          exit={reduce ? undefined : { opacity: 0, y: -6, filter: "blur(2px)", transition: QUESTION_EXIT }}
          className="flex flex-col gap-4"
        >
          <motion.div
            animate={
              feedback.kind === "wrong" && !reduce
                ? { x: [0, -6, 6, -3, 0] }
                : { x: 0 }
            }
            transition={{ duration: 0.3 }}
          >
            <StationSign
              char={q.char}
              direction={q.direction}
              revealed={feedback.kind !== "idle"}
              isRetake={isRetake}
              correct={feedback.kind === "idle" ? null : feedback.kind === "correct"}
            />
          </motion.div>

          {/* ── Portes du quai (mode choix) ── */}
          {q.mode === "choice" ? (
            <div className="grid grid-cols-2 gap-2.5" role="group" aria-label="Réponses possibles">
              {q.options.map((opt, i) => {
                const optValue = isKana2Romaji ? opt.romaji : opt.kana;
                const isRight =
                  feedback.kind !== "idle" && optValue === feedback.expected;
                const isChosenWrong =
                  feedback.kind === "wrong" && optValue === feedback.given;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={feedback.kind !== "idle"}
                    onClick={() => submitAnswer(optValue)}
                    className={[
                      "relative flex h-16 items-center justify-center rounded-lg border-2 bg-card transition-[border-color,background-color,opacity] duration-150 select-none",
                      "active:scale-[0.97]",
                      isRight
                        ? "border-signal-go bg-signal-go/10"
                        : isChosenWrong
                          ? "border-signal-stop bg-signal-stop/10"
                          : feedback.kind === "idle"
                            ? "border-border hover:border-line-h/60 hover:bg-line-h-soft/50"
                            : "border-border opacity-40",
                    ].join(" ")}
                  >
                    <span className="absolute left-2.5 top-2 text-[11px] font-extrabold text-muted-foreground/75" aria-hidden>
                      {i + 1}
                    </span>
                    {isRight && (
                      <Check size={16} weight="bold" className="absolute right-2.5 top-2.5 text-signal-go" aria-hidden />
                    )}
                    {isChosenWrong && (
                      <X size={16} weight="bold" className="absolute right-2.5 top-2.5 text-signal-stop" aria-hidden />
                    )}
                    {isKana2Romaji ? (
                      <span className="tnum text-xl font-bold lowercase tracking-tight">{opt.romaji}</span>
                    ) : (
                      <span className="font-kana text-3xl font-bold">{opt.kana}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            // ── Billet de saisie ──
            <form
              className="flex flex-col items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (typed.trim()) submitAnswer(typed);
              }}
            >
              <input
                ref={inputRef}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                disabled={feedback.kind !== "idle"}
                placeholder={isKana2Romaji ? "rōmaji, ex : ka" : "kana, ex : き"}
                aria-label="Votre réponse"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                className={[
                  "tnum h-13 w-full max-w-[16rem] rounded-lg border-2 bg-card text-center text-2xl font-bold lowercase tracking-tight outline-none transition-colors placeholder:text-muted-foreground/40",
                  feedback.kind === "correct"
                    ? "border-signal-go"
                    : feedback.kind === "wrong"
                      ? "border-signal-stop"
                      : "border-border focus:border-line-h",
                ].join(" ")}
              />
              <p className="text-[11px] text-muted-foreground">
                {isKana2Romaji
                  ? `Variantes acceptées : ${q.char.altRomaji?.join(", ") || "aucune"} · Entrée pour valider`
                  : "Copiez le kana puis Entrée pour valider"}
              </p>
            </form>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Zone de feedback (annonces de bord) ── */}
      <div className="flex min-h-[3.4rem] items-center justify-center" aria-live="polite">
        <AnimatePresence mode="wait">
          {feedback.kind === "correct" && (
            <motion.p
              key="ok"
              initial={reduce ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              className={`flex items-center gap-2 text-sm font-bold ${lineText}`}
            >
              <Check size={18} weight="bold" aria-hidden />
              Station franchie. {isKana2Romaji ? q.char.romaji : q.char.kana}
            </motion.p>
          )}
          {feedback.kind === "wrong" && (
            <motion.p
              key="ko"
              initial={reduce ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              className="flex flex-col items-center gap-1 text-sm font-bold text-signal-stop"
            >
              <span className="flex items-center gap-2">
                <X size={18} weight="bold" aria-hidden />
                La réponse était {feedback.expected}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">
                Interruption sur cette station : le train y reviendra.
              </span>
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* ── Aide clavier, discrète ── */}
      {q.mode === "choice" && feedback.kind === "idle" && (
        <p className="text-center text-[11px] text-muted-foreground/70">
          Touches 1 à 4 pour répondre
        </p>
      )}
    </motion.div>
  );
}

// ─── Écran d'arrivée en terminus ──────────────────────────────────────────────

interface ArrivalBoardProps {
  result: SessionResult;
  script: "hiragana" | "katakana";
  reduce: boolean;
  onRestart: () => void;
  onExit: () => void;
}

function ArrivalBoard({ result, script, reduce, onRestart, onExit }: ArrivalBoardProps) {
  const accuracy =
    result.attempts > 0 ? Math.round((result.firstTryCorrect / result.attempts) * 100) : 0;
  const mins = Math.floor(result.timeMs / 60000);
  const secs = Math.round((result.timeMs % 60000) / 1000);
  const clean = result.mistakes.length === 0;
  const lineBg = script === "katakana" ? "bg-line-k" : "bg-line-h";
  const dots = Array.from({ length: result.targetSize }, (_, i) => i);

  return (
    <motion.div
      initial={reduce ? false : "hidden"}
      animate="shown"
      variants={{ hidden: {}, shown: { transition: { staggerChildren: 0.06 } } }}
      className="mx-auto flex w-full max-w-xl flex-col gap-5"
    >
      {/* ── Le trajet s'illumine : le moment signature ── */}
      <motion.div
        variants={{
          hidden: { opacity: 0 },
          shown: { opacity: 1, transition: { duration: 0.3 } },
        }}
        className="sign-panel px-5 py-4"
        aria-hidden
      >
        <div className="flex flex-wrap items-center justify-center gap-x-0 gap-y-2">
          {dots.map((i) => (
            <motion.span
              key={i}
              variants={{
                hidden: { opacity: 0, scale: 0.4 },
                shown: {
                  opacity: 1,
                  scale: 1,
                  transition: SPRING_ARRIVE,
                },
              }}
              className="flex items-center"
            >
              {i > 0 && <span className="h-[2px] w-3 rounded-full bg-border" />}
              <span className={`size-2.5 rounded-full border-2 border-transparent ${lineBg}`} />
            </motion.span>
          ))}
        </div>
        <p className="mt-3 text-center font-kana text-sm font-bold tracking-[0.4em] text-muted-foreground" aria-hidden>
          終着
        </p>
      </motion.div>

      {/* ── Rapport d'arrivée ── */}
      <motion.div variants={panelEnter} className="flex flex-col items-center gap-1.5 py-1 text-center">
        <h2 className="text-2xl font-extrabold tracking-tight">
          {clean ? "Service parfait" : "Terminus"}
        </h2>
        <p className="max-w-[42ch] text-sm text-muted-foreground">
          {clean
            ? "Aucune interruption sur la ligne. Le réseau vous salue."
            : `${result.mistakes.length} station(s) en interruption, dont ${result.mistakes.filter((m) => m.redeemed).length} rattrapée(s) avant l'arrivée.`}
        </p>
      </motion.div>

      <motion.div variants={panelEnter} className="grid grid-cols-3 gap-3">
        <ArrivalStat label="Bonnes réponses" value={`${result.firstTryCorrect}/${result.attempts}`} />
        <ArrivalStat label="Précision" value={`${accuracy} %`} accent />
        <ArrivalStat
          label="Temps de trajet"
          value={mins > 0 ? `${mins}m ${secs}s` : `${secs}s`}
        />
      </motion.div>

      {result.mistakes.length > 0 && (
        <motion.div variants={panelEnter} className="sign-panel">
          <div className="flex items-center gap-2 border-b border-border px-5 py-3">
            <ArrowsClockwise size={16} weight="bold" className="text-signal-stop" aria-hidden />
            <h3 className="text-sm font-bold">Stations à revoir</h3>
            <span className="text-xs text-muted-foreground">le SRS les ressort en priorité</span>
          </div>
          <ul className="grid grid-cols-2 gap-2 px-5 py-4 sm:grid-cols-3">
            {result.mistakes.map((m) => (
              <li
                key={m.char.id}
                className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2"
              >
                <span className="font-kana text-2xl font-bold leading-none">{m.char.kana}</span>
                <span className="flex min-w-0 flex-col">
                  <span className="tnum text-sm font-bold lowercase">{m.char.romaji}</span>
                  <span className="text-[11px] text-muted-foreground">
                    raté {m.timesMissed} fois{m.redeemed ? ", rattrapé" : ""}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      <motion.div variants={panelEnter} className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onRestart}
          className="flex h-12 flex-1 items-center justify-center gap-2.5 rounded-lg bg-line-h text-sm font-extrabold uppercase tracking-[0.1em] text-line-h-foreground transition-[filter,opacity] duration-200 hover:brightness-110 active:scale-[0.98]"
        >
          <Train size={18} weight="fill" aria-hidden />
          Nouveau départ
        </button>
        <button
          type="button"
          onClick={onExit}
          className="flex h-12 flex-1 items-center justify-center gap-2.5 rounded-lg border-2 border-border bg-card text-sm font-extrabold uppercase tracking-[0.1em] text-foreground transition-colors hover:border-line-h/50 hover:text-line-h active:scale-[0.98]"
        >
          <Path size={18} weight="bold" aria-hidden />
          Retour à la gare
        </button>
      </motion.div>
    </motion.div>
  );
}

function ArrivalStat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={[
        "flex flex-col gap-1 rounded-lg border px-4 py-3",
        accent ? "border-line-h/35 bg-line-h-soft" : "border-border bg-card",
      ].join(" ")}
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </span>
      <span className="tnum text-xl font-bold leading-none tracking-tight">{value}</span>
    </div>
  );
}
