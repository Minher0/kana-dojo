"use client";

// ─── Moteur sonore : les voix de la gare ─────────────────────────────────────
// Tout est synthétisé en Web Audio API : aucun fichier audio, aucune requête.
// Le timbre cherche la vérité du monde : carillons de quai, mélodie de départ
// (発車メロディー), avertisseur de portes, tannoy. Le buzzer d'erreur reste
// doux — une gare ne hurle jamais sur ses voyageurs.
//
// Politique d'autoplay : l'AudioContext naît au premier geste (click/touche).
// Le réglage (activation + volume) vit dans les Settings persistés.

import { getSettingsSnapshot } from "./progress-store";

// ── Contexte audio (paresseux, réveillé au premier geste) ───────────────────

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let unlocked = false;

type WindowWithWebkit = Window & {
  webkitAudioContext?: typeof AudioContext;
};

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const w = window as WindowWithWebkit;
  const Ctor = window.AudioContext ?? w.webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  // Chaîne maître : gain → compresseur (colle les voix, évite le clipping)
  master = ctx.createGain();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.knee.value = 12;
  comp.ratio.value = 6;
  master.connect(comp);
  comp.connect(ctx.destination);
  return ctx;
}

/** Réveille le contexte au premier geste utilisateur (politique autoplay). */
export function unlockAudio(): void {
  if (unlocked) return;
  const c = ensureCtx();
  if (!c) return;
  unlocked = true;
  if (c.state === "suspended") void c.resume();
  attachResumeListeners();
}

function attachResumeListeners(): void {
  const resume = () => {
    if (ctx && ctx.state === "suspended") void ctx.resume();
  };
  window.addEventListener("pointerdown", resume, { passive: true });
  window.addEventListener("keydown", resume, { passive: true });
}

function isOn(): boolean {
  try {
    return getSettingsSnapshot().soundOn !== false;
  } catch {
    return false;
  }
}

function masterGain(): number {
  try {
    const v = getSettingsSnapshot().soundVolume;
    return typeof v === "number" && v >= 0 && v <= 1 ? v : 0.7;
  } catch {
    return 0.7;
  }
}

// ── Briques de synthèse ─────────────────────────────────────────────────────

interface BellOptions {
  freq: number;
  at?: number;          // décalage temporel (s) depuis maintenant
  dur?: number;         // durée de résonance (s)
  gain?: number;        // vélocité 0-1
  partial?: number;     // rapport du partiel inharmonique
  partialGain?: number;
}

/** Cloche de quai : fondamentale + partiel inharmonique, décroissance exponentielle. */
function bell({ freq, at = 0, dur = 0.9, gain = 0.5, partial = 2.76, partialGain = 0.24 }: BellOptions): void {
  const c = ensureCtx();
  if (!c || !master) return;
  const t0 = c.currentTime + at;
  const masterRef = master;
  masterRef.gain.value = masterGain();

  for (const [f, g] of [
    [freq, gain],
    [freq * partial, gain * partialGain],
  ] as const) {
    const osc = c.createOscillator();
    const env = c.createGain();
    osc.type = "sine";
    osc.frequency.value = f;
    // Départ doux : les vraies cloches n'attaquent pas en créneau
    env.gain.setValueAtTime(0, t0);
    env.gain.linearRampToValueAtTime(g, t0 + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0004, t0 + dur);
    osc.connect(env);
    env.connect(masterRef);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }
}

interface NoteOptions {
  freq: number;
  at?: number;
  dur?: number;
  gain?: number;
  /** Timbre du haut-parleur de quai : triangle adouci + souffle léger. */
  voice?: "melody" | "bass";
}

/** Voix de mélodie (haut-parleur de quai) : triangle filtré, enveloppe carrée douce. */
function note({ freq, at = 0, dur = 0.22, gain = 0.34, voice = "melody" }: NoteOptions): void {
  const c = ensureCtx();
  if (!c || !master) return;
  const t0 = c.currentTime + at;
  master.gain.value = masterGain();

  const osc = c.createOscillator();
  const osc2 = c.createOscillator();
  const env = c.createGain();
  const lp = c.createBiquadFilter();

  osc.type = "triangle";
  osc2.type = "triangle";
  osc.frequency.value = freq;
  // Léger désaccord façon chœur : deux oscillateurs à ±4 cents
  osc2.frequency.value = freq * 1.0023;

  lp.type = "lowpass";
  lp.frequency.value = voice === "bass" ? 900 : 3400;
  lp.Q.value = 0.4;

  const attack = voice === "bass" ? 0.012 : 0.02;
  env.gain.setValueAtTime(0, t0);
  env.gain.linearRampToValueAtTime(gain, t0 + attack);
  env.gain.setValueAtTime(gain, t0 + dur * 0.7);
  env.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);

  osc.connect(lp);
  osc2.connect(lp);
  lp.connect(env);
  env.connect(master);
  osc.start(t0);
  osc2.start(t0);
  osc.stop(t0 + dur + 0.05);
  osc2.stop(t0 + dur + 0.05);
}

