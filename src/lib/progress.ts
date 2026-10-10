import { useEffect, useState } from "react";

export type Progress = {
  learned: number[]; streak: number; lastDay: string; scores: number[];
  reminders: boolean; premium: boolean; translit: boolean;
};
const KEY = "qaf-progress-v1";
const def: Progress = { learned: [], streak: 0, lastDay: "", scores: [], reminders: false, premium: false, translit: true };

function read(): Progress {
  try { return { ...def, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return def; }
}
const subs = new Set<(p: Progress) => void>();

export function update(fn: (p: Progress) => Progress) {
  const next = fn(read());
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

export function useProgress() {
  const [p, setP] = useState<Progress>(def);
  useEffect(() => { setP(read()); subs.add(setP); return () => { subs.delete(setP); }; }, []);
  return p;
}
