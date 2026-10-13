import { WORDS, type Word } from "@/lib/words";
import type { Progress } from "@/lib/progress";
import { WAW_WORDS } from "@/lib/waw-words";
export { WAW_WORDS } from "@/lib/waw-words";

export type LessonId = "fatha" | "kasra" | "three" | "sukoon" | "alif" | "waw";

// Fatha + Kasra bank (pattern Fatha → Kasra → Fatha). IDs start at 101 so they
// never collide with the 42 Fatha IDs used by saved progress and artwork.
const kasraRaw: [string, string, string, string][] = [
  ["عَلِمَ", "عَ لِ مَ", "'alima", "He knew"],
  ["فَهِمَ", "فَ هِ مَ", "fahima", "He understood"],
  ["حَفِظَ", "حَ فِ ظَ", "hafiza", "He memorized"],
  ["عَمِلَ", "عَ مِ لَ", "'amila", "He worked"],
  ["غَضِبَ", "غَ ضِ بَ", "ghadiba", "He became angry"],
  ["مَرِضَ", "مَ رِ ضَ", "marida", "He became ill"],
  ["خَسِرَ", "خَ سِ رَ", "khasira", "He lost"],
  ["لَبِسَ", "لَ بِ سَ", "labisa", "He wore"],
  ["رَبِحَ", "رَ بِ حَ", "rabiha", "He won / gained"],
  ["شَهِدَ", "شَ هِ دَ", "shahida", "He witnessed"],
  ["نَسِيَ", "نَ سِ يَ", "nasiya", "He forgot"],
  ["حَمِدَ", "حَ مِ دَ", "hamida", "He praised"],
  ["عَطِشَ", "عَ طِ شَ", "'atisha", "He became thirsty"],
  ["سَلِمَ", "سَ لِ مَ", "salima", "He was safe / unharmed"],
];

export const KASRA_WORDS: Word[] = kasraRaw.map(([ar, u, tr, en], i) => ({
  id: 101 + i, ar, units: u.split(" "), tr, en,
}));

// The Three Short Sounds bank, exactly as supplied (IDs 201+).
const threeRaw: [string, string, string][] = [
  ["قَلَمُ", "qalamu", "Pen"], ["قَمَرُ", "qamaru", "Moon"], ["مَلِكُ", "maliku", "King"], ["جَبَلُ", "jabalu", "Mountain"],
  ["رَجَلُ", "rajalu", "Man"], ["شَجَرُ", "shajaru", "Trees"], ["ثَمَرُ", "thamaru", "Fruit"], ["حَمَلُ", "hamalu", "Lamb"],
  ["خَشَبُ", "khashabu", "Wood"], ["ذَهَبُ", "dhahabu", "Gold"], ["زَهَرُ", "zaharu", "Flowers"], ["سَمَكُ", "samaku", "Fish"],
  ["طَبَقُ", "tabaqu", "Plate / Dish"], ["بَلَدُ", "baladu", "Country / Town"], ["وَلَدُ", "waladu", "Boy / Child"], ["عَلَمُ", "'alamu", "Flag"],
  ["كَبِدُ", "kabidu", "Liver"], ["كَتِفُ", "katifu", "Shoulder"], ["فَخِذُ", "fakhidhu", "Thigh"], ["أَثَرُ", "atharu", "Trace / Effect"],
  ["قَدَمُ", "qadamu", "Foot"], ["بَقَرُ", "baqaru", "Cattle / Cows"], ["حَجَرُ", "hajaru", "Stone"], ["عَنَبُ", "'anabu", "Grapes"],
  ["مَطَرُ", "mataru", "Rain"], ["نَهَرُ", "naharu", "River"], ["وَطَنُ", "watanu", "Homeland"], ["غَنَمُ", "ghanamu", "Sheep / Goats"],
  ["عَسَلُ", "'asalu", "Honey"], ["بَصَلُ", "basalu", "Onion"],
];
const splitUnits = (w: string) => w.match(/[^\u064E\u064F\u0650]+[\u064E\u064F\u0650]/g) ?? [w];
export const THREE_WORDS: Word[] = threeRaw.map(([ar, tr, en], i) => ({ id: 201 + i, ar, units: splitUnits(ar), tr, en }));