/** Buzzeur doux (avertissement, pas une punition). */
function buzz(at: number, freq = 196): void {
  const c = ensureCtx();
  if (!c || !master) return;
  const t0 = c.currentTime + at;
  master.gain.value = masterGain();

  const osc = c.createOscillator();
  const env = c.createGain();
  const lp = c.createBiquadFilter();
  osc.type = "sawtooth";
  osc.frequency.value = freq;
  lp.type = "lowpass";
  lp.frequency.value = 620;
  env.gain.setValueAtTime(0, t0);
  env.gain.linearRampToValueAtTime(0.3, t0 + 0.015);
  env.gain.setValueAtTime(0.3, t0 + 0.1);
  env.gain.exponentialRampToValueAtTime(0.0006, t0 + 0.16);
  osc.connect(lp);
  lp.connect(env);
  env.connect(master);
  osc.start(t0);
  osc.stop(t0 + 0.2);
}

/** Respiration du rail : passage de rame, panoramique gauche → droite. */
function whoosh(dur = 0.55): void {
  const c = ensureCtx();
  if (!c || !master) return;
  const t0 = c.currentTime;
  master.gain.value = masterGain();

  // Bruit blanc bufferisé ( recyclé pour plusieurs effets )
  const len = Math.ceil(c.sampleRate * dur);
  const buffer = c.createBuffer(1, len, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

  const src = c.createBufferSource();
  src.buffer = buffer;

  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 0.9;
  // Balayage : grave (loin) → aigu (devant) → grave (loin)
  bp.frequency.setValueAtTime(240, t0);
  bp.frequency.exponentialRampToValueAtTime(1500, t0 + dur * 0.45);
  bp.frequency.exponentialRampToValueAtTime(320, t0 + dur);

  const env = c.createGain();
  env.gain.setValueAtTime(0, t0);
  env.gain.linearRampToValueAtTime(0.22, t0 + dur * 0.35);
  env.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);

  const pan = c.createStereoPanner();
  pan.pan.setValueAtTime(-0.85, t0);
  pan.pan.linearRampToValueAtTime(0.85, t0 + dur);

  src.connect(bp);
  bp.connect(env);
  env.connect(pan);
  pan.connect(master);
  src.start(t0);
  src.stop(t0 + dur);
}

/** Choc de joint de rail, tout sec. */
function clack(at = 0, gain = 0.14): void {
  const c = ensureCtx();
  if (!c || !master) return;
  const t0 = c.currentTime + at;
  master.gain.value = masterGain();

  const len = Math.ceil(c.sampleRate * 0.04);
  const buffer = c.createBuffer(1, len, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buffer;
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 1800;
  const env = c.createGain();
  env.gain.setValueAtTime(gain, t0);
  env.gain.exponentialRampToValueAtTime(0.0006, t0 + 0.05);
  src.connect(hp);
  hp.connect(env);
  env.connect(master);
  src.start(t0);
}

/** Clic discret d'interface (toucher, bascule). */
function tick(): void {
  const c = ensureCtx();
  if (!c || !master) return;
  const t0 = c.currentTime;
  master.gain.value = masterGain();
  const osc = c.createOscillator();
  const env = c.createGain();
  osc.type = "sine";
  osc.frequency.value = 2100;
  env.gain.setValueAtTime(0.12, t0);
  env.gain.exponentialRampToValueAtTime(0.0006, t0 + 0.03);
  osc.connect(env);
  env.connect(master);
  osc.start(t0);
  osc.stop(t0 + 0.04);
}

// ── Haptique (Android : retour tactile léger, no-op ailleurs) ────────────────

function vibrate(pattern: number | number[]): void {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    /* silencieux */
  }
}

// ── Fréquences utilitaires ───────────────────────────────────────────────────

const N = {
  C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.0, A4: 440.0,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.0,
  C6: 1046.5, D6: 1174.66, E6: 1318.51, G6: 1567.98, A6: 1760.0, C7: 2093.0,
  F5: 698.46,
} as const;

// ── API publique : chaque son raconte un évènement du réseau ────────────────

