"use client";

// ─── Vue Réseau (plan des lignes) ─────────────────────────────────────────────
// Le plan complet : chaque syllabaire est une ligne, chaque kana une station.
// Les pastilles et teintes portent l'état de maîtrise, comme une carte
// d'état du trafic. Toutes les infos sont visibles directement sur la tuile.

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { boardStagger, panelEnter } from "./motion";
import { Roundel } from "./roundel";
import { SECTIONS, lineOf, stationStateOf } from "./tokens";
import {
  ALL_KANA,
  HIRAGANA_BASE,
  HIRAGANA_DAKUTEN,
  HIRAGANA_YOON,
  KATAKANA_BASE,
  KATAKANA_DAKUTEN,
  KATAKANA_YOON,
  KanaChar,
  KanaGroup,
} from "@/lib/kana-data";
import { ProgressData, masteryOf } from "@/lib/srs-engine";

interface NetworkViewProps {
  progress: ProgressData;
  /** Stations hors service (feuille de service) : elles apparaissent éteintes. */
  excludedIds?: string[];
}

type Script = "hiragana" | "katakana";

const BAND_CLS: Record<Script, string> = {
  hiragana: "bg-line-h text-line-h-foreground",
  katakana: "bg-line-k text-line-k-foreground",
};

const GROUPS: Record<Script, { group: KanaGroup; chars: KanaChar[] }[]> = {
  hiragana: [
    { group: "base", chars: HIRAGANA_BASE },
    { group: "dakuten", chars: HIRAGANA_DAKUTEN },
    { group: "yoon", chars: HIRAGANA_YOON },
  ],
  katakana: [
    { group: "base", chars: KATAKANA_BASE },
    { group: "dakuten", chars: KATAKANA_DAKUTEN },
    { group: "yoon", chars: KATAKANA_YOON },
  ],
};

