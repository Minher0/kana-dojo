"use client";

// ─── Coquille applicative ─────────────────────────────────────────────────────
// Barre de guidage en haut (desktop), barre de quai en bas (mobile),
// bascule de thème jour/nuit, bascule du son, horloge de gare, bouton
// d'installation (tant que l'app n'est pas installée). Pendant une
// session, la navigation s'efface : le quai appartient au train.
// Changer de vue ferme les portes de quai, puis les rouvre.

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { motion, useReducedMotion } from "framer-motion";
import {
  Moon,
  Path,
  ChartBarHorizontal,
  SpeakerHigh,
  SpeakerSlash,
  Train,
  Sun,
} from "@phosphor-icons/react";
import { Roundel } from "./roundel";
import { StationClock } from "./station-clock";
import { RailAmbience } from "./pass-effects";
import { DOOR_CLOSE, DOOR_OPEN } from "./motion";
import { InstallChip } from "@/components/pwa/install-ui";
import { usePwa } from "@/components/pwa/pwa-provider";
import { useSettings, updateSettingsStore } from "@/lib/progress-store";
import { sfx } from "@/lib/sfx";

export type View = "home" | "quiz" | "stats" | "network";

const NAV: { id: View; label: string; icon: typeof Train }[] = [
  { id: "home", label: "Gare", icon: Train },
  { id: "stats", label: "Service", icon: ChartBarHorizontal },
  { id: "network", label: "Réseau", icon: Path },
];

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <motion.button
      type="button"
      onClick={() => {
        sfx.tap();
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
      }}
      aria-label="Basculer entre le thème jour et le thème nuit"
      whileTap={{ scale: 0.96 }}
      className="grid size-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-line-h/50 hover:text-line-h"
    >
      <motion.span
        key={resolvedTheme}
        initial={{ rotate: -110, opacity: 0, scale: 0.6 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        className="grid place-items-center"
      >
        <Moon size={17} weight="bold" className="dark:hidden" aria-hidden />
        <Sun size={17} weight="bold" className="hidden dark:block" aria-hidden />
      </motion.span>
    </motion.button>
  );
}

/** Bascule des effets sonores (carillons, rames, tannoy). */
function SoundToggle() {
  const settings = useSettings();
  const on = settings.soundOn !== false;
  return (
    <motion.button
      type="button"
      onClick={() => {
        const next = !on;
        updateSettingsStore({ soundOn: next });
        sfx.toggle(next);
      }}
      aria-label={on ? "Couper les effets sonores de la gare" : "Activer les effets sonores de la gare"}
      aria-pressed={on}
      whileTap={{ scale: 0.96 }}
      className={[
        "grid size-9 place-items-center rounded-lg border bg-card transition-colors",
        on
          ? "border-border text-muted-foreground hover:border-line-h/50 hover:text-line-h"
          : "border-signal-stop/30 text-signal-stop",
      ].join(" ")}
    >
      {on ? (
        <SpeakerHigh size={17} weight="bold" aria-hidden />
      ) : (
        <SpeakerSlash size={17} weight="bold" aria-hidden />
      )}
    </motion.button>
  );
}

interface ShellProps {
  view: View;
  onNavigate: (view: View) => void;
  /** Session en cours : navigation masquée, focus sur le quiz. */
  focusMode: boolean;
  /** Ligne roulante (pour l'ambiance de rails). */
  line?: "hiragana" | "katakana";
  children: React.ReactNode;
}

