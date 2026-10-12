"use client";

import { useCallback, useMemo, useState, useReducer } from "react";
import {
  useProgress, useSettings, updateProgress, updateSettingsStore, type Settings,
} from "@/lib/progress-store";
import { ALL_KANA, KanaChar } from "@/lib/kana-data";
import { createSession, SessionState } from "@/lib/session-engine";
import { Header } from "@/components/kana/header";
import { Dashboard } from "@/components/kana/dashboard";
import { QuizView } from "@/components/kana/quiz-view";
import { StatsView } from "@/components/kana/stats-view";
import { TablesView } from "@/components/kana/tables-view";

export type View = "home" | "quiz" | "stats" | "tables";

export default function Home() {
  const progress = useProgress();
  const settings = useSettings();
  const [view, setView] = useState<View>("home");
  const [session, setSession] = useState<SessionState | null>(null);
  const [, bumpSession] = useReducer((x: number) => x + 1, 0);

  const pool = useMemo<KanaChar[]>(() => {
    return ALL_KANA.filter(
      (k) => settings.scripts.includes(k.script) && settings.groups.includes(k.group)
    );
  }, [settings]);

  const launchSession = useCallback(() => {
    if (pool.length === 0) return;
    setSession(
      createSession(pool, progress, {
        sessionSize: settings.sessionSize,
        direction: settings.direction,
        mode: settings.mode,
      })
    );
    bumpSession();
    setView("quiz");
  }, [pool, progress, settings]);

  const endSession = useCallback(() => {
    setSession(null);
    setView("home");
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    updateSettingsStore(patch);
  }, []);

  return (
    <main className="min-h-screen flex flex-col">
      <Header view={view} setView={setView} activeSession={session !== null} />

      <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pb-10">
        {view === "home" && (
          <Dashboard
            pool={pool}
            progress={progress}
            settings={settings}
            updateSettings={updateSettings}
            onStart={launchSession}
          />
        )}

        {view === "quiz" && (
          <QuizView
            session={session}
            update={(mutator) => updateProgress(mutator)}
            bump={bumpSession}
            onExit={endSession}
            onRestart={launchSession}
          />
        )}

        {view === "stats" && (
          <StatsView pool={pool} progress={progress} />
        )}

        {view === "tables" && <TablesView progress={progress} />}
      </div>

      <footer className="mt-auto border-t border-border/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="font-kana text-sm text-primary">五十音</span>
            Kana Dojo — répétition espacée
          </span>
          <span>Progression sauvegardée localement</span>
        </div>
      </footer>
    </main>
  );
}