export function NetworkView({ progress, excludedIds = [] }: NetworkViewProps) {
  const reduce = useReducedMotion();
  const [script, setScript] = useState<Script>("hiragana");
  const line = lineOf(script);
  const excluded = useMemo(() => new Set(excludedIds), [excludedIds]);

  // Regroupement par rangée, calculé une fois par ligne choisie
  const sectionRows = useMemo(
    () =>
      GROUPS[script].map(({ group, chars }) => ({
        group,
        chars,
        rows: groupRows(chars),
      })),
    [script]
  );

  return (
    <motion.div
      initial={reduce ? false : "hidden"}
      animate="shown"
      variants={boardStagger}
      className="flex flex-col gap-5"
    >
      <motion.header variants={panelEnter} className="flex flex-col gap-1">
        <h1 className="text-xl font-extrabold tracking-tight">Plan du réseau</h1>
        <p className="text-sm text-muted-foreground">
          {ALL_KANA.length} stations sur deux lignes. La couleur indique
          l&apos;état de chacune.
        </p>
      </motion.header>

      {/* ── Sélecteur de ligne ── */}
      <motion.div variants={panelEnter} className="grid grid-cols-2 gap-3" role="group" aria-label="Choix de la ligne">
        {(["hiragana", "katakana"] as Script[]).map((s) => {
          const meta = lineOf(s);
          const active = script === s;
          return (
            <button
              key={s}
              type="button"
              aria-pressed={active}
              onClick={() => setScript(s)}
              className={[
                "overflow-hidden rounded-lg border-2 text-left transition-[opacity,border-color] duration-200 active:scale-[0.98]",
                active
                  ? s === "hiragana" ? "border-line-h" : "border-line-k"
                  : "border-border opacity-60 hover:opacity-90",
              ].join(" ")}
            >
              <span
                className={`flex items-center justify-between px-3.5 py-2 ${active ? BAND_CLS[s] : "bg-secondary text-muted-foreground"}`}
              >
                <span className="text-[11px] font-bold uppercase tracking-[0.12em]">
                  Ligne {meta.code}
                </span>
                <span className="font-kana text-lg leading-none" aria-hidden>{meta.kana}</span>
              </span>
              <span className="flex items-baseline justify-between px-3.5 py-2.5">
                <span className="text-sm font-bold">{meta.name}</span>
                <span className="tnum text-[11px] font-semibold text-muted-foreground">
                  {meta.count} stations
                </span>
              </span>
            </button>
          );
        })}
      </motion.div>

      {/* ── Légende des états ── */}
      <motion.ul
        variants={panelEnter}
        className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-semibold text-muted-foreground"
        aria-label="Légende des états de station"
      >
        {(
          [
            ["new", "nouvelle"],
            ["learning", "en interruption"],
            ["familiar", "en travaux"],
            ["mastered", "maîtrisée"],
          ] as const
        ).map(([level, label]) => (
          <li key={level} className="flex items-center gap-1.5">
            <Roundel level={level} size={9} script={script} />
            {label}
          </li>
        ))}
        {excluded.size > 0 && (
          <li className="flex items-center gap-1.5">
            <span
              className="flex size-[9px] items-center justify-center rounded-[3px] border border-dashed border-muted-foreground bg-muted"
              aria-hidden
            />
            hors service
          </li>
        )}
      </motion.ul>

      {/* ── Sections de la ligne ── */}
      {sectionRows.map(({ group, chars, rows }) => {
        const section = SECTIONS[group];

        return (
          <motion.section
            key={`${script}-${group}`}
            variants={panelEnter}
            aria-label={`${line.name}, ${section.long}`}
            className="sign-panel overflow-hidden"
          >
            <div className={`line-band flex items-baseline justify-between px-4 py-2 ${BAND_CLS[script]}`}>
              <span className="flex items-baseline gap-2.5">
                <span className="text-sm font-extrabold">{section.short}</span>
                <span className="text-[11px] font-bold uppercase tracking-[0.1em] opacity-90">
                  {section.long}
                </span>
              </span>
              <span className="tnum text-[11px] font-bold opacity-90">
                {chars.length} stations
              </span>
            </div>

            <div className="flex flex-col gap-3.5 px-4 py-4">
              {rows.map((row) => (
                <div key={row.key} className="flex items-start gap-2.5">
                  <span
                    className="mt-1 flex w-9 shrink-0 flex-col items-center justify-center rounded-md border border-border bg-secondary/60 py-1"
                    title={`rangée ${row.label}`}
                  >
                    <span className="font-kana text-base font-bold leading-none">{row.first}</span>
                    <span className="text-[9px] font-bold lowercase text-muted-foreground">{row.label}</span>
                  </span>
                  <ul className="flex flex-1 flex-wrap gap-1.5">
                    {row.chars.map((c) => (
                      <StationTile
                        key={c.id}
                        char={c}
                        progress={progress}
                        offService={excluded.has(c.id)}
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.section>
        );
      })}
    </motion.div>
  );
}

// ── Tuile de station ──────────────────────────────────────────────────────────

function StationTile({
  char,
  progress,
  offService = false,
}: {
  char: KanaChar;
  progress: ProgressData;
  offService?: boolean;
}) {
  const state = progress.chars[char.id];
  const level = masteryOf(state);
  const meta = stationStateOf(level);
  const acc = state && state.attempts > 0 ? Math.round((state.correct / state.attempts) * 100) : null;

  return (
    <li
      role="img"
      aria-label={`${char.kana}, ${char.romaji}, ${meta.label}${acc !== null ? `, ${acc} %` : ""}${offService ? ", hors service" : ""}`}
      className={[
        "flex w-[4.25rem] flex-col items-center gap-0.5 rounded-md border-2 bg-card px-1 py-1.5 transition-colors",
        offService
          ? "border-dashed border-border opacity-45"
          : [meta.tileClass || "border-border", meta.ringClass].join(" "),
      ].join(" ")}
    >
      <span className="font-kana text-[1.35rem] font-bold leading-none">{char.kana}</span>
      <span className="tnum text-[10px] font-semibold lowercase leading-none text-muted-foreground">
        {char.romaji}
      </span>
    </li>
  );
}

// ── Regroupement par rangée ───────────────────────────────────────────────────

interface KanaRow {
  key: string;
  first: string;
  label: string;
  chars: KanaChar[];
}

function groupRows(chars: KanaChar[]): KanaRow[] {
  const map = new Map<string, KanaChar[]>();
  for (const c of chars) {
    const list = map.get(c.row) ?? [];
    list.push(c);
    map.set(c.row, list);
  }
  return Array.from(map.entries()).map(([key, list]) => ({
    key,
    first: list[0].kana,
    label: key,
    chars: list,
  }));
}
