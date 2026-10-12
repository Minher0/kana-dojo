// ─── Tokens du monde ferroviaire ─────────────────────────────────────────────
// Métadonnées de lignes, codes de station, correspondances maîtrise → état.

import {
  ALL_KANA,
  KanaChar,
  KanaGroup,
} from "@/lib/kana-data";
import { MasteryLevel } from "@/lib/srs-engine";

export type Script = "hiragana" | "katakana";

export interface LineMeta {
  code: "H" | "K";
  name: string;
  kana: string;       // glyphe d'affichage de la ligne
  rowLabel: string;   // ex : ligne あ
  count: number;      // nombre de stations de la ligne
}

const LINE_META: Record<Script, LineMeta> = {
  hiragana: {
    code: "H",
    name: "Hiragana",
    kana: "あ",
    rowLabel: "ligne あ",
    count: ALL_KANA.filter((c) => c.script === "hiragana").length,
  },
  katakana: {
    code: "K",
    name: "Katakana",
    kana: "ア",
    rowLabel: "ligne ア",
    count: ALL_KANA.filter((c) => c.script === "katakana").length,
  },
};

export function lineOf(script: Script): LineMeta {
  return LINE_META[script];
}

// ── Codes de station façon Tokyo (H-01 … H-104, K-01 … K-104) ──────────────

const STATION_CODE = new Map<string, string>();
{
  const counters: Record<Script, number> = { hiragana: 0, katakana: 0 };
  for (const c of ALL_KANA) {
    counters[c.script] += 1;
    const n = counters[c.script];
    const prefix = LINE_META[c.script].code;
    STATION_CODE.set(c.id, `${prefix}-${String(n).padStart(2, "0")}`);
  }
}

export function stationCodeOf(char: KanaChar): string {
  return STATION_CODE.get(char.id) ?? "";
}

// ── État de station (métaphore maîtrise) ────────────────────────────────────

export interface StationStateMeta {
  label: string;
  /** Pastille : vide / anneau incident / demi / pleine */
  dot: "empty" | "alert" | "half" | "full";
  /** Teinte de la tuile sur le plan de réseau */
  tileClass: string;
  ringClass: string;
}

export const STATION_STATES: Record<MasteryLevel, StationStateMeta> = {
  new: {
    label: "Nouvelle station",
    dot: "empty",
    tileClass: "",
    ringClass: "border",
  },
  learning: {
    label: "En interruption",
    dot: "alert",
    tileClass: "bg-signal-stop/12 border-signal-stop/45",
    ringClass: "border-signal-stop/50",
  },
  familiar: {
    label: "En travaux",
    dot: "half",
    tileClass: "bg-warning/15 border-warning/50",
    ringClass: "border-warning/60",
  },
  mastered: {
    label: "Maîtrisée",
    dot: "full",
    tileClass: "bg-line-h/12 border-line-h/40",
    ringClass: "border-line-h/50",
  },
};

export function stationStateOf(level: MasteryLevel): StationStateMeta {
  return STATION_STATES[level];
}

// ── Libellés de groupes façon sections de ligne ─────────────────────────────

export interface SectionMeta {
  short: string;
  long: string;
  hint: string;
  count: (script: Script) => number;
}

export const SECTIONS: Record<KanaGroup, SectionMeta> = {
  base: {
    short: "Base",
    long: "Syllabaire de base",
    hint: "Les 46 stations fondamentales (gojūon)",
    count: (s) => ALL_KANA.filter((c) => c.script === s && c.group === "base").length,
  },
  dakuten: {
    short: "Dakuten",
    long: "Dakuten & handakuten",
    hint: "Sonorisations : が, ば, ぱ… (25 stations)",
    count: (s) => ALL_KANA.filter((c) => c.script === s && c.group === "dakuten").length,
  },
  yoon: {
    short: "Yōon",
    long: "Syllabes combinées",
    hint: "Combinaisons avec ゃゅょ : きゃ, しゅ… (33 stations)",
    count: (s) => ALL_KANA.filter((c) => c.script === s && c.group === "yoon").length,
  },
};
