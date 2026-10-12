// ─── Moteur de session : génère les questions, requeue les ratés ──────────────

import { KanaChar, KANA_BY_ID } from "./kana-data";
import { ProgressData, buildQueue } from "./srs-engine";

export type Direction = "kana2romaji" | "romaji2kana";
/** Mode de réponse : choix multiples, saisie clavier, ou les deux à la fois. */
export type QuizMode = "choice" | "typing" | "mix";

export interface SessionQuestion {
  char: KanaChar;
  direction: Direction;
  mode: QuizMode;
  options: KanaChar[]; // 4 options (mode choix) — index 0 = bonne réponse
}

export interface SessionResult {
  targetSize: number;
  uniqueAnswered: number;
  firstTryCorrect: number;
  attempts: number;
  timeMs: number;
  mistakes: { char: KanaChar; timesMissed: number; redeemed: boolean }[];
}

export interface SessionState {
  pool: KanaChar[];
  direction: Direction;
  mixed: boolean;
  mode: QuizMode;
  sessionSize: number;
  queue: string[];          // charIds à venir
  requeueAfter: { charId: string; atStep: number }[];
  step: number;             // questions présentées
  askedIds: Set<string>;    // répondus correctement (première passe ou rattrapage)
  firstTryCorrect: number;
  attempts: number;
  mistakes: Map<string, number>;
  redeemed: Set<string>;
  startedAt: number;
  finished: boolean;
  current: SessionQuestion | null;
}

// ── Distracteurs ─────────────────────────────────────────────────────────────
// On pioche des caractères proches : même script, même groupe si possible,
// avec une préférence pour la même voyelle ou la même consonne initiale.

