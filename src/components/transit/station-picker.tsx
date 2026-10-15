"use client";

// ─── Feuille de service : sélection fine des stations ────────────────────────
// Chaque kana est une station que l'on met en service ou hors service.
// Tout est coché par défaut ; on décoche ce qu'on ne veut pas (encore)
// étudier. L'état vit dans les réglages (kanaExclusions) : il survit aux
// trajets et aux rechargements. Les puces Lignes/Sections du planificateur
// restent des filtres de haut niveau : le pool final est l'intersection.

import { useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ListChecks, X } from "@phosphor-icons/react";
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
import { SECTIONS, lineOf } from "./tokens";
import { Settings } from "@/lib/progress-store";
import { sfx } from "@/lib/sfx";

interface StationPickerProps {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
}

type Script = "hiragana" | "katakana";

const LINES: Record<Script, { group: KanaGroup; chars: KanaChar[] }[]> = {
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

const BAND_CLS: Record<Script, string> = {
  hiragana: "bg-line-h text-line-h-foreground",
  katakana: "bg-line-k text-line-k-foreground",
};

export function StationPicker({ open, onClose, settings, updateSettings }: StationPickerProps) {
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

  const excluded = useMemo(
    () => new Set(settings.kanaExclusions ?? []),
    [settings.kanaExclusions]
  );

  // Échap ferme la feuille ; le fond de page ne défile plus derrière.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const setExclusions = (next: Set<string>) => {
    updateSettings({ kanaExclusions: Array.from(next) });
  };

  const toggleStation = (id: string) => {
    sfx.tap();
    const next = new Set(excluded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExclusions(next);
  };

  const setStations = (ids: string[], checked: boolean) => {
    sfx.tap();
    const next = new Set(excluded);
    for (const id of ids) {
      if (checked) next.delete(id);
      else next.add(id);
    }
    setExclusions(next);
  };

  const activeOf = (chars: KanaChar[]) =>
    chars.reduce((acc, c) => acc + (excluded.has(c.id) ? 0 : 1), 0);

  const activeAll = ALL_KANA.length - excluded.size;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
          <motion.button
            type="button"
            aria-label="Fermer la feuille de service"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-foreground/45 backdrop-blur-[2px]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="kd-picker-title"
            initial={reduce ? false : { y: 96, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { y: 96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border-2 border-border bg-card sm:mx-3 sm:mb-3 sm:rounded-2xl"
            style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom))" }}
          >
            {/* ── En-tête : titre, compteur, actions globales ── */}
            <div className="line-band flex items-center justify-between bg-line-h px-5 py-3 text-line-h-foreground">
              <span className="flex items-center gap-2.5">
                <ListChecks size={18} weight="bold" aria-hidden />
                <span id="kd-picker-title" className="text-sm font-extrabold uppercase tracking-[0.1em]">
                  Feuille de service
                </span>
              </span>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="flex size-7 items-center justify-center rounded-md bg-black/20 transition-colors hover:bg-black/30 active:scale-95"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
              <p className="text-sm text-muted-foreground">
                Cochez les stations à étudier.{" "}
                <span className="tnum font-bold text-foreground">
                  {activeAll}/{ALL_KANA.length}
                </span>{" "}
                en service.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStations(ALL_KANA.map((c) => c.id), true)}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-bold transition-colors hover:border-line-h/60 hover:text-line-h active:scale-[0.97]"
                >
                  Tout cocher
                </button>
                <button
                  type="button"
                  onClick={() => setStations(ALL_KANA.map((c) => c.id), false)}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-bold transition-colors hover:border-signal-stop/60 hover:text-signal-stop active:scale-[0.97]"
                >
                  Tout décocher
                </button>
              </div>
            </div>

            {/* ── Corps : les deux lignes, section par section ── */}
            <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
              {(["hiragana", "katakana"] as Script[]).map((script) => {
                const line = lineOf(script);
                const lineChars = LINES[script].flatMap((s) => s.chars);
                const lineActive = activeOf(lineChars);
                return (
                  <section
                    key={script}
                    aria-label={`Ligne ${line.code} ${line.name}`}
                    className="flex flex-col gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => setStations(lineChars.map((c) => c.id), lineActive !== lineChars.length)}
                      className="flex items-center justify-between gap-3 rounded-lg border-2 px-3.5 py-2 text-left transition-colors active:scale-[0.99]"
                      style={{ borderColor: `var(--line-${script === "hiragana" ? "h" : "k"})` }}
                    >
                      <span className="flex items-baseline gap-2.5">
                        <span className={`rounded-sm px-1.5 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.1em] ${BAND_CLS[script]}`}>
                          {line.code}
                        </span>
                        <span className="text-sm font-bold">{line.name}</span>
                        <span className="font-kana text-base leading-none text-muted-foreground" aria-hidden>
                          {line.kana}
                        </span>
                      </span>
                      <span className="tnum text-xs font-bold text-muted-foreground">
                        {lineActive}/{lineChars.length}
                      </span>
                    </button>

                    {LINES[script].map(({ group, chars }) => {
                      const section = SECTIONS[group];
                      const sectionActive = activeOf(chars);
                      return (
                        <div key={`${script}-${group}`} className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => setStations(chars.map((c) => c.id), sectionActive !== chars.length)}
                            className="flex items-center justify-between gap-3 rounded-md border border-border bg-secondary/50 px-3 py-1.5 text-left transition-colors hover:border-muted-foreground/40"
                          >
                            <span className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                              {section.short}
                              <span className="ml-2 font-semibold normal-case tracking-normal opacity-80">
                                {section.long}
                              </span>
                            </span>
                            <span className="tnum text-[11px] font-bold text-muted-foreground">
                              {sectionActive}/{chars.length}
                            </span>
                          </button>

                          <div className="flex flex-wrap gap-1.5 pl-1">
                            {chars.map((c) => (
                              <StationCheck
                                key={c.id}
                                char={c}
                                checked={!excluded.has(c.id)}
                                onToggle={() => toggleStation(c.id)}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </section>
                );
              })}
            </div>

            {/* ── Pied : retour au planificateur ── */}
            <div className="border-t border-border px-5 py-3.5">
              <button
                type="button"
                onClick={() => {
                  sfx.doors();
                  onClose();
                }}
                className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg bg-line-h text-sm font-extrabold uppercase tracking-[0.1em] text-line-h-foreground transition-[filter] duration-200 hover:brightness-110 active:scale-[0.98]"
              >
                <ListChecks size={17} weight="bold" aria-hidden />
                Terminé
              </button>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                Les stations hors service ne reçoivent plus de train.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ── Tuile cochable : une station en service ou hors service ─────────────────

function StationCheck({
  char,
  checked,
  onToggle,
}: {
  char: KanaChar;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={`${char.kana} ${char.romaji}${checked ? "" : ", hors service"}`}
      onClick={onToggle}
      className={[
        "flex w-[4.25rem] flex-col items-center gap-0.5 rounded-md border-2 bg-card px-1 py-1.5 transition-[opacity,border-color,background-color] duration-150 active:scale-[0.95]",
        checked
          ? char.script === "hiragana"
            ? "border-line-h/60 hover:border-line-h"
            : "border-line-k/60 hover:border-line-k"
          : "border-dashed border-border opacity-45 hover:opacity-70",
      ].join(" ")}
    >
      <span className="font-kana text-[1.35rem] font-bold leading-none">{char.kana}</span>
      <span className="tnum text-[10px] font-semibold lowercase leading-none text-muted-foreground">
        {char.romaji}
      </span>
    </button>
  );
}
