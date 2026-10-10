import { WORDS, type Word } from "@/lib/words";

export const SHORT_LESSONS = [
  { ar: "الفتحة", en: "Fatha", available: true, lesson: "fatha" as const },
  { ar: "الفتحة والكسرة", en: "Fatha & Kasra", available: true, lesson: "kasra" as const },
  { ar: "الفتحة والضمة والكسرة", en: "Fatha, Damma & Kasra", available: false, lesson: null },
  { ar: "السكون", en: "Sukun", available: false, lesson: null },
];
export const MADD_LESSONS = [
  { ar: "مد الألف", en: "Madd Alif" },
  { ar: "مد الواو", en: "Madd Waw" },
  { ar: "مد الياء", en: "Madd Yaa" },
];
export const TANWEEN_LESSONS = [
  { ar: "تنوين الفتح", en: "Tanween Fath" },
  { ar: "تنوين الضم", en: "Tanween Damm" },
  { ar: "تنوين الكسر", en: "Tanween Kasr" },
];

// Existing saved completion IDs determine the next word; no new progress schema.
export function learningSummary(learned: number[], words: Word[] = WORDS) {
  const completed = words.filter((w) => learned.includes(w.id)).length;
  const next = words.findIndex((w) => !learned.includes(w.id));
  return {
    completed,
    percent: Math.round(completed / words.length * 100),
    resumeIndex: next < 0 ? 0 : next,
    status: completed === words.length ? "Completed" : completed > 0 ? "In progress" : "Available",
  };
}