export const sfx = {
  /** Clic d'interface : navigation, puces, bascules. */
  tap() {
    if (!isOn()) return;
    unlockAudio();
    tick();
  },

  /** Bascule du son : confirmation audible quand on rallume. */
  toggle(enabled: boolean) {
    unlockAudio();
    if (enabled) tick();
  },

  /** Bonne réponse : carillon de quai, deux notes descendantes. */
  correct() {
    if (!isOn()) return;
    unlockAudio();
    bell({ freq: N.C6, gain: 0.34, dur: 0.5, partialGain: 0.2 });
    bell({ freq: N.G5, at: 0.13, gain: 0.4, dur: 0.8, partialGain: 0.22 });
    vibrate(12);
  },

  /** Mauvaise réponse : avertisseur doux, deux coups graves. */
  wrong() {
    if (!isOn()) return;
    unlockAudio();
    buzz(0, 207);
    buzz(0.15, 174);
    vibrate([50, 40, 50]);
  },

  /** Question suivante : la rame repart — souffle + joints de rail. */
  depart() {
    if (!isOn()) return;
    unlockAudio();
    whoosh(0.5);
    clack(0.16);
    clack(0.3);
  },

  /** Arrivée en station (nouvelle question) : petit carillon d'approche. */
  arrive() {
    if (!isOn()) return;
    unlockAudio();
    bell({ freq: N.A5, gain: 0.2, dur: 0.35, partialGain: 0.14 });
  },

  /** Départ de session : l'avertisseur de portes (3 notes, 2 fois). */
  doors() {
    if (!isOn()) return;
    unlockAudio();
    const seq: Array<[number, number]> = [
      [N.A5, 0.0], [N.F5, 0.14], [N.D5, 0.28],
      [N.A5, 0.52], [N.F5, 0.66], [N.D5, 0.8],
    ];
    for (const [f, t] of seq) note({ freq: f, at: t, dur: 0.16, gain: 0.3 });
  },

  /** Fermeture des portes de quai : version courte (changement de vue). */
  doorQuick() {
    if (!isOn()) return;
    unlockAudio();
    note({ freq: N.A5, at: 0, dur: 0.14, gain: 0.24 });
    note({ freq: N.F5, at: 0.12, dur: 0.14, gain: 0.24 });
    note({ freq: N.D5, at: 0.24, dur: 0.2, gain: 0.24 });
  },

  /** 発車メロディー : mélodie de départ pentatonique, joyeuse. */
  hassha() {
    if (!isOn()) return;
    unlockAudio();
    // Tempo de quai ~ 138 bpm, croches = 0.217 s
    const b = 0.217;
    const melody: Array<[number, number, number]> = [
      // [fréquence, temps (en croches), durée]
      [N.E5, 0, 1], [N.G5, 1, 1], [N.A5, 2, 1], [N.G5, 3, 1],
      [N.E5, 4, 1], [N.D5, 5, 1], [N.C5, 6, 2],
      [N.D5, 8, 1], [N.E5, 9, 1], [N.G5, 10, 1], [N.A5, 11, 1],
      [N.C6, 12, 3],
    ];
    for (const [f, beat, len] of melody) {
      note({ freq: f, at: beat * b, dur: len * b * 0.92, gain: 0.3 });
    }
    vibrate([15, 60, 15]);
  },

  /** Tannoy : trois notes avant l'annonce officielle. */
  tannoy() {
    if (!isOn()) return;
    unlockAudio();
    bell({ freq: N.F5, gain: 0.3, dur: 0.5, partialGain: 0.16 });
    bell({ freq: N.A5, at: 0.18, gain: 0.32, dur: 0.55, partialGain: 0.16 });
    bell({ freq: N.F5, at: 0.4, gain: 0.3, dur: 0.6, partialGain: 0.16 });
  },

  /** Terminus : fanfare d'arrivée, arpège puis accord tenu. */
  terminus() {
    if (!isOn()) return;
    unlockAudio();
    const t0 = 0.28;
    const arp: Array<[number, number]> = [
      [N.C5, 0], [N.E5, 0.1], [N.G5, 0.2], [N.C6, 0.3],
    ];
    for (const [f, t] of arp) note({ freq: f, at: t0 + t, dur: 0.24, gain: 0.32 });
    // Accord final tenu, voix élargie
    const chord: Array<[number, number]> = [
      [N.C5, 0], [N.E5, 0], [N.G5, 0], [N.C6, 0], [N.E6, 0.05],
    ];
    for (const [f, t] of chord) {
      note({ freq: f, at: t0 + 0.48 + t, dur: 1.0, gain: 0.2 });
    }
    vibrate([30, 60, 30, 60, 120]);
  },

  /** Service parfait : pluie d'étincelles au-dessus de la fanfare. */
  perfect() {
    if (!isOn()) return;
    unlockAudio();
    const spark: Array<[number, number]> = [
      [N.G6, 1.1], [N.A6, 1.18], [N.C7, 1.26], [N.G6, 1.38],
      [N.E6, 1.5], [N.A6, 1.6], [N.C7, 1.72], [N.E6, 1.86],
    ];
    for (const [f, t] of spark) {
      bell({ freq: f, at: t, gain: 0.22, dur: 0.5, partialGain: 0.12 });
    }
  },

  /** Clac d'afficheur à palettes (split-flap), très doux. */
  flap() {
    if (!isOn()) return;
    clack(0, 0.05);
  },

  /** Progression du trajet (pastille franchie) : joint de rail discret. */
  rail() {
    if (!isOn()) return;
    unlockAudio();
    clack(0, 0.1);
  },

  /** État interne (instrumentation E2E, jamais utilisé par l'UI). */
  debugState(): { created: boolean; state: string; unlocked: boolean } {
    return {
      created: !!ctx,
      state: ctx?.state ?? "absent",
      unlocked,
    };
  },
};

// Hook E2E : window.__kdSfx (permet aux tests Playwright d'appeler et d'observer)
if (typeof window !== "undefined") {
  (window as unknown as { __kdSfx?: typeof sfx }).__kdSfx = sfx;
}
