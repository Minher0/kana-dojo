"use client";

// ─── Vue Service (statistiques) ───────────────────────────────────────────────
// Le tableau d'exploitation du réseau : trafic quotidien, état des lignes,
// détail par station. Graphiques dessinés en CSS depuis les vraies données.

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowsClockwise,
  Crosshair,
  Flame,
  Lightning,
  Trash,
} from "@phosphor-icons/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { boardStagger, panelEnter } from "./motion";
import { Figure } from "./figure";
import { MasteryStrip } from "./line-strip";
import { Roundel } from "./roundel";
import { lineOf } from "./tokens";
import { KanaChar } from "@/lib/kana-data";
import {
  DAY,
  ProgressData,
  computeGlobalStats,
  masteryOf,
  todayKey,
} from "@/lib/srs-engine";
import { resetAll } from "@/lib/progress-store";

interface StatsViewProps {
  pool: KanaChar[];
  progress: ProgressData;
  onStart: () => void;
}

const BAND_CLS: Record<"hiragana" | "katakana", string> = {
  hiragana: "bg-line-h text-line-h-foreground",
  katakana: "bg-line-k text-line-k-foreground",
};

export function StatsView({ pool, progress, onStart }: StatsViewProps) {
  const reduce = useReducedMotion();
  const stats = useMemo(() => computeGlobalStats(pool, progress), [pool, progress]);
  const hasData = stats.totalAttempts > 0;

  // ── Trafic des 14 derniers jours ──
  const daily = useMemo(() => {
    const out: {
      key: string;
      label: string;
      attempts: number;
      correct: number;
    }[] = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * DAY);
      const key = todayKey(d.getTime());
      const log = progress.daily[key];
      out.push({
        key,
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        attempts: log?.attempts ?? 0,
        correct: log?.correct ?? 0,
      });
    }
    return out;
  }, [progress.daily]);

  const maxAttempts = Math.max(...daily.map((d) => d.attempts), 1);

  // ── État par ligne ──
  const lineStatus = useMemo(() => {
    return (["hiragana", "katakana"] as const)
      .filter((s) => pool.some((c) => c.script === s))
      .map((script) => {
        const chars = pool.filter((c) => c.script === script);
        const counts = { new: 0, learning: 0, familiar: 0, mastered: 0 };
        for (const c of chars) {
          counts[masteryOf(progress.chars[c.id])] += 1;
        }
        return { script, chars, counts, total: chars.length };
      });
  }, [pool, progress]);

  // ── Détail par station ──
  const [sort, setSort] = useState<"weakness" | "attempts" | "mastery">("weakness");
  const charRows = useMemo(() => {
    const rows = pool
      .map((c) => {
        const s = progress.chars[c.id];
        return {
          char: c,
          attempts: s?.attempts ?? 0,
          correct: s?.correct ?? 0,
          accuracy: s && s.attempts > 0 ? s.correct / s.attempts : null,
          box: s?.box ?? 0,
          streak: s?.currentStreak ?? 0,
        };
      })
      .filter((r) => r.attempts > 0);

    rows.sort((a, b) => {
      if (sort === "weakness") {
        return (a.accuracy ?? 2) - (b.accuracy ?? 2) || b.attempts - a.attempts;
      }
      if (sort === "attempts") return b.attempts - a.attempts;
      return a.box - b.box || (a.accuracy ?? 2) - (b.accuracy ?? 2);
    });
    return rows.slice(0, 40);
  }, [pool, progress, sort]);

  const handleReset = () => {
    resetAll();
    window.location.reload();
  };

  return (
    <motion.div
      initial={reduce ? false : "hidden"}
      animate="shown"
      variants={boardStagger}
      className="flex flex-col gap-5"
    >
      <motion.header variants={panelEnter} className="flex flex-col gap-1">
        <h1 className="text-xl font-extrabold tracking-tight">Tableau de service</h1>
        <p className="text-sm text-muted-foreground">
          L&apos;exploitation de votre réseau, station par station.
        </p>
      </motion.header>

      <motion.section
        variants={panelEnter}
        aria-label="Résumé"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        <Figure icon={Crosshair} label="Précision" value={hasData ? Math.round(stats.accuracy * 100) : null} suffix=" %" accent />
        <Figure icon={ArrowsClockwise} label="Réponses totales" value={hasData ? stats.totalAttempts : null} />
        <Figure icon={Lightning} label="Trajets" value={hasData ? stats.sessionsCount : null} />
        <Figure icon={Flame} label="Série" value={stats.dayStreak} suffix=" j" />
      </motion.section>

      {!hasData && (
        <motion.div
          variants={panelEnter}
          className="sign-panel flex flex-col items-center gap-3 px-6 py-10 text-center"
        >
          <p className="text-sm font-bold">Aucun trafic relevé</p>
          <p className="max-w-[44ch] text-xs text-muted-foreground">
            Le tableau se remplira dès votre premier trajet : trafic quotidien,
            précision et état des lignes y apparaîtront.
          </p>
          <button
            type="button"
            onClick={onStart}
            className="mt-1 flex h-11 items-center justify-center gap-2 rounded-lg bg-line-h px-6 text-sm font-extrabold uppercase tracking-[0.1em] text-line-h-foreground transition-[filter,opacity] duration-200 hover:brightness-110 active:scale-[0.98]"
          >
            Partir maintenant
          </button>
        </motion.div>
      )}

      {hasData && (
        <>
          {/* ── Trafic des 14 derniers jours ── */}
          <motion.section variants={panelEnter} aria-label="Trafic des 14 derniers jours" className="sign-panel">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3.5">
              <h2 className="text-base font-bold tracking-tight">Trafic des 14 derniers jours</h2>
              <ul className="flex items-center gap-3 text-[11px] font-semibold text-muted-foreground">
                <li className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm bg-signal-go" aria-hidden />
                  bonnes réponses
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm bg-signal-stop/70" aria-hidden />
                  interruptions
                </li>
              </ul>
            </div>
            <div
              className="flex h-[9.5rem] items-end gap-1.5 px-5 py-4"
              role="img"
              aria-label={daily
                .map((d) => `${d.label} : ${d.attempts} réponses, ${d.correct} justes`)
                .join(" ; ")}
            >
              {daily.map((d) => {
                const h = (d.attempts / maxAttempts) * 100;
                const wrong = d.attempts - d.correct;
                return (
                  <div key={d.key} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5" title={`${d.label} : ${d.attempts} rép., ${d.correct} justes`}>
                    <div
                      className="flex w-full max-w-[18px] flex-col justify-end overflow-hidden rounded-sm transition-opacity group-hover:opacity-80"
                      style={{ height: d.attempts > 0 ? `${Math.max(h, 6)}%` : "0%" }}
                    >
                      <div
                        className="w-full rounded-t-sm bg-signal-stop/70"
                        style={{ flexGrow: wrong || 0.01 }}
                        aria-hidden
                      />
                      <div
                        className="w-full bg-signal-go"
                        style={{ flexGrow: d.correct || 0.01 }}
                        aria-hidden
                      />
                    </div>
                    {d.attempts === 0 && <div className="h-[3px] w-3.5 rounded-full bg-muted-foreground/20" aria-hidden />}
                    <span className="tnum text-[9px] font-semibold text-muted-foreground">
                      {d.label.split("/")[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.section>

          {/* ── État des lignes ── */}
          <div className="grid gap-5 lg:grid-cols-2">
            {lineStatus.map(({ script, chars, counts, total }) => {
              const line = lineOf(script);
              const masteredPct = Math.round((counts.mastered / total) * 100);
              return (
                <motion.section
                  key={script}
                  variants={panelEnter}
                  aria-label={`État de la ligne ${line.name}`}
                  className="sign-panel overflow-hidden"
                >
                  <div className={`line-band flex items-center justify-between px-4 py-2 ${BAND_CLS[script]}`}>
                    <span className="flex items-baseline gap-2">
                      <span className="text-sm font-extrabold">Ligne {line.code}</span>
                      <span className="text-xs font-bold uppercase tracking-[0.12em] opacity-90">
                        {line.name}
                      </span>
                    </span>
                    <span className="font-kana text-base leading-none" aria-hidden>{line.kana}</span>
                  </div>
                  <div className="flex flex-col gap-3 px-4 py-4">
                    <MasteryStrip chars={chars} progress={progress} />
                    <div className="grid grid-cols-4 gap-2 border-t border-border pt-3 text-center">
                      <LineCount label="Nouvelles" value={counts.new} />
                      <LineCount label="Interruption" value={counts.learning} stop />
                      <LineCount label="Travaux" value={counts.familiar} warn />
                      <LineCount label="Maîtrisées" value={counts.mastered} go />
                    </div>
                    <p className="tnum text-[11px] font-semibold text-muted-foreground">
                      {masteredPct} % de la ligne maîtrisée ({counts.mastered}/{total} stations)
                    </p>
                  </div>
                </motion.section>
              );
            })}
          </div>

          {/* ── Détail par station ── */}
          <motion.section variants={panelEnter} aria-label="Détail par station" className="sign-panel overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
              <h2 className="text-base font-bold tracking-tight">Détail par station</h2>
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5" role="group" aria-label="Tri du détail">
                  {(
                    [
                      ["weakness", "Faibles"],
                      ["attempts", "Traitées"],
                      ["mastery", "Maîtrise"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={sort === value}
                      onClick={() => setSort(value)}
                      className={[
                        "rounded-md border px-2.5 py-1 text-[11px] font-bold transition-colors",
                        sort === value
                          ? "border-line-h bg-line-h-soft text-line-h"
                          : "border-border text-muted-foreground hover:border-muted-foreground/40",
                      ].join(" ")}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 rounded-md border border-signal-stop/35 px-2.5 py-1 text-[11px] font-bold text-signal-stop transition-colors hover:bg-signal-stop/10 active:scale-[0.96]"
                    >
                      <Trash size={13} weight="bold" aria-hidden />
                      Effacer
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-xl border-2 border-border bg-card">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-bold tracking-tight">
                        Effacer toute la progression ?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-sm">
                        Les {stats.totalAttempts} réponses, les {stats.sessionsCount} trajets et
                        l&apos;état des stations seront définitivement supprimés de cet appareil.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-lg border-2 border-border bg-card font-bold hover:border-muted-foreground/40">
                        Conserver
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleReset}
                        className="rounded-lg bg-signal-stop text-sm font-extrabold uppercase tracking-[0.08em] text-white hover:brightness-110"
                      >
                        Effacer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {charRows.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">
                Aucune station traitée sur la sélection actuelle.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                    <th scope="col" className="px-5 py-2.5">Station</th>
                    <th scope="col" className="px-3 py-2.5 text-right">Précision</th>
                    <th scope="col" className="px-3 py-2.5 text-right">Rép.</th>
                    <th scope="col" className="px-3 py-2.5 text-right">Boîte</th>
                    <th scope="col" className="px-5 py-2.5 text-right">Série</th>
                  </tr>
                </thead>
                <tbody>
                  {charRows.map((r) => {
                    const level = masteryOf(progress.chars[r.char.id]);
                    const acc = r.accuracy !== null ? Math.round(r.accuracy * 100) : null;
                    return (
                      <tr key={r.char.id} className="border-b border-border/50 transition-colors last:border-0 hover:bg-secondary/40">
                        <td className="px-5 py-2.5">
                          <span className="flex items-center gap-2.5">
                            <Roundel level={level} size={9} script={r.char.script} />
                            <span className="font-kana text-xl font-bold leading-none">{r.char.kana}</span>
                            <span className="tnum text-xs font-semibold lowercase text-muted-foreground">
                              {r.char.romaji}
                            </span>
                          </span>
                        </td>
                        <td className="tnum px-3 py-2.5 text-right font-bold">
                          {acc !== null ? (
                            <span className={acc < 70 ? "text-signal-stop" : acc < 90 ? "text-warning" : "text-signal-go"}>
                              {acc} %
                            </span>
                          ) : (
                            "n.d."
                          )}
                        </td>
                        <td className="tnum px-3 py-2.5 text-right text-muted-foreground">{r.attempts}</td>
                        <td className="tnum px-3 py-2.5 text-right text-muted-foreground">{r.box}</td>
                        <td className="tnum px-5 py-2.5 text-right text-muted-foreground">{r.streak}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </motion.section>
        </>
      )}
    </motion.div>
  );
}

function LineCount({
  label,
  value,
  stop = false,
  warn = false,
  go = false,
}: {
  label: string;
  value: number;
  stop?: boolean;
  warn?: boolean;
  go?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className={[
          "tnum text-lg font-bold leading-none",
          stop ? "text-signal-stop" : warn ? "text-warning" : go ? "text-line-h" : "text-muted-foreground",
        ].join(" ")}
      >
        {value}
      </span>
      <span className="text-[9px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
