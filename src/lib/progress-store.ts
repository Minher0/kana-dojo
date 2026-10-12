"use client";

// ─── Persistance : localStorage + store externe React ────────────────────────
// Pattern useSyncExternalStore : sûr pour l'hydratation SSR, conforme aux
// règles react-hooks (pas de setState dans les effets).

import { useCallback, useSyncExternalStore } from "react";
import {
  ProgressData,
  emptyProgress,
  CharState,
  newCharState,
} from "./srs-engine";

const STORAGE_KEY = "kana-dojo-progress-v1";
const SETTINGS_KEY = "kana-dojo-settings-v1";

export interface Settings {
  scripts: ("hiragana" | "katakana")[];
  groups: ("base" | "dakuten" | "yoon")[];
  sessionSize: number;
  direction: "kana2romaji" | "romaji2kana" | "mixed";
  mode: "choice" | "typing";
}

export const DEFAULT_SETTINGS: Settings = {
  scripts: ["hiragana"],
  groups: ["base"],
  sessionSize: 10,
  direction: "kana2romaji",
  mode: "choice",
};

// ── Chargement / sauvegarde bruts ────────────────────────────────────────────

function loadProgressRaw(): ProgressData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const data = JSON.parse(raw) as ProgressData;
    if (!data || typeof data !== "object" || !data.chars) return emptyProgress();
    // Auto-réparation : les totaux sont recalculés depuis les états individuels
    let sumAttempts = 0;
    let sumCorrect = 0;
    for (const s of Object.values(data.chars)) {
      if (s && typeof s.attempts === "number") sumAttempts += s.attempts;
      if (s && typeof s.correct === "number") sumCorrect += s.correct;
    }
    return {
      version: 1,
      chars: data.chars ?? {},
      daily: data.daily ?? {},
      sessionsCount: data.sessionsCount ?? 0,
      totalAttempts: sumAttempts,
      totalCorrect: sumCorrect,
      createdAt: data.createdAt ?? Date.now(),
    };
  } catch {
    return emptyProgress();
  }
}

function saveProgressRaw(progress: ProgressData): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // quota dépassé ou navigation privée : on ignore
  }
}

function loadSettingsRaw(): Settings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettingsRaw(settings: Settings): void {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function resetAll(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(SETTINGS_KEY);
  } catch {
    // ignore
  }
  progressCache = null;
  settingsCache = null;
  emitProgress();
  emitSettings();
}

// ── Store « progress » ───────────────────────────────────────────────────────

let progressCache: ProgressData | null = null;
const EMPTY_PROGRESS = emptyProgress();
const progressListeners = new Set<() => void>();

function getProgressSnapshot(): ProgressData {
  if (progressCache === null) progressCache = loadProgressRaw();
  return progressCache;
}

function getProgressServerSnapshot(): ProgressData {
  return EMPTY_PROGRESS;
}

function emitProgress(): void {
  for (const listener of progressListeners) listener();
}

function subscribeProgress(listener: () => void): () => void {
  progressListeners.add(listener);
  return () => progressListeners.delete(listener);
}

/** Applique une mutation (clone superficiel puis mutateur) et notifie. */
export function updateProgress(mutator: (p: ProgressData) => void): void {
  if (progressCache === null) getProgressSnapshot();
  const next: ProgressData = {
    ...(progressCache as ProgressData),
    chars: { ...(progressCache as ProgressData).chars },
    daily: { ...(progressCache as ProgressData).daily },
  };
  mutator(next);
  progressCache = next;
  saveProgressRaw(next);
  emitProgress();
}

export function useProgress(): ProgressData {
  return useSyncExternalStore(
    subscribeProgress,
    getProgressSnapshot,
    getProgressServerSnapshot
  );
}

// ── Store « settings » ───────────────────────────────────────────────────────

let settingsCache: Settings | null = null;
const DEFAULTS_SNAPSHOT = { ...DEFAULT_SETTINGS };
const settingsListeners = new Set<() => void>();

function getSettingsSnapshot(): Settings {
  if (settingsCache === null) settingsCache = loadSettingsRaw();
  return settingsCache;
}

function getSettingsServerSnapshot(): Settings {
  return DEFAULTS_SNAPSHOT;
}

function emitSettings(): void {
  for (const listener of settingsListeners) listener();
}

function subscribeSettings(listener: () => void): () => void {
  settingsListeners.add(listener);
  return () => settingsListeners.delete(listener);
}

export function updateSettingsStore(patch: Partial<Settings>): void {
  if (settingsCache === null) getSettingsSnapshot();
  const next = { ...(settingsCache as Settings), ...patch };
  settingsCache = next;
  saveSettingsRaw(next);
  emitSettings();
}

export function useSettings(): Settings {
  return useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getSettingsServerSnapshot
  );
}

/** Écrit les réglages actuels en localStorage (utile au premier lancement). */
export function persistSettingsOnce(): void {
  if (settingsCache === null) getSettingsSnapshot();
}

// ── Utilitaires d'état ───────────────────────────────────────────────────────

export function getCharState(progress: ProgressData, id: string): CharState {
  return progress.chars[id] ?? newCharState();
}
