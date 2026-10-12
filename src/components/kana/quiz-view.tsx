"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check, X, RotateCcw, Home, Trophy, Timer, ListChecks, Undo2, Flag, Target,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SessionState, answerCurrent, advance, getSessionResult, currentProgressPercent } from "@/lib/session-engine";
import { applyAnswer, ProgressData } from "@/lib/srs-engine";

interface QuizViewProps {
  session: SessionState | null;
  update: (mutator: (p: ProgressData) => void) => void;
  bump: () => void;
  onExit: () => void;
  onRestart: () => void;
}

type Feedback = { kind: "idle" } | { kind: "correct"; expected: string } | { kind: "wrong"; expected: string; given: string };

export function QuizView({ session, update, bump, onExit, onRestart }: QuizViewProps) {
  const [feedback, setFeedback] = useState<Feedback>({ kind: "idle" });
  const [typed, setTyped] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const recordedRef = useRef(false);
  const advancingRef = useRef(false);

  const q = session?.current;
  const finished = !!session?.finished;
  const result = finished && session ? getSessionResult(session) : null;

  // Enregistrer la session terminée une seule fois
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

  // Focus auto pour la saisie clavier
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

      // Délai avant question suivante : plus long si raté (mémorisation)
      const delay = correct ? 700 : 1700;
      window.setTimeout(() => {
        advance(session);
        setFeedback({ kind: "idle" });
        setTyped("");
        advancingRef.current = false;
        bump();
      }, delay);
      advancingRef.current = true;
    },
    [session, feedback, update, bump]
  );

  // Raccourcis clavier 1-4 pour le mode choix
  useEffect(() => {
    if (!q || q.mode !== "choice" || finished) return;
    const handler = (e: KeyboardEvent) => {
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
  }, [q, finished, feedback, submitAnswer]);

  // Entrée pour valider la saisie
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && typed.trim()) {
      e.preventDefault();
      submitAnswer(typed);
    }
  };

  // ── Écran de fin ──────────────────────────────────────────────────────────
  if (finished && result && session) {
    const accuracy = result.attempts > 0 ? Math.round((result.firstTryCorrect / result.attempts) * 100) : 0;
    const mins = Math.floor(result.timeMs / 60000);
    const secs = Math.round((result.timeMs % 60000) / 1000);
    const clean = result.mistakes.length === 0;

    return (
      <div className="flex flex-col gap-6 pt-6 max-w-2xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-6"
        >
          <div className="inline-flex size-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Trophy className="size-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">
            {clean ? "Session parfaite !" : "Session terminée"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {clean
              ? "Aucune erreur — le dojo vous salue."
              : `${result.mistakes.length} caractère(s) raté(s), dont ${result.mistakes.filter((m) => m.redeemed).length} rattrapé(s).`}
          </p>
        </motion.div>

        <div className="grid grid-cols-3 gap-3">
          <ResultStat icon={ListChecks} label="Bonnes réponses" value={`${result.firstTryCorrect}/${result.attempts}`} />
          <ResultStat icon={Target} label="Précision" value={`${accuracy}%`} />
          <ResultStat icon={Timer} label="Temps" value={mins > 0 ? `${mins}m ${secs}s` : `${secs}s`} />
        </div>

        {result.mistakes.length > 0 && (
          <Card>
            <CardContent className="p-5 flex flex-col gap-3">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Flag className="size-4 text-destructive" />
                À revoir — le SRS les ressortira en priorité
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {result.mistakes.map((m) => (
                  <div
                    key={m.char.id}
                    className="flex items-center gap-2.5 rounded-lg border bg-card px-3 py-2"
                  >
                    <span className="font-kana text-2xl">{m.char.kana}</span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium">{m.char.romaji}</span>
                      <span className="text-[11px] text-muted-foreground">
                        raté {m.timesMissed}×
                        {m.redeemed && (
                          <span className="ml-1 text-emerald-600 dark:text-emerald-400">
                            · rattrapé ✓
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button size="lg" onClick={onRestart} className="flex-1 gap-2">
            <RotateCcw className="size-4" />
            Refaire une session
          </Button>
          <Button size="lg" variant="outline" onClick={onExit} className="flex-1 gap-2">
            <Home className="size-4" />
            Retour à l&apos;accueil
          </Button>
        </div>
      </div>
    );
  }

  // ── Question en cours ─────────────────────────────────────────────────────
  if (!session || !q) {
    return (
      <div className="flex flex-col items-center gap-4 pt-20 text-muted-foreground">
        <p>Session introuvable.</p>
        <Button variant="outline" onClick={onExit}>Retour</Button>
      </div>
    );
  }

  const pct = currentProgressPercent(session);
  const pendingRequeue = session.requeueAfter.length;
  const isRetake = session.mistakes.has(q.char.id);
  const isKana2Romaji = q.direction === "kana2romaji";

  return (
    <div className="flex flex-col gap-4 pt-4 max-w-2xl mx-auto w-full">
      {/* Barre de progression */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={onExit}
          aria-label="Quitter la session"
        >
          <Undo2 className="size-4" />
        </Button>
        <Progress value={pct} className="flex-1 h-2" />
        <span className="text-xs font-medium tabular-nums text-muted-foreground shrink-0">
          {session.askedIds.size}/{session.sessionSize}
        </span>
        {pendingRequeue > 0 && (
          <Badge variant="secondary" className="text-[11px] h-6 gap-1">
            <RotateCcw className="size-3" />
            {pendingRequeue} à reprendre
          </Badge>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${session.step}-${q.char.id}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          <Card className={isRetake ? "border-destructive/30" : undefined}>
            <CardContent className="flex flex-col items-center gap-6 py-8">
              {/* Étiquette de sens */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[11px] font-normal text-muted-foreground">
                  {isKana2Romaji ? "Quel est son rōmaji ?" : "Quel est ce kana ?"}
                </Badge>
                {isRetake && (
                  <Badge variant="secondary" className="text-[11px] bg-destructive/10 text-destructive border-destructive/20 gap-1">
                    <RotateCcw className="size-3" />
                    Reprise
                  </Badge>
                )}
              </div>

              {/* Le caractère / le rōmaji à deviner */}
              <motion.div
                className="flex items-center justify-center min-h-[7rem]"
                animate={
                  feedback.kind === "wrong"
                    ? { x: [0, -8, 8, -6, 6, 0] }
                    : {}
                }
                transition={{ duration: 0.4 }}
              >
                {isKana2Romaji ? (
                  <span className="font-kana text-8xl leading-none select-none">{q.char.kana}</span>
                ) : (
                  <span className="text-6xl font-mono font-semibold lowercase tracking-tight select-none">
                    {q.char.romaji}
                  </span>
                )}
              </motion.div>

              {/* Réponses */}
              {q.mode === "choice" ? (
                <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                  {q.options.map((opt, i) => {
                    const optValue = isKana2Romaji ? opt.romaji : opt.kana;
                    const isRight =
                      feedback.kind !== "idle" && optValue === feedback.expected;
                    const isChosenWrong =
                      feedback.kind === "wrong" && optValue === feedback.given;

                    return (
                      <button
                        key={opt.id}
                        disabled={feedback.kind !== "idle"}
                        onClick={() => submitAnswer(optValue)}
                        className={choiceClass(feedback.kind, isRight, isChosenWrong)}
                      >
                        <span className="text-[10px] font-mono text-muted-foreground/70 absolute top-1.5 left-2.5">
                          {i + 1}
                        </span>
                        {isKana2Romaji ? (
                          <span className="font-mono text-lg font-semibold lowercase">{opt.romaji}</span>
                        ) : (
                          <span className="font-kana text-2xl">{opt.kana}</span>
                        )}
                        {isRight && <Check className="size-4 text-emerald-600 dark:text-emerald-400 absolute top-2 right-2.5" />}
                        {isChosenWrong && <X className="size-4 text-destructive absolute top-2 right-2.5" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 w-full max-w-xs">
                  <Input
                    ref={inputRef}
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    onKeyDown={onKeyDown}
                    disabled={feedback.kind !== "idle"}
                    placeholder={isKana2Romaji ? "Tapez le rōmaji… ex : ka" : "—"}
                    className={
                      feedback.kind === "correct"
                        ? "border-emerald-500/50 text-center text-lg"
                        : feedback.kind === "wrong"
                          ? "border-destructive/60 text-center text-lg"
                          : "text-center text-lg"
                    }
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    inputMode={isKana2Romaji ? "text" : "text"}
                    aria-label="Votre réponse"
                  />
                  {isKana2Romaji && (
                    <p className="text-[11px] text-muted-foreground">
                      Variantes acceptées : {q.char.altRomaji?.join(", ") || "aucune"} · Entrée pour valider
                    </p>
                  )}
                </div>
              )}

              {/* Feedback */}
              <div className="min-h-[3.2rem] flex items-center" aria-live="polite">
                {feedback.kind === "correct" && (
                  <motion.p
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold"
                  >
                    <Check className="size-5" />
                    {isKana2Romaji ? q.char.romaji : q.char.kana} — juste !
                  </motion.p>
                )}
                {feedback.kind === "wrong" && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-1 text-destructive font-semibold"
                  >
                    <span className="flex items-center gap-2">
                      <X className="size-5" />
                      La réponse était {feedback.expected}
                      {!isKana2Romaji && q.char.altRomaji?.length ? ` (${q.char.romaji})` : ""}
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">
                      Ce caractère reviendra dans quelques questions…
                    </span>
                  </motion.p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function choiceClass(fbKind: Feedback["kind"], isRight: boolean, isChosenWrong: boolean): string {
  const base =
    "relative h-14 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98] transition-all flex items-center justify-center disabled:cursor-default select-none";
  if (fbKind === "idle") return base;
  if (isRight)
    return `${base} !border-emerald-500/60 !bg-emerald-500/10 text-foreground disabled:opacity-100`;
  if (isChosenWrong)
    return `${base} !border-destructive/60 !bg-destructive/10 text-foreground disabled:opacity-100`;
  return `${base} opacity-40 disabled:opacity-40`;
}

function ResultStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Timer;
  label: string;
  value: string;
}) {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide truncate">{label}</p>
          <p className="text-lg font-bold leading-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