// The Sukoon bank, exactly as supplied (IDs 301+). Units: vowel | sukoon consonant | final vowel.
const sukoonRaw: [string, string, string][] = [
  ["نَمْلُ", "namlu", "Ant / ants"], ["قَلْبُ", "qalbu", "Heart"], ["كَلْبُ", "kalbu", "Dog"], ["شَمْسُ", "shamsu", "Sun"],
  ["بَدْرُ", "badru", "Full moon"], ["نَجْمُ", "najmu", "Star"], ["بَحْرُ", "bahru", "Sea"], ["نَهْرُ", "nahru", "River"],
  ["أَرْضُ", "ardu", "Earth / land"], ["وَرْدُ", "wardu", "Roses"], ["زَهْرُ", "zahru", "Blossoms / flowers"], ["فَهْدُ", "fahdu", "Leopard"],
  ["صَقْرُ", "saqru", "Falcon / hawk"], ["نَسْرُ", "nasru", "Eagle / vulture"], ["ثَوْرُ", "thawru", "Bull"], ["قِرْدُ", "qirdu", "Monkey"],
  ["طِفْلُ", "tiflu", "Child"], ["جِذْعُ", "jidh'u", "Tree trunk"], ["خُبْزُ", "khubzu", "Bread"], ["غُصْنُ", "ghusnu", "Branch"],
];
export const SUKOON_WORDS: Word[] = sukoonRaw.map(([ar, tr, en], i) => ({ id: 301 + i, ar, units: ar.match(/[^\u064B-\u0652][\u064B-\u0652]/g) ?? [ar], tr, en }));

// Madd Alif bank, exactly as supplied (IDs 401+). Every long-alif syllable (بَا، تَا…) is ONE unit.
const alifRaw: [string, string, string, string][] = [
  ["بَابُ", "بَا بُ", "baabu", "Door"], ["كِتَابُ", "كِ تَا بُ", "kitaabu", "Book"], ["طَعَامُ", "طَ عَا مُ", "ta'aamu", "Food"],
  ["دَارُ", "دَا رُ", "daaru", "House / home"], ["نَارُ", "نَا رُ", "naaru", "Fire"], ["قِطَارُ", "قِ طَا رُ", "qitaaru", "Train"],
  ["حِمَارُ", "حِ مَا رُ", "himaaru", "Donkey"], ["غَزَالُ", "غَ زَا لُ", "ghazaalu", "Gazelle"], ["صَانِعُ", "صَا نِ عُ", "saani'u", "Maker / craftsman"],
  ["خَالُ", "خَا لُ", "khaalu", "Maternal uncle"], ["سِوَارُ", "سِ وَا رُ", "siwaaru", "Bracelet"], ["جِدَارُ", "جِ دَا رُ", "jidaaru", "Wall"],
  ["سَحَابُ", "سَ حَا بُ", "sahaabu", "Clouds"], ["ذُبَابُ", "ذُ بَا بُ", "dhubaabu", "Fly (insect)"], ["لَاعِبُ", "لَا عِ بُ", "laa'ibu", "Player"],
  ["كَاتِبُ", "كَا تِ بُ", "kaatibu", "Writer"], ["تَاجِرُ", "تَا جِ رُ", "taajiru", "Merchant"], ["عَالِمُ", "عَا لِ مُ", "'aalimu", "Scholar / scientist"],
  ["حَاكِمُ", "حَا كِ مُ", "haakimu", "Ruler / judge"], ["فَرَاشَةُ", "فَ رَا شَ ةُ", "faraashatu", "Butterfly"], ["دَجَاجَةُ", "دَ جَا جَ ةُ", "dajaajatu", "Chicken / hen"],
  ["زَرَافَةُ", "زَ رَا فَ ةُ", "zaraafatu", "Giraffe"], ["حَمَامَةُ", "حَ مَا مَ ةُ", "hamaamatu", "Pigeon / dove"], ["سَاعَةُ", "سَا عَ ةُ", "saa'atu", "Clock / watch"],
  ["غَابَةُ", "غَا بَ ةُ", "ghaabatu", "Forest"],
];
export const ALIF_WORDS: Word[] = alifRaw.map(([ar, u, tr, en], i) => ({ id: 401 + i, ar, units: u.split(" "), tr, en }));

