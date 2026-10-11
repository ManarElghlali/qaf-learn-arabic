import { WORDS, type Word } from "@/lib/words";
import type { Progress } from "@/lib/progress";

export type LessonId = "fatha" | "kasra";

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

export const LESSONS: Record<LessonId, { ar: string; en: string; words: Word[]; key: "learned" | "learnedKasra" }> = {
  fatha: { ar: "الفتحة", en: "Fatha", words: WORDS, key: "learned" },
  kasra: { ar: "الفتحة والكسرة", en: "Fatha & Kasra", words: KASRA_WORDS, key: "learnedKasra" },
};

export const lessonLearned = (p: Progress, id: LessonId) => p[LESSONS[id].key];
export const parseLesson = (v: unknown): LessonId => (v === "kasra" ? "kasra" : "fatha");

// ---- Unit flow: Learn all words → pass quiz → pass reading test → next unit opens.
export const UNIT_ORDER: LessonId[] = ["fatha", "kasra"];
export const PASS_PCT = 70;
export const QUIZ_LENGTH = 10;

export type UnitStep = "learn" | "quiz" | "test" | "done";
export type UnitState = {
  id: LessonId; learned: number; total: number; lessonsDone: boolean; quizPassed: boolean; testPassed: boolean;
  complete: boolean; unlocked: boolean; prev: LessonId | null; step: UnitStep; quizBest?: number; testBest?: number;
};
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
  const unlocked: boolean = !prev || unitState(p, prev).complete;
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
