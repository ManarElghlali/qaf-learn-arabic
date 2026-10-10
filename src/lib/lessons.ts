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