export const LESSONS: Record<LessonId, { ar: string; en: string; words: Word[]; key: "learned" | "learnedKasra" | "learnedThree" | "learnedSukoon" | "learnedAlif" }> = {
  fatha: { ar: "الفتحة", en: "Fatha", words: WORDS, key: "learned" },
  kasra: { ar: "الفتحة والكسرة", en: "Fatha & Kasra", words: KASRA_WORDS, key: "learnedKasra" },
  three: { ar: "الفتحة والضمة والكسرة", en: "Three Short Sounds", words: THREE_WORDS, key: "learnedThree" },
  sukoon: { ar: "السكون", en: "Sukoon", words: SUKOON_WORDS, key: "learnedSukoon" },
  alif: { ar: "مد الألف", en: "Madd Alif", words: ALIF_WORDS, key: "learnedAlif" },
  waw: { ar: "مد الواو", en: "Madd Waw", words: WAW_WORDS, key: "learnedWaw" },
};

export const lessonLearned = (p: Progress, id: LessonId) => p[LESSONS[id].key];
export const parseLesson = (v: unknown): LessonId => (v === "kasra" || v === "three" || v === "sukoon" || v === "alif" || v === "waw" ? v : "fatha");

// ---- Unit flow: Learn all words → pass quiz → pass reading test → next unit opens.
export const UNIT_ORDER: LessonId[] = ["fatha", "kasra", "three", "sukoon", "alif", "waw"];
export const PASS_PCT = 70;
export const QUIZ_LENGTH = 10;

export type UnitStep = "learn" | "quiz" | "test" | "done";
export type UnitState = {
  id: LessonId; learned: number; total: number; lessonsDone: boolean; quizPassed: boolean; testPassed: boolean;
  complete: boolean; unlocked: boolean; prev: LessonId | null; step: UnitStep; quizBest: number | undefined; testBest: number | undefined;
};
/** Set to true before release to lock each unit until the previous one is complete. */
export const UNIT_LOCKING = false;

export function unitState(p: Progress, id: LessonId): UnitState {
  const words = LESSONS[id].words;
  const learned = words.filter((w) => p[LESSONS[id].key].includes(w.id)).length;
  const rec = p.units?.[id] ?? {};
  const lessonsDone = learned === words.length;
  const quizPassed = !!rec.quizPassed;
  const testPassed = !!rec.testPassed;
  const complete = lessonsDone && quizPassed && testPassed;
  const idx = UNIT_ORDER.indexOf(id);
  const prev = idx > 0 ? UNIT_ORDER[idx - 1]! : null;
  // DEV: unit locking is disabled while the app is being built so every unit
  // can be tested freely. Set UNIT_LOCKING to true to restore "finish a unit
  // to open the next one" before release.
  const unlocked: boolean = UNIT_LOCKING ? !prev || unitState(p, prev).complete : true;
  const step: UnitStep = !lessonsDone ? "learn" : !quizPassed ? "quiz" : !testPassed ? "test" : "done";
  return { id, learned, total: words.length, lessonsDone, quizPassed, testPassed, complete, unlocked, prev, step, quizBest: rec.quizBest, testBest: rec.testBest };
}

/** Saves a unit's quiz or test result; passing stays passed and the best score is kept. */
export function recordUnitResult(p: Progress, id: LessonId, kind: "quiz" | "test", pct: number): Progress {
  const rec = p.units?.[id] ?? {};
  const best = Math.max(pct, (kind === "quiz" ? rec.quizBest : rec.testBest) ?? 0);
  const passed = pct >= PASS_PCT || !!(kind === "quiz" ? rec.quizPassed : rec.testPassed);
  const patch = kind === "quiz" ? { quizBest: best, quizPassed: passed } : { testBest: best, testPassed: passed };
  return { ...p, units: { ...p.units, [id]: { ...rec, ...patch } } };
}
