"use client";

// ─── Coquille applicative ─────────────────────────────────────────────────────
// Barre de guidage en haut (desktop), barre de quai en bas (mobile),
// bascule de thème jour/nuit. Pendant une session, la navigation s'efface :
// le quai appartient au train.

import { useTheme } from "next-themes";
import {
  Moon,
  Path,
  ChartBarHorizontal,
  Train,
  Sun,
} from "@phosphor-icons/react";
import { Roundel } from "./roundel";

export type View = "home" | "quiz" | "stats" | "network";

const NAV: { id: View; label: string; icon: typeof Train }[] = [
  { id: "home", label: "Gare", icon: Train },
  { id: "stats", label: "Service", icon: ChartBarHorizontal },
  { id: "network", label: "Réseau", icon: Path },
];

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Basculer entre le thème jour et le thème nuit"
      className="grid size-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-line-h/50 hover:text-line-h active:scale-[0.96]"
    >
      <Moon size={17} weight="bold" className="dark:hidden" aria-hidden />
      <Sun size={17} weight="bold" className="hidden dark:block" aria-hidden />
    </button>
  );
}

interface ShellProps {
  view: View;
  onNavigate: (view: View) => void;
  /** Session en cours : navigation masquée, focus sur le quiz. */
  focusMode: boolean;
  children: React.ReactNode;
}

export function AppShell({ view, onNavigate, focusMode, children }: ShellProps) {
  const go = (v: View) => {
    if (!focusMode) onNavigate(v);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {/* Barre de guidage */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
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
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Zone principale */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6 sm:px-6 sm:pb-12">
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
    </div>
  );
}
