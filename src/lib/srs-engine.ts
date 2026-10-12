// ─── Moteur SRS : répétition espacée adaptative ──────────────────────────────
// Principe : les caractères ratés reviennent PLUS SOUVENT que les réussis.
// Système de boîtes façon Leitner, avec file de session qui requeue les ratés.

import { KanaChar } from "./kana-data";

// ── Types ────────────────────────────────────────────────────────────────────

export interface CharState {
  box: number;              // 0 (nouveau/faible) → 8 (maîtrisé)
  due: number;              // timestamp de prochaine révision
  attempts: number;         // réponses totales
  correct: number;          // bonnes réponses
  currentStreak: number;    // série en cours
  bestStreak: number;
  lastSeen: number | null;  // dernier timestamp vu
}

export interface DailyLog {
  attempts: number;
  correct: number;
  timeSpentMs: number;
}

export interface ProgressData {
  version: number;
  chars: Record<string, CharState>;
  daily: Record<string, DailyLog>;  // "YYYY-MM-DD" → log
  sessionsCount: number;
  totalAttempts: number;
  totalCorrect: number;
  createdAt: number;
}

// ── Intervalles par boîte ────────────────────────────────────────────────────

export const MIN = 60_000;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;

const BOX_INTERVALS: number[] = [
  0,          // box 0 : requeue dans la session
  10 * MIN,   // box 1 : ~10 min
  1 * HOUR,   // box 2 : 1 h
  6 * HOUR,   // box 3 : 6 h
  1 * DAY,    // box 4 : 1 jour
  3 * DAY,    // box 5 : 3 jours
  7 * DAY,    // box 6 : 1 semaine
  14 * DAY,   // box 7 : 2 semaines
  30 * DAY,   // box 8 : 1 mois
];

export const BOX_COUNT = 9;

export function intervalForBox(box: number): number {
  return BOX_INTERVALS[Math.max(0, Math.min(BOX_COUNT - 1, box))];
}

// ── Niveau de maîtrise (pour stats et UI) ────────────────────────────────────

export type MasteryLevel = "new" | "learning" | "familiar" | "mastered";

export const MASTERY_META: Record<MasteryLevel, { label: string; color: string }> = {
  new: { label: "Nouveau", color: "muted" },
  learning: { label: "En apprentissage", color: "destructive" },
  familiar: { label: "Familier", color: "secondary" },
  mastered: { label: "Maîtrisé", color: "success" },
};

export function masteryOf(state: CharState | undefined): MasteryLevel {
  if (!state || state.attempts === 0) return "new";
  if (state.box >= 6) return "mastered";
  if (state.box >= 3) return "familiar";
  return "learning";
}

// ── Fabriques ────────────────────────────────────────────────────────────────

export function newCharState(): CharState {
  return {
    box: 0,
    due: 0,
    attempts: 0,
    correct: 0,
    currentStreak: 0,
    bestStreak: 0,
    lastSeen: null,
  };
}

export function emptyProgress(): ProgressData {
  return {
    version: 1,
    chars: {},
    daily: {},
    sessionsCount: 0,
    totalAttempts: 0,
    totalCorrect: 0,
    createdAt: Date.now(),
  };
}

// ── Mise à jour après une réponse ────────────────────────────────────────────

export function applyAnswer(
  progress: ProgressData,
  charId: string,
  correct: boolean,
  now = Date.now()
): void {
  const state = progress.chars[charId] ?? newCharState();

  state.attempts += 1;
  state.lastSeen = now;
  progress.totalAttempts += 1;

  if (correct) {
    state.correct += 1;
    state.currentStreak += 1;
    state.bestStreak = Math.max(state.bestStreak, state.currentStreak);
    // Montée de boîte : rapide au début, plus exigeante ensuite
    const jump = state.box < 3 ? 1 : 1;
    state.box = Math.min(BOX_COUNT - 1, state.box + jump);
    state.due = now + intervalForBox(state.box);
    progress.totalCorrect += 1;
  } else {
    state.currentStreak = 0;
    // Chute sévère : un raté envoie en bas de la pile
    state.box = state.box <= 2 ? 0 : Math.max(0, state.box - 3);
    state.due = now; // immédiatement re-dû
  }

  progress.chars[charId] = state;

  // Journal quotidien
  const key = todayKey(now);
  const log = progress.daily[key] ?? { attempts: 0, correct: 0, timeSpentMs: 0 };
  log.attempts += 1;
  if (correct) log.correct += 1;
  progress.daily[key] = log;
}

