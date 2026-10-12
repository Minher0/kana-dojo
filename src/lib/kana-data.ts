// ─── Données Kana : Hiragana + Katakana ──────────────────────────────────────
// Groupes : base (gojūon), dakuten/handakuten, yōon (combinaisons)

export type KanaGroup = "base" | "dakuten" | "yoon";

export interface KanaChar {
  id: string;          // identifiant unique (ex: "h-a", "k-ka", "h-kya")
  kana: string;        // caractère affiché (ex: "あ")
  romaji: string;      // transcription (ex: "a", "sha")
  altRomaji?: string[];// variantes acceptées (ex: ["si"] pour "shi")
  script: "hiragana" | "katakana";
  group: KanaGroup;
  row: string;         // ligne de la table (a, ka, sa...) pour groupement
}

// Fabriques par script ET par groupe : le groupe est garanti par construction.

const make = (
  script: "hiragana" | "katakana",
  group: KanaGroup
) => (kana: string, romaji: string, row: string, alt?: string[]): KanaChar => ({
  id: `${script === "hiragana" ? "h" : "k"}-${group === "base" ? "" : group === "dakuten" ? "d" : "y"}${romaji}`,
  kana,
  romaji,
  altRomaji: alt,
  script,
  group,
  row,
});

// Hiragana
const HB = make("hiragana", "base");
const HD = make("hiragana", "dakuten");
const HY = make("hiragana", "yoon");

// Katakana
const KB = make("katakana", "base");
const KD = make("katakana", "dakuten");
const KY = make("katakana", "yoon");

// ── Hiragana : base ──────────────────────────────────────────────────────────
export const HIRAGANA_BASE: KanaChar[] = [
  HB("あ", "a", "a"), HB("い", "i", "a"), HB("う", "u", "a"), HB("え", "e", "a"), HB("お", "o", "a"),
  HB("か", "ka", "ka"), HB("き", "ki", "ka"), HB("く", "ku", "ka"), HB("け", "ke", "ka"), HB("こ", "ko", "ka"),
  HB("さ", "sa", "sa"), HB("し", "shi", "sa", ["si"]), HB("す", "su", "sa"), HB("せ", "se", "sa"), HB("そ", "so", "sa"),
  HB("た", "ta", "ta"), HB("ち", "chi", "ta", ["ti"]), HB("つ", "tsu", "ta", ["tu"]), HB("て", "te", "ta"), HB("と", "to", "ta"),
  HB("な", "na", "na"), HB("に", "ni", "na"), HB("ぬ", "nu", "na"), HB("ね", "ne", "na"), HB("の", "no", "na"),
  HB("は", "ha", "ha"), HB("ひ", "hi", "ha"), HB("ふ", "fu", "ha", ["hu"]), HB("へ", "he", "ha"), HB("ほ", "ho", "ha"),
  HB("ま", "ma", "ma"), HB("み", "mi", "ma"), HB("む", "mu", "ma"), HB("め", "me", "ma"), HB("も", "mo", "ma"),
  HB("や", "ya", "ya"), HB("ゆ", "yu", "ya"), HB("よ", "yo", "ya"),
  HB("ら", "ra", "ra"), HB("り", "ri", "ra"), HB("る", "ru", "ra"), HB("れ", "re", "ra"), HB("ろ", "ro", "ra"),
  HB("わ", "wa", "wa"), HB("を", "wo", "wa", ["o"]), HB("ん", "n", "n"),
];

// ── Hiragana : dakuten / handakuten ──────────────────────────────────────────
export const HIRAGANA_DAKUTEN: KanaChar[] = [
  HD("が", "ga", "ga"), HD("ぎ", "gi", "ga"), HD("ぐ", "gu", "ga"), HD("げ", "ge", "ga"), HD("ご", "go", "ga"),
  HD("ざ", "za", "za"), HD("じ", "ji", "za", ["zi"]), HD("ず", "zu", "za"), HD("ぜ", "ze", "za"), HD("ぞ", "zo", "za"),
  HD("だ", "da", "da"), HD("ぢ", "di", "da", ["ji"]), HD("づ", "du", "da", ["zu"]), HD("で", "de", "da"), HD("ど", "do", "da"),
  HD("ば", "ba", "ba"), HD("び", "bi", "ba"), HD("ぶ", "bu", "ba"), HD("べ", "be", "ba"), HD("ぼ", "bo", "ba"),
  HD("ぱ", "pa", "pa"), HD("ぴ", "pi", "pa"), HD("ぷ", "pu", "pa"), HD("ぺ", "pe", "pa"), HD("ぽ", "po", "pa"),
];

