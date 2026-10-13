import { useEffect, useState } from "react";

// Sound Practice is independent of Reading: its own sets and its own saved progress key.
export const LETTERS = ["أ", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر", "ز", "س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف", "ق", "ك", "ل", "م", "ن", "ه", "و", "ي"];
const F = "\u064E", D = "\u064F", K = "\u0650", S = "\u0652", FT = "\u064B", DT = "\u064C", KT = "\u064D", SH = "\u0651";

export type SoundSet = { id: string; ar: string; en: string; sample: string; make: (l: string) => string[] };
export type SoundCategory = { id: string; ar: string; en: string; accent: string; mark: string; sets: SoundSet[] };

export const SOUND_CATEGORIES: SoundCategory[] = [
  { id: "short", ar: "الحَرَكَاتُ القَصِيرَةُ", en: "Short Vowels", accent: "bg-stage-sky", mark: "بَ", sets: [
    { id: "fatha", ar: "فَتْحَة", en: "Fatha", sample: "بَ", make: (l) => [l + F] },
    { id: "damma", ar: "ضَمَّة", en: "Damma", sample: "بُ", make: (l) => [l + D] },
    { id: "kasra", ar: "كَسْرَة", en: "Kasra", sample: "بِ", make: (l) => [l + K] },
    { id: "fatha-kasra", ar: "فَتْحَة + كَسْرَة", en: "Fatha + Kasra", sample: "بَ بِ", make: (l) => [l + F, l + K] },
    { id: "three", ar: "الحَرَكَاتُ الثَّلَاث", en: "All Three Short Vowels", sample: "بَ بُ بِ", make: (l) => [l + F, l + D, l + K] },
    { id: "sukoon", ar: "سُكُون", en: "Sukoon", sample: "بْ", make: (l) => [l + S] },
  ] },
  { id: "long", ar: "المُدُودُ", en: "Long Sounds", accent: "bg-stage-sage", mark: "بَا", sets: [
    { id: "madd-alif", ar: "المَدُّ بِالأَلِف", en: "Madd Alif", sample: "بَا", make: (l) => [(l === "أ" ? "آ" : l + F + "ا")] },
    { id: "madd-waw", ar: "المَدُّ بِالوَاو", en: "Madd Waw", sample: "بُو", make: (l) => [l + D + "و"] },
    { id: "madd-yaa", ar: "المَدُّ بِاليَاء", en: "Madd Yaa", sample: "بِي", make: (l) => [(l === "أ" ? "إ" + K + "ي" : l + K + "ي")] },
  ] },
  { id: "tanween", ar: "التَّنْوِينُ", en: "Tanween", accent: "bg-stage-gold", mark: "بً", sets: [
    { id: "tanween-fath", ar: "تَنْوِينُ الفَتْح", en: "Tanween Fath", sample: "بًا", make: (l) => [l + FT + "ا"] },
    { id: "tanween-damm", ar: "تَنْوِينُ الضَّمّ", en: "Tanween Damm", sample: "بٌ", make: (l) => [l + DT] },
    { id: "tanween-kasr", ar: "تَنْوِينُ الكَسْر", en: "Tanween Kasr", sample: "بٍ", make: (l) => [(l === "أ" ? "إ" : l) + KT] },
  ] },
  { id: "shaddah", ar: "الشَّدَّةُ", en: "Shaddah", accent: "bg-stage-lavender", mark: "بّ", sets: [
    { id: "shaddah", ar: "الحُرُوفُ المُشَدَّدَةُ مَعَ الحَرَكَات", en: "Doubled Consonants With Vowels", sample: "بَّ بُّ بِّ", make: (l) => [l + SH + F, l + SH + D, l + SH + K] },
  ] },
];

const sukoonOk = (l: string) => l !== "أ" || true;
export const setItems = (s: SoundSet) => LETTERS.filter(sukoonOk).map((l) => ({ letter: l, units: s.make(l) }));
export const findSet = (id: string) => {
  for (const c of SOUND_CATEGORIES) { const s = c.sets.find((x) => x.id === id); if (s) return { category: c, set: s }; }
  return null;
};

const KEY = "qaf-sound-practice-v1";
type SP = Record<string, number[]>;
const read = (): SP => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } };
const subs = new Set<(p: SP) => void>();
export function markPracticed(setId: string, i: number) {
  const p = read(); const cur = p[setId] ?? [];
  if (cur.includes(i)) return;
  const next = { ...p, [setId]: [...cur, i] };
  localStorage.setItem(KEY, JSON.stringify(next)); subs.forEach((s) => s(next));
}
export function resetSet(setId: string) {
  const next = { ...read(), [setId]: [] };
  localStorage.setItem(KEY, JSON.stringify(next)); subs.forEach((s) => s(next));
}
export function useSoundProgress() {
  const [p, setP] = useState<SP>({});
  useEffect(() => { setP(read()); subs.add(setP); return () => { subs.delete(setP); }; }, []);
  return p;
}
export const setDone = (p: SP, s: SoundSet) => (p[s.id] ?? []).length;
export const setComplete = (p: SP, s: SoundSet) => setDone(p, s) >= LETTERS.length;