export function todayKey(now = Date.now()): string {
  const d = new Date(now);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ── Sélection pondérée pour la session ───────────────────────────────────────
// Poids élevé = revient souvent. Les ratés (boîte basse, accuracy faible,
// échéance dépassée) pèsent lourd ; les maîtrisés pèsent presque rien.

export function weightOf(char: KanaChar, state: CharState | undefined, now = Date.now()): number {
  if (!state || state.attempts === 0) {
    return 3; // nouveaux : introduits régulièrement
  }
  const accuracy = state.correct / state.attempts;

  // Base décroissante avec la boîte : boîte 0 → 12, boîte 8 → 0.2
  const boxWeight = 12 * Math.pow(0.65, state.box);

  // Les caractères mal réussis pèsent plus
  const weakness = 1 + (1 - accuracy) * 9;

  // Bonus si l'échéance est dépassée (due)
  const overdue = state.due <= now ? 1.6 : 0.8;

  // Malus si vu très récemment (évite le même caractère 2× de suite)
  const recent = state.lastSeen && now - state.lastSeen < 2 * MIN ? 0.35 : 1;

  return Math.max(0.15, boxWeight * weakness * overdue * recent);
}

export interface QueueItem {
  char: KanaChar;
  weight: number;
}

export function buildQueue(
  pool: KanaChar[],
  progress: ProgressData,
  size: number,
  now = Date.now()
): KanaChar[] {
  if (pool.length === 0) return [];
  const target = Math.min(size, pool.length);

  const items: QueueItem[] = pool.map((c) => ({
    char: c,
    weight: weightOf(c, progress.chars[c.id], now),
  }));

  // Tirage pondéré sans remise : les ratés (poids fort) sortent plus souvent
  const queue: KanaChar[] = [];
  const picked = new Set<string>();

  while (queue.length < target && picked.size < items.length) {
    const remaining = items.filter((it) => !picked.has(it.char.id));
    const total = remaining.reduce((s, it) => s + it.weight, 0);
    let r = Math.random() * total;
    let chosen = remaining[0];
    for (const it of remaining) {
      r -= it.weight;
      if (r <= 0) { chosen = it; break; }
    }
    queue.push(chosen.char);
    picked.add(chosen.char.id);
  }

  return queue;
}

// ── Stats globales ───────────────────────────────────────────────────────────

export interface GlobalStats {
  totalAttempts: number;
  totalCorrect: number;
  accuracy: number;
  seenChars: number;
  mastered: number;
  familiar: number;
  learning: number;
  unseen: number;
  dayStreak: number;
  todayAttempts: number;
  todayAccuracy: number;
  sessionsCount: number;
  avgAccuracyLast7: number | null;
}

export function computeGlobalStats(pool: KanaChar[], progress: ProgressData, now = Date.now()): GlobalStats {
  let seen = 0, mastered = 0, familiar = 0, learning = 0;
  const poolIds = new Set(pool.map((c) => c.id));

  for (const id of poolIds) {
    const state = progress.chars[id];
    const m = masteryOf(state);
    if (m === "new") continue;
    seen += 1;
    if (m === "mastered") mastered += 1;
    else if (m === "familiar") familiar += 1;
    else learning += 1;
  }

  const today = progress.daily[todayKey(now)];
  const streak = computeDayStreak(progress.daily, now);

  // Précision moyenne des 7 derniers jours actifs
  const dayKeys = Object.keys(progress.daily).sort().slice(-7);
  let attempts7 = 0, correct7 = 0;
  for (const k of dayKeys) {
    attempts7 += progress.daily[k].attempts;
    correct7 += progress.daily[k].correct;
  }

  return {
    totalAttempts: progress.totalAttempts,
    totalCorrect: progress.totalCorrect,
    accuracy: progress.totalAttempts > 0 ? progress.totalCorrect / progress.totalAttempts : 0,
    seenChars: seen,
    mastered,
    familiar,
    learning,
    unseen: poolIds.size - seen,
    dayStreak: streak,
    todayAttempts: today?.attempts ?? 0,
    todayAccuracy: today && today.attempts > 0 ? today.correct / today.attempts : 0,
    sessionsCount: progress.sessionsCount,
    avgAccuracyLast7: attempts7 > 0 ? correct7 / attempts7 : null,
  };
}

export function computeDayStreak(daily: Record<string, DailyLog>, now = Date.now()): number {
  // Série de jours consécutifs avec au moins 1 tentative
  let streak = 0;
  let cursor = new Date(now);
  // Aujourd'hui compte s'il a de l'activité ; sinon on part d'hier
  for (let i = 0; i < 400; i++) {
    const key = todayKey(cursor.getTime());
    const log = daily[key];
    if (log && log.attempts > 0) {
      streak += 1;
    } else if (i === 0) {
      // aujourd'hui sans activité : on regarde hier sans casser
    } else {
      break;
    }
    cursor = new Date(cursor.getTime() - DAY);
  }
  return streak;
}
