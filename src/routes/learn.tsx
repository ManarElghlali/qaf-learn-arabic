import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Volume2 } from "lucide-react";
import { AppShell, Ar } from "@/components/AppShell";
import { LESSONS, parseLesson, lessonLearned, unitState } from "@/lib/lessons";
import { LessonSwitch, UnitLocked } from "@/components/LessonSwitch";
import { playUnit, playWord, stopAudio } from "@/lib/audio";
import { touchStreak, update, useProgress, useLoadedProgress, readProgress } from "@/lib/progress";
import { WordIllustration } from "@/components/WordIllustration";
import { learningSummary } from "@/lib/learning-path";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/learn")({
  validateSearch: (s: Record<string, unknown>) => ({ lesson: parseLesson(s["lesson"]) }),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Learn Fatha words — Qaf" },
      { name: "description", content: "Tap each sound unit and hear the full word for 42 Fatha words." },
      { property: "og:title", content: "Learn Fatha words — Qaf" },
      { property: "og:description", content: "Segmented sound units, audio and meanings for every word." },
    ],
  }),
  component: Learn,
});

function Learn() {
  const { lesson } = Route.useSearch();
  const L = LESSONS[lesson];
  const WORDS = L.words;
  const p = useProgress();
  const lp = useLoadedProgress();
  const [i, setI] = useState(0);
  const w = WORDS[i];
  useEffect(() => { setI(learningSummary(lessonLearned(readProgress(), lesson), WORDS).resumeIndex); return () => stopAudio(); }, [lesson]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!w) return null;
  if (lp && !unitState(lp, lesson).unlocked) return <AppShell title={`${L.en} · ${L.ar}`}><LessonSwitch to="/learn" current={lesson} progress={lp} /><UnitLocked id={lesson} progress={lp} need="unit" /></AppShell>;
  const unit = lp ? unitState(lp, lesson) : null;
  const go = (d: number) => {
    update((s) => (s[L.key].includes(w.id) ? s : { ...s, [L.key]: [...s[L.key], w.id] }));
    touchStreak();
    setI((x) => Math.min(WORDS.length - 1, Math.max(0, x + d)));
  };
  return (
    <AppShell title={`${L.en} · ${L.ar}`}>
      {lp && <LessonSwitch to="/learn" current={lesson} progress={lp} />}
      <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-xs text-muted-foreground">
        <span>Word {i + 1} of {WORDS.length}</span>
        <label className="flex items-center gap-2">Transliteration
          <input type="checkbox" checked={p.translit} onChange={(e) => update((s) => ({ ...s, translit: e.target.checked }))} className="accent-primary" />
        </label>
      </div>
      <div className="mb-4 h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${((i + 1) / WORDS.length) * 100}%` }} /></div>
      <div className="learning-surface p-5 text-center">
        <Button variant="ghost" aria-label="Play word" onClick={() => playWord(w.ar)} className="mx-auto mb-2 block h-auto w-36 max-w-full rounded-2xl p-0"><WordIllustration word={w} className="w-36" /></Button>
        <Ar className="block text-6xl font-semibold leading-relaxed">{w.ar}</Ar>
        {p.translit && <p className="mt-1 text-muted-foreground">{w.tr}</p>}
        <p className="mt-1 font-medium">{w.en}</p>
        <div dir="rtl" className="mt-5 flex justify-center gap-3">
          {w.units.map((u, k) => (
            <Button key={k} variant="outline" aria-label={`Play sound ${u}`} onClick={() => playUnit(u)} className="sound-button border-primary/20 bg-accent text-primary">
              <Ar>{u}</Ar>
            </Button>
          ))}
        </div>
        <Button onClick={() => playWord(w.ar)} className="mt-5 w-full">
          <Volume2 className="h-5 w-5" /> Listen
        </Button>
      </div>
      <div className="mt-5 flex gap-3">
        <Button variant="outline" disabled={i === 0} onClick={() => go(-1)} className="flex-1"><ChevronLeft className="h-4 w-4" />Back</Button>
        <Button onClick={() => go(1)} className="flex-1">Next<ChevronRight className="h-4 w-4" /></Button>
      </div>
      {unit?.lessonsDone && (
        <div className="mt-4 rounded-2xl bg-accent p-4 text-center">
          <p className="text-sm font-semibold text-primary">{unit.complete ? `${L.en} unit complete` : `All ${unit.total} words learned`}</p>
          <p className="mt-1 text-xs text-muted-foreground">{unit.step === "quiz" ? "Next: the unit quiz" : unit.step === "test" ? "Next: the final reading test" : "You can review the words or retake the quiz and test."}</p>
          <Button asChild className="mt-3 w-full"><Link to={unit.step === "test" ? "/test" : "/quiz"} search={{ lesson }}>{unit.step === "test" ? "Take the reading test" : unit.step === "quiz" ? "Take the quiz" : "Practise with the quiz"}</Link></Button>
        </div>
      )}
    </AppShell>
  );
}
