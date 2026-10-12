"use client";

// ─── Vue Gare (accueil) ──────────────────────────────────────────────────────
// Premier écran : tableau de service à quatre chiffres, planificateur
// de trajet (lignes, sections, longueur, sens, réponse) et état du réseau.
// Composition asymétrique : planificateur à gauche, réseau à droite.

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  CalendarBlank,
  Crosshair,
  Flame,
  SealCheck,
  Train,
} from "@phosphor-icons/react";
import { boardStagger, panelEnter } from "./motion";
import { Figure } from "./figure";
import { MasteryStrip } from "./line-strip";
import { Roundel } from "./roundel";
import { LedTicker } from "./led-ticker";
import { SECTIONS, lineOf } from "./tokens";
import { InstallCard } from "@/components/pwa/install-ui";
import { KanaChar, KanaGroup } from "@/lib/kana-data";
import { ProgressData, computeGlobalStats, masteryOf } from "@/lib/srs-engine";
import { Settings } from "@/lib/progress-store";
import { getCharState } from "@/lib/progress-store";
import { sfx } from "@/lib/sfx";

interface HomeViewProps {
  pool: KanaChar[];
  progress: ProgressData;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  onStart: () => void;
  onOpenNetwork: () => void;
}

type Script = "hiragana" | "katakana";