export function AppShell({ view, onNavigate, focusMode, line, children }: ShellProps) {
  const reduce = useReducedMotion();
  const [wipe, setWipe] = useState<null | "closing" | "opening">(null);
  const pendingView = useRef<View | null>(null);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      for (const t of timersRef.current) window.clearTimeout(t);
    };
  }, []);

  // ── Navigation : les portes de quai se ferment, la vue change, elles s'ouvrent ──
  const go = (v: View) => {
    if (focusMode || v === view || wipe !== null) return;
    if (reduce) {
      onNavigate(v);
      return;
    }
    sfx.tap();
    sfx.doorQuick();
    pendingView.current = v;
    setWipe("closing");
    timersRef.current.push(
      window.setTimeout(() => {
        if (pendingView.current) onNavigate(pendingView.current);
        pendingView.current = null;
        setWipe("opening");
        timersRef.current.push(
          window.setTimeout(() => setWipe(null), 330)
        );
      }, 250)
    );
  };

  const { canInstall, isIOS, installed, promptInstall } = usePwa();

  const doorHalves = useMemo(
    () => [
      { side: "left" as const, x: wipe === "closing" ? "0%" : "-101%" },
      { side: "right" as const, x: wipe === "closing" ? "0%" : "101%" },
    ],
    [wipe]
  );

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {/* Ambiance : les rails qui défilent pendant le trajet */}
      {focusMode && <RailAmbience script={line ?? "hiragana"} />}

      {/* Barre de guidage */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-2 px-4 sm:gap-3 sm:px-6">
          <button
            type="button"
            onClick={() => go("home")}
            className="flex items-center gap-2.5 rounded-md focus-visible:outline-offset-4"
            aria-label="Kana Dojo, retour à la gare"
          >
            <Roundel level="mastered" size={26} active script="hiragana" />
            <span className="flex flex-col items-start leading-none">
              <span className="text-[15px] font-extrabold tracking-[0.06em]">
                KANA DOJO
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                ひらがな · カタカナ
              </span>
            </span>
          </button>

          {!focusMode && (
            <nav aria-label="Navigation principale" className="hidden items-center gap-1 sm:flex">
              {NAV.map((item) => {
                const active = view === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => go(item.id)}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors",
                      active
                        ? "bg-line-h-soft text-line-h"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground active:scale-[0.97]",
                    ].join(" ")}
                  >
                    <item.icon size={16} weight="bold" aria-hidden />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          )}

          <div className="flex items-center gap-2">
            {focusMode && (
              <span className="hidden rounded-sm bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground sm:block">
                En service
              </span>
            )}
            <StationClock className="hidden md:inline-flex" />
            {!focusMode && (canInstall || isIOS) && !installed && <InstallChip />}
            <SoundToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Zone principale */}
      <main className="relative mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6 sm:px-6 sm:pb-12">
        {children}
      </main>

      {/* Pied de quai */}
      <footer className="mt-auto border-t border-border bg-card">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:px-6">
          <span className="flex items-center gap-2">
            <span className="font-kana text-sm font-bold text-line-h" aria-hidden>五十音</span>
            Kana Dojo, répétition espacée
          </span>
          <span>Progression enregistrée sur cet appareil</span>
        </div>
      </footer>

      {/* Barre de quai mobile */}
      {!focusMode && (
        <nav
          aria-label="Navigation mobile"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm sm:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="grid grid-cols-3">
            {NAV.map((item) => {
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => go(item.id)}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "flex flex-col items-center gap-1 py-2.5 text-[11px] font-bold uppercase tracking-[0.06em] transition-colors",
                    active ? "text-line-h" : "text-muted-foreground",
                  ].join(" ")}
                >
                  <item.icon size={20} weight={active ? "fill" : "bold"} aria-hidden />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Portes de quai : la transition entre les vues */}
      {wipe !== null && (
        <div className="fixed inset-0 z-[60]" aria-hidden>
          {doorHalves.map((half) => (
            <motion.div
              key={half.side}
              className={`quai-door absolute inset-y-0 ${
                half.side === "left" ? "left-0 w-1/2" : "right-0 w-1/2"
              } ${half.side === "left" ? "quai-door-left" : "quai-door-right"}`}
              initial={false}
              animate={{ x: half.x }}
              transition={wipe === "closing" ? DOOR_CLOSE : DOOR_OPEN}
            >
              {/* Poignée de porte, côté couture */}
              <span className="quai-handle" />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
