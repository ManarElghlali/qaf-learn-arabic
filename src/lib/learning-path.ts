import { WORDS } from "@/lib/words";

export const SHORT_LESSONS = [
  { ar: "الفتحة", en: "Fatha", available: true },
  { ar: "الفتحة والكسرة", en: "Fatha & Kasra", available: false },
  { ar: "الفتحة والضمة والكسرة", en: "Fatha, Damma & Kasra", available: false },
  { ar: "السكون", en: "Sukun", available: false },
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
export function learningSummary(learned: number[]) {
  const completed = WORDS.filter((w) => learned.includes(w.id)).length;
  const next = WORDS.findIndex((w) => !learned.includes(w.id));
  return {
    completed,
    percent: Math.round(completed / WORDS.length * 100),
    resumeIndex: next < 0 ? 0 : next,
    status: completed === WORDS.length ? "Completed" : completed > 0 ? "In progress" : "Available",
  };
}