export function HomeView({
  pool,
  progress,
  settings,
  updateSettings,
  onStart,
  onOpenNetwork,
}: HomeViewProps) {
  const reduce = useReducedMotion();
  const stats = useMemo(() => computeGlobalStats(pool, progress), [pool, progress]);

  const weakest = useMemo(() => {
    return pool
      .filter((c) => {
        const s = progress.chars[c.id];
        return s && s.attempts >= 2 && s.correct / s.attempts < 0.8;
      })
      .sort((a, b) => {
        const sa = progress.chars[a.id]!;
        const sb = progress.chars[b.id]!;
        return sa.correct / sa.attempts - sb.correct / sb.attempts;
      })
      .slice(0, 6);
  }, [pool, progress]);

  const poolEmpty = pool.length === 0;
  const percentMastered =
    pool.length > 0 ? Math.round((stats.mastered / pool.length) * 100) : 0;
  const hasData = stats.totalAttempts > 0;

  const toggleScript = (s: Script) => {
    const active = settings.scripts.includes(s);
    const next = active
      ? settings.scripts.filter((x) => x !== s)
      : [...settings.scripts, s];
    if (next.length > 0) {
      sfx.tap();
      updateSettings({ scripts: next });
    }
  };

  const toggleGroup = (g: KanaGroup) => {
    const active = settings.groups.includes(g);
    const next = active
      ? settings.groups.filter((x) => x !== g)
      : [...settings.groups, g];
    if (next.length > 0) {
      sfx.tap();
      updateSettings({ groups: next });
    }
  };

  return (
    <motion.div
      initial={reduce ? false : "hidden"}
      animate="shown"
      variants={boardStagger}
      className="flex flex-col gap-5"
    >
      {/* ── Bandeau LED de service : le quai est vivant ── */}
      <motion.div variants={panelEnter}>
        <LedTicker
          items={[
            "KANA DOJO LINE — SERVICE CONTINU",
            `全駅停車 · ${stats.mastered}/${pool.length} STATIONS MAÎTRISÉES`,
            hasData
              ? `PRÉCISION ${Math.round(stats.accuracy * 100)} % · SÉRIE ${stats.dayStreak} J`
              : "Bienvenue à bord · ご乗車ありがとうございます",
            "RÉPÉTITION ESPACÉE — LES RATÉS REVIENNENT",
          ]}
          duration={22}
          label="Tableau de service en marche"
        />
      </motion.div>

      {/* ── Proposition de valeur, une seule phrase ── */}
      <motion.p
        variants={panelEnter}
        className="max-w-[62ch] text-pretty text-[15px] leading-relaxed text-muted-foreground"
      >
        Chaque session est un trajet sur votre réseau de kana. Les stations
        ratées restent en interruption et le train y revient ; les réussies
        s&apos;espacent dans le temps.
      </motion.p>

      {/* ── Tableau de service ── */}
      <motion.section
        variants={panelEnter}
        aria-label="Tableau de service"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        <Figure
          icon={Flame}
          label="Série de jours"
          value={stats.dayStreak > 0 ? stats.dayStreak : 0}
          suffix=" j"
          accent
        />
        <Figure
          icon={Crosshair}
          label="Précision globale"
          value={hasData ? Math.round(stats.accuracy * 100) : null}
          suffix=" %"
        />
        <Figure icon={SealCheck} label="Stations maîtrisées" value={stats.mastered} />
        <Figure
          icon={CalendarBlank}
          label="Aujourd'hui"
          value={stats.todayAttempts > 0 ? stats.todayAttempts : null}
          suffix=" rép."
        />
      </motion.section>

      {/* ── Plan de voyage + état du réseau ── */}
      <div className="grid gap-5 lg:grid-cols-[1fr_330px] lg:items-start">
        {/* Planificateur */}
        <motion.section
          variants={panelEnter}
          aria-label="Planificateur de trajet"
          className="sign-panel"
        >
          <div className="border-b border-border px-5 py-3.5">
            <h2 className="text-base font-bold tracking-tight">Composer le trajet</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Le train s&apos;arrête aux stations que vous choisissez.
            </p>
          </div>

          <div className="flex flex-col gap-5 px-5 py-5">
            {/* Lignes */}
            <fieldset>
              <legend className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                Lignes
              </legend>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {(["hiragana", "katakana"] as Script[]).map((s) => {
                  const line = lineOf(s);
                  const active = settings.scripts.includes(s);
                  const bandCls =
                    s === "hiragana" ? "bg-line-h text-line-h-foreground" : "bg-line-k text-line-k-foreground";
                  return (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleScript(s)}
                      className={[
                        "group overflow-hidden rounded-lg border-2 text-left transition-[opacity,border-color] duration-200 active:scale-[0.98]",
                        active
                          ? s === "hiragana"
                            ? "border-line-h"
                            : "border-line-k"
                          : "border-border opacity-60 hover:opacity-90",
                      ].join(" ")}
                    >
                      <span
                        className={`flex items-center justify-between px-3 py-1.5 ${active ? bandCls : "bg-secondary text-muted-foreground"}`}
                      >
                        <span className="text-[11px] font-bold uppercase tracking-[0.12em]">
                          Ligne {line.code}
                        </span>
                        <span className="font-kana text-base leading-none" aria-hidden>
                          {line.kana}
                        </span>
                      </span>
                      <span className="flex items-baseline justify-between gap-2 px-3 py-2">
                        <span className="text-sm font-bold">{line.name}</span>
                        <span className="tnum text-[10px] font-semibold text-muted-foreground">
                          {line.count} stations
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Sections */}
            <fieldset>
              <legend className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                Sections desservies
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {(Object.keys(SECTIONS) as KanaGroup[]).map((g) => {
                  const active = settings.groups.includes(g);
                  const count = SECTIONS[g].count(settings.scripts[0] ?? "hiragana");
                  return (
                    <button
                      key={g}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleGroup(g)}
                      title={SECTIONS[g].hint}
                      className={[
                        "flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-bold transition-colors active:scale-[0.97]",
                        active
                          ? "border-line-h bg-line-h-soft text-line-h"
                          : "border-border text-muted-foreground hover:border-muted-foreground/40",
                      ].join(" ")}
                    >
                      {SECTIONS[g].short}
                      <span className="tnum font-semibold opacity-70">{count}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Longueur / Sens / Réponse */}
            <div className="grid gap-5 sm:grid-cols-3">
              <ChipRow
                legend="Longueur"
                options={[10, 20, 30].map((n) => ({ value: String(n), label: String(n) }))}
                value={String(settings.sessionSize)}
                onSelect={(v) => {
                  sfx.tap();
                  updateSettings({ sessionSize: Number(v) });
                }}
              />
              <ChipRow
                legend="Sens"
                options={[
                  { value: "kana2romaji", label: "Kana → rōmaji" },
                  { value: "romaji2kana", label: "Rōmaji → kana" },
                  { value: "mixed", label: "Mixte" },
                ]}
                value={settings.direction}
                onSelect={(v) => {
                  sfx.tap();
                  updateSettings({ direction: v as Settings["direction"] });
                }}
              />
              <ChipRow
                legend="Réponse"
                options={[
                  { value: "choice", label: "Choix" },
                  { value: "typing", label: "Saisie" },
                ]}
                value={settings.mode}
                onSelect={(v) => {
                  sfx.tap();
                  updateSettings({ mode: v as Settings["mode"] });
                }}
              />
            </div>

            {/* Départ */}
            <div className="flex flex-col gap-2.5">
              <motion.button
                type="button"
                onClick={() => {
                  sfx.doors();
                  onStart();
                }}
                disabled={poolEmpty}
                whileHover={reduce ? undefined : { scale: 1.015 }}
                whileTap={reduce ? undefined : { scale: 0.98 }}
                className="flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-line-h text-base font-extrabold uppercase tracking-[0.1em] text-line-h-foreground shadow-sign transition-[filter,opacity] duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100 sm:w-auto sm:px-8"
              >
                <Train size={20} weight="fill" aria-hidden />
                Départ
                <span className="h-5 w-[2px] rounded-full bg-line-h-foreground/30" aria-hidden />
                <span className="tnum font-bold normal-case tracking-normal opacity-90">
                  {Math.min(settings.sessionSize, pool.length)} stations
                </span>
              </motion.button>
              <p className="text-xs text-muted-foreground">
                {poolEmpty
                  ? "Sélectionnez au moins une ligne et une section pour partir."
                  : "Les stations ratées reviennent jusqu'à être réussies, puis le SRS les espaces."}
              </p>
            </div>
          </div>
        </motion.section>

        {/* État du réseau */}
        <motion.aside
          variants={panelEnter}
          aria-label="État du réseau sélectionné"
          className="sign-panel"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-bold tracking-tight">État du réseau</h2>
            <span className="tnum rounded-sm bg-line-h-soft px-2 py-0.5 text-[11px] font-bold text-line-h">
              {percentMastered} % maîtrisé
            </span>
          </div>
          <div className="flex flex-col gap-4 px-4 py-4">
            <MasteryStrip chars={pool} progress={progress} />

            {hasData ? (
              <div className="flex flex-col gap-2 border-t border-border pt-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                  Stations en difficulté
                </p>
                {weakest.length > 0 ? (
                  <ul className="flex flex-wrap gap-1.5" aria-label="Stations les moins réussies">
                    {weakest.map((c) => {
                      const s = getCharState(progress, c.id);
                      const acc = Math.round((s.correct / s.attempts) * 100);
                      return (
                        <li
                          key={c.id}
                          className="flex items-center gap-1.5 rounded-md border border-signal-stop/30 bg-signal-stop/5 px-2.5 py-1"
                        >
                          <Roundel level="learning" size={8} script={c.script} />
                          <span className="font-kana text-base font-bold leading-none">{c.kana}</span>
                          <span className="tnum text-[11px] font-bold text-signal-stop">{acc} %</span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Aucune station faible sur la sélection. Le service est fluide.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 border-t border-border pt-3">
                <p className="text-xs font-semibold text-foreground">Premier service</p>
                <p className="text-xs text-muted-foreground">
                  Les pastilles se rempliront au fil de vos trajets.{" "}
                  <button
                    type="button"
                    onClick={onOpenNetwork}
                    className="font-semibold text-line-h underline-offset-2 hover:underline"
                  >
                    Voir le plan du réseau
                  </button>
                </p>
              </div>
            )}
          </div>
        </motion.aside>
      </div>

      {/* ── Installation sur l'écran d'accueil (tant que ce n'est pas fait) ── */}
      <InstallCard />
    </motion.div>
  );
}

// ── Rangée de puces de réglage ──────────────────────────────────────────────

interface ChipRowProps {
  legend: string;
  options: { value: string; label: string }[];
  value: string;
  onSelect: (v: string) => void;
}

function ChipRow({ legend, options, value, onSelect }: ChipRowProps) {
  return (
    <fieldset>
      <legend className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
        {legend}
      </legend>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(o.value)}
              className={[
                "rounded-md border px-2.5 py-1.5 text-xs font-bold transition-colors active:scale-[0.96]",
                active
                  ? "border-line-h bg-line-h-soft text-line-h"
                  : "border-border text-muted-foreground hover:border-muted-foreground/40",
              ].join(" ")}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