function pickDistractors(target: KanaChar, pool: KanaChar[], count: number): KanaChar[] {
  const candidates = pool.filter((c) => c.id !== target.id && c.kana !== target.kana);
  if (candidates.length === 0) return [];

  const score = (c: KanaChar): number => {
    let s = 1;
    if (c.script === target.script) s += 2;
    if (c.group === target.group) s += 1.5;
    if (c.romaji[0] === target.romaji[0]) s += 1.2;       // même consonne
    if (c.romaji.at(-1) === target.romaji.at(-1)) s += 1.2; // même voyelle
    if (c.romaji.length === target.romaji.length) s += 0.6;
    return s;
  };

  const scored = candidates.map((c) => ({ c, s: score(c) }));
  const chosen: KanaChar[] = [];
  const used = new Set<string>();
  for (let i = 0; i < count && scored.length > 0; i++) {
    const remaining = scored.filter((x) => !used.has(x.c.id));
    if (remaining.length === 0) break;
    const total = remaining.reduce((acc, x) => acc + x.s, 0);
    let r = Math.random() * total;
    let pick = remaining[0];
    for (const x of remaining) {
      r -= x.s;
      if (r <= 0) { pick = x; break; }
    }
    chosen.push(pick.c);
    used.add(pick.c.id);
  }
  return chosen;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Cycle de direction : alterner pour ne pas habituer ──────────────────────

function nextDirection(base: Direction, step: number, forceMixed: boolean): Direction {
  if (!forceMixed) return base;
  // ~60% kana→romaji, 40% romaji→kana, avec alternance pseudo-régulière
  return (step % 5 === 3 || step % 5 === 4) ? "romaji2kana" : "kana2romaji";
}

// ── Session ──────────────────────────────────────────────────────────────────

export function createSession(
  pool: KanaChar[],
  progress: ProgressData,
  opts: {
    sessionSize: number;
    direction: Direction | "mixed";
    mode: QuizMode;
  }
): SessionState {
  const baseDirection: Direction = opts.direction === "mixed" ? "kana2romaji" : opts.direction;
  const size = Math.min(opts.sessionSize, pool.length);
  const queue = buildQueue(pool, progress, size);

  const state: SessionState = {
    pool,
    direction: baseDirection,
    mixed: opts.direction === "mixed",
    mode: opts.mode,
    sessionSize: size,
    queue: queue.map((c) => c.id),
    requeueAfter: [],
    step: 0,
    askedIds: new Set(),
    firstTryCorrect: 0,
    attempts: 0,
    mistakes: new Map(),
    redeemed: new Set(),
    startedAt: Date.now(),
    finished: false,
    current: null,
  };

  state.current = buildQuestion(state, 0);
  return state;
}

function buildQuestion(state: SessionState, stepOffset: number): SessionQuestion | null {
  // 1. Les requeues arrivés à échéance passent en priorité
  const dueRequeues = state.requeueAfter.filter((r) => r.atStep <= state.step + stepOffset);
  let charId: string | undefined;

  if (dueRequeues.length > 0 && Math.random() < 0.85) {
    charId = dueRequeues[0].charId;
    state.requeueAfter = state.requeueAfter.filter((r) => r.charId !== charId);
  }

  // 2. Sinon on tire depuis la file
  if (!charId) {
    charId = state.queue.shift();
    if (!charId && state.requeueAfter.length > 0) {
      // file vide mais des requeues restent : on attend le plus tôt
      charId = state.requeueAfter
        .slice()
        .sort((a, b) => a.atStep - b.atStep)[0].charId;
      state.requeueAfter = state.requeueAfter.filter((r) => r.charId !== charId);
    }
  }

  if (!charId) return null;
  const char = KANA_BY_ID.get(charId);
  if (!char) return null;

  const dir: Direction = state.mixed
    ? nextDirection(state.direction, state.step + stepOffset, true)
    : state.direction;

  const options = shuffle([char, ...pickDistractors(char, state.pool, 3)]);

  // Mode « mix » : la question porte le mode tel quel — la vue de quiz
  // affiche alors les portes de quai ET le billet de saisie simultanément.
  return { char, direction: dir, mode: state.mode, options };
}

export function answerCurrent(
  state: SessionState,
  answer: string
): { correct: boolean; expected: string; charId: string } {
  if (!state.current) throw new Error("Aucune question en cours");
  const q = state.current;
  const char = q.char;

  const expected = q.direction === "kana2romaji" ? char.romaji : char.kana;
  const correct = checkAnswer(answer, q);

  state.attempts += 1;

  if (correct) {
    const wasMistaken = state.mistakes.has(char.id);
    if (wasMistaken) state.redeemed.add(char.id);
    if (!state.askedIds.has(char.id)) {
      state.askedIds.add(char.id);
      if (!wasMistaken) state.firstTryCorrect += 1;
    }
  } else {
    const misses = state.mistakes.get(char.id) ?? 0;
    state.mistakes.set(char.id, misses + 1);
    // Requeue : le raté revient après ~3 questions (un peu de marge pour mémoriser)
    state.requeueAfter.push({ charId: char.id, atStep: state.step + 3 });
  }

  return { correct, expected, charId: char.id };
}

function checkAnswer(answer: string, q: SessionQuestion): boolean {
  const char = q.char;
  const normalized = answer.trim().toLowerCase();
  if (q.direction === "romaji2kana") {
    return normalized === char.kana;
  }
  if (normalized === char.romaji) return true;
  return (char.altRomaji ?? []).some((alt) => normalized === alt);
}

export function advance(state: SessionState): SessionState {
  state.step += 1;

  // Terminé ? : assez d'uniques répondus + plus rien en attente
  const doneUniques = state.askedIds.size >= state.sessionSize;
  const doneRequeue = state.requeueAfter.length === 0 && state.queue.length === 0;

  if (doneUniques || doneRequeue) {
    state.finished = true;
    state.current = null;
    return state;
  }

  state.current = buildQuestion(state, 0);
  if (!state.current) {
    state.finished = true;
  }
  return state;
}

export function getSessionResult(state: SessionState): SessionResult {
  const mistakes = Array.from(state.mistakes.entries()).map(([id, timesMissed]) => {
    const char = KANA_BY_ID.get(id)!;
    return { char, timesMissed, redeemed: state.redeemed.has(id) };
  });
  return {
    targetSize: state.sessionSize,
    uniqueAnswered: state.askedIds.size,
    firstTryCorrect: state.firstTryCorrect,
    attempts: state.attempts,
    timeMs: Date.now() - state.startedAt,
    mistakes,
  };
}

export function currentProgressPercent(state: SessionState): number {
  if (state.sessionSize === 0) return 0;
  return Math.min(100, Math.round((state.askedIds.size / state.sessionSize) * 100));
}