// ── Hiragana : yōon ──────────────────────────────────────────────────────────
export const HIRAGANA_YOON: KanaChar[] = [
  HY("きゃ", "kya", "kya"), HY("きゅ", "kyu", "kya"), HY("きょ", "kyo", "kya"),
  HY("しゃ", "sha", "sha", ["sya"]), HY("しゅ", "shu", "sha", ["syu"]), HY("しょ", "sho", "sha", ["syo"]),
  HY("ちゃ", "cha", "cha", ["tya"]), HY("ちゅ", "chu", "cha", ["tyu"]), HY("ちょ", "cho", "cha", ["tyo"]),
  HY("にゃ", "nya", "nya"), HY("にゅ", "nyu", "nya"), HY("にょ", "nyo", "nya"),
  HY("ひゃ", "hya", "hya"), HY("ひゅ", "hyu", "hya"), HY("ひょ", "hyo", "hya"),
  HY("みゃ", "mya", "mya"), HY("みゅ", "myu", "mya"), HY("みょ", "myo", "mya"),
  HY("りゃ", "rya", "rya"), HY("りゅ", "ryu", "rya"), HY("りょ", "ryo", "rya"),
  HY("ぎゃ", "gya", "gya"), HY("ぎゅ", "gyu", "gya"), HY("ぎょ", "gyo", "gya"),
  HY("じゃ", "ja", "ja", ["zya", "jya"]), HY("じゅ", "ju", "ja", ["zyu", "jyu"]), HY("じょ", "jo", "ja", ["zyo", "jyo"]),
  HY("びゃ", "bya", "bya"), HY("びゅ", "byu", "bya"), HY("びょ", "byo", "bya"),
  HY("ぴゃ", "pya", "pya"), HY("ぴゅ", "pyu", "pya"), HY("ぴょ", "pyo", "pya"),
];

// ── Katakana : base ──────────────────────────────────────────────────────────
export const KATAKANA_BASE: KanaChar[] = [
  KB("ア", "a", "a"), KB("イ", "i", "a"), KB("ウ", "u", "a"), KB("エ", "e", "a"), KB("オ", "o", "a"),
  KB("カ", "ka", "ka"), KB("キ", "ki", "ka"), KB("ク", "ku", "ka"), KB("ケ", "ke", "ka"), KB("コ", "ko", "ka"),
  KB("サ", "sa", "sa"), KB("シ", "shi", "sa", ["si"]), KB("ス", "su", "sa"), KB("セ", "se", "sa"), KB("ソ", "so", "sa"),
  KB("タ", "ta", "ta"), KB("チ", "chi", "ta", ["ti"]), KB("ツ", "tsu", "ta", ["tu"]), KB("テ", "te", "ta"), KB("ト", "to", "ta"),
  KB("ナ", "na", "na"), KB("ニ", "ni", "na"), KB("ヌ", "nu", "na"), KB("ネ", "ne", "na"), KB("ノ", "no", "na"),
  KB("ハ", "ha", "ha"), KB("ヒ", "hi", "ha"), KB("フ", "fu", "ha", ["hu"]), KB("ヘ", "he", "ha"), KB("ホ", "ho", "ha"),
  KB("マ", "ma", "ma"), KB("ミ", "mi", "ma"), KB("ム", "mu", "ma"), KB("メ", "me", "ma"), KB("モ", "mo", "ma"),
  KB("ヤ", "ya", "ya"), KB("ユ", "yu", "ya"), KB("ヨ", "yo", "ya"),
  KB("ラ", "ra", "ra"), KB("リ", "ri", "ra"), KB("ル", "ru", "ra"), KB("レ", "re", "ra"), KB("ロ", "ro", "ra"),
  KB("ワ", "wa", "wa"), KB("ヲ", "wo", "wa", ["o"]), KB("ン", "n", "n"),
];

