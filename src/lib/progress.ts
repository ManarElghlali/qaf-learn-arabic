import { useEffect, useState } from "react";

export type UnitRecord = { quizBest?: number; quizPassed?: boolean; testBest?: number; testPassed?: boolean };
export type Progress = {
  learned: number[]; learnedKasra: number[]; learnedThree: number[]; streak: number; lastDay: string; scores: number[];
  reminders: boolean; premium: boolean; translit: boolean;
  units: Record<string, UnitRecord>;
};
const KEY = "qaf-progress-v1";
const def: Progress = { learned: [], learnedKasra: [], learnedThree: [], streak: 0, lastDay: "", scores: [], reminders: false, premium: false, translit: true, units: {} };

export function readProgress(): Progress {
  try { return { ...def, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return def; }
}
const subs = new Set<(p: Progress) => void>();

export function update(fn: (p: Progress) => Progress) {
  const next = fn(readProgress());
  localStorage.setItem(KEY, JSON.stringify(next));
  subs.forEach((s) => s(next));
}

export function touchStreak() {
  const today = new Date().toDateString();
  update((p) => {
    if (p.lastDay === today) return p;
    const y = new Date(Date.now() - 864e5).toDateString();
    return { ...p, lastDay: today, streak: p.lastDay === y ? p.streak + 1 : 1 };
  });
}

/** Saved progress, or null until it has been read in the browser (avoids flashing locked states). */
export function useLoadedProgress() {
  const [p, setP] = useState<Progress | null>(null);
  useEffect(() => { setP(readProgress()); subs.add(setP); return () => { subs.delete(setP); }; }, []);
  return p;
}

export function useProgress() {
  const [p, setP] = useState<Progress>(def);
  useEffect(() => { setP(readProgress()); subs.add(setP); return () => { subs.delete(setP); }; }, []);
  return p;
}
