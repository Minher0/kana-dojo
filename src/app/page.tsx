"use client";

// ─── Kana Dojo : orchestration des vues ───────────────────────────────────────
// Gare (accueil) / Trajet (quiz) / Service (stats) / Réseau (plan).
// Le moteur SRS et le magasin de progression restent la vérité produit.

import { useCallback, useMemo, useState, useReducer } from "react";
import {
  useProgress,
  useSettings,
  updateProgress,
  updateSettingsStore,
  type Settings,
} from "@/lib/progress-store";
import { ALL_KANA, KanaChar } from "@/lib/kana-data";
import { createSession, SessionState } from "@/lib/session-engine";
import { AppShell, type View } from "@/components/transit/app-shell";
import { HomeView } from "@/components/transit/home-view";
import { QuizView } from "@/components/transit/quiz-view";
import { StatsView } from "@/components/transit/stats-view";
import { NetworkView } from "@/components/transit/network-view";

export default function Page() {
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
    <AppShell
      view={view}
      onNavigate={setView}
      focusMode={view === "quiz" && session !== null && !session.finished}
    >
      {view === "home" && (
        <HomeView
          pool={pool}
          progress={progress}
          settings={settings}
          updateSettings={updateSettings}
          onStart={launchSession}
          onOpenNetwork={() => setView("network")}
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
        <StatsView pool={pool} progress={progress} onStart={launchSession} />
      )}

      {view === "network" && <NetworkView progress={progress} />}
    </AppShell>
  );
}