// ── Katakana : dakuten / handakuten ──────────────────────────────────────────
export const KATAKANA_DAKUTEN: KanaChar[] = [
  KD("ガ", "ga", "ga"), KD("ギ", "gi", "ga"), KD("グ", "gu", "ga"), KD("ゲ", "ge", "ga"), KD("ゴ", "go", "ga"),
  KD("ザ", "za", "za"), KD("ジ", "ji", "za", ["zi"]), KD("ズ", "zu", "za"), KD("ゼ", "ze", "za"), KD("ゾ", "zo", "za"),
  KD("ダ", "da", "da"), KD("ヂ", "di", "da", ["ji"]), KD("ヅ", "du", "da", ["zu"]), KD("デ", "de", "da"), KD("ド", "do", "da"),
  KD("バ", "ba", "ba"), KD("ビ", "bi", "ba"), KD("ブ", "bu", "ba"), KD("ベ", "be", "ba"), KD("ボ", "bo", "ba"),
  KD("パ", "pa", "pa"), KD("ピ", "pi", "pa"), KD("プ", "pu", "pa"), KD("ペ", "pe", "pa"), KD("ポ", "po", "pa"),
];

// ── Katakana : yōon ──────────────────────────────────────────────────────────
export const KATAKANA_YOON: KanaChar[] = [
  KY("キャ", "kya", "kya"), KY("キュ", "kyu", "kya"), KY("キョ", "kyo", "kya"),
  KY("シャ", "sha", "sha", ["sya"]), KY("シュ", "shu", "sha", ["syu"]), KY("ショ", "sho", "sha", ["syo"]),
  KY("チャ", "cha", "cha", ["tya"]), KY("チュ", "chu", "cha", ["tyu"]), KY("チョ", "cho", "cha", ["tyo"]),
  KY("ニャ", "nya", "nya"), KY("ニュ", "nyu", "nya"), KY("ニョ", "nyo", "nya"),
  KY("ヒャ", "hya", "hya"), KY("ヒュ", "hyu", "hya"), KY("ヒョ", "hyo", "hya"),
  KY("ミャ", "mya", "mya"), KY("ミュ", "myu", "mya"), KY("ミョ", "myo", "mya"),
  KY("リャ", "rya", "rya"), KY("リュ", "ryu", "rya"), KY("リョ", "ryo", "rya"),
  KY("ギャ", "gya", "gya"), KY("ギュ", "gyu", "gya"), KY("ギョ", "gyo", "gya"),
  KY("ジャ", "ja", "ja", ["zya", "jya"]), KY("ジュ", "ju", "ja", ["zyu", "jyu"]), KY("ジョ", "jo", "ja", ["zyo", "jyo"]),
  KY("ビャ", "bya", "bya"), KY("ビュ", "byu", "bya"), KY("ビョ", "byo", "bya"),
  KY("ピャ", "pya", "pya"), KY("ピュ", "pyu", "pya"), KY("ピョ", "pyo", "pya"),
];

export const ALL_KANA: KanaChar[] = [
  ...HIRAGANA_BASE, ...HIRAGANA_DAKUTEN, ...HIRAGANA_YOON,
  ...KATAKANA_BASE, ...KATAKANA_DAKUTEN, ...KATAKANA_YOON,
];

export const KANA_BY_ID = new Map(ALL_KANA.map((k) => [k.id, k]));

// Vérification d'intégrité : ids uniques
if (KANA_BY_ID.size !== ALL_KANA.length) {
  const seen = new Set<string>();
  for (const k of ALL_KANA) {
    if (seen.has(k.id)) console.error(`Kana en double : ${k.id} (${k.kana})`);
    seen.add(k.id);
  }
}

// Libellés de groupes pour l'UI
export const GROUP_LABELS: Record<KanaGroup, { short: string; long: string; hint: string }> = {
  base: {
    short: "Base",
    long: "Syllabaire de base",
    hint: "Les 46 caractères fondamentaux (gojūon)",
  },
  dakuten: {
    short: "Dakuten",
    long: "Dakuten & handakuten",
    hint: "Sonorisations : が, ば, ぱ… (25 caractères)",
  },
  yoon: {
    short: "Yōon",
    long: "Syllabes combinées",
    hint: "Combinaisons avec ゃゅょ : きゃ, しゅ… (33 caractères)",
  },
};
