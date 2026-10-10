import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Volume2 } from "lucide-react";
import { AppShell, Ar } from "@/components/AppShell";
import { WORDS } from "@/lib/words";
import { playUnit, playWord, stopAudio } from "@/lib/audio";
import { touchStreak, update, useProgress } from "@/lib/progress";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Learn Fatha words — Qaf" },
      { name: "description", content: "Tap each sound unit and hear the full word for 42 Fatha words." },
      { property: "og:title", content: "Learn Fatha words — Qaf" },
      { property: "og:description", content: "Segmented sound units, audio and meanings for every word." },
    ],
  }),
  component: Learn,
});

function Learn() {
  const p = useProgress();
  const [i, setI] = useState(0);
  const w = WORDS[i]!;
  useEffect(() => () => stopAudio(), []);
  const go = (d: number) => {
    update((s) => (s.learned.includes(w.id) ? s : { ...s, learned: [...s.learned, w.id] }));
    touchStreak();
    setI((x) => Math.min(WORDS.length - 1, Math.max(0, x + d)));
  };
  return (
    <AppShell title="Fatha · الفتحة">
      <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
        <span>Word {i + 1} of {WORDS.length}</span>
        <label className="flex items-center gap-2">Transliteration
          <input type="checkbox" checked={p.translit} onChange={(e) => update((s) => ({ ...s, translit: e.target.checked }))} className="accent-primary" />
        </label>
      </div>
      <div className="mb-4 h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${((i + 1) / WORDS.length) * 100}%` }} /></div>
      <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-sm">
        <button aria-label="Play word" onClick={() => playWord(w.ar)} className="mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-accent text-6xl">{w.icon}</button>
        <Ar className="block text-6xl leading-relaxed">{w.ar}</Ar>
        {p.translit && <p className="mt-1 text-muted-foreground">{w.tr}</p>}
        <p className="mt-1 font-medium">{w.en}</p>
        <div dir="rtl" className="mt-6 flex justify-center gap-3">
          {w.units.map((u, k) => (
            <button key={k} onClick={() => playUnit(u)} className="h-16 w-16 rounded-2xl border-2 border-primary/30 bg-background text-3xl active:scale-95">
              <Ar>{u}</Ar>
            </button>
          ))}
        </div>
        <button onClick={() => playWord(w.ar)} className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground">
          <Volume2 className="h-5 w-5" /> Listen
        </button>
      </div>
      <div className="mt-5 flex gap-3">
        <button disabled={i === 0} onClick={() => go(-1)} className="flex flex-1 items-center justify-center gap-1 rounded-2xl border border-border py-3 disabled:opacity-40"><ChevronLeft className="h-4 w-4" />Back</button>
        <button onClick={() => go(1)} className="flex flex-1 items-center justify-center gap-1 rounded-2xl bg-secondary py-3 font-semibold">Next<ChevronRight className="h-4 w-4" /></button>
      </div>
    </AppShell>
  );
}
