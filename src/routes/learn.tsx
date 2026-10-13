import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Volume2 } from "lucide-react";
import { AppShell, Ar } from "@/components/AppShell";
import { LESSONS, parseLesson, lessonLearned, unitState } from "@/lib/lessons";
import { UnitLocked } from "@/components/LessonSwitch";
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
      { title: "Learn Arabic Sounds — Qaf" },
      { name: "description", content: "Practise illustrated words and grouped Short Sounds, Madd and Tanween sounds in your selected Arabic unit." },
      { property: "og:title", content: "Learn Arabic Sounds — Qaf" },
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
  const [selectedSound, setSelectedSound] = useState<number | null>(null);
  const w = WORDS[i];
  useEffect(() => { setI(learningSummary(lessonLearned(readProgress(), lesson), WORDS).resumeIndex); return () => stopAudio(); }, [lesson]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setSelectedSound(null); stopAudio(); }, [i, lesson]);
  if (!w) return null;
  if (lp && !unitState(lp, lesson).unlocked) return <AppShell title={`${L.en} · ${L.ar}`}><UnitLocked id={lesson} progress={lp} need="unit" /></AppShell>;
  const unit = lp ? unitState(lp, lesson) : null;
  const go = (d: number) => {
    update((s) => (s[L.key].includes(w.id) ? s : { ...s, [L.key]: [...s[L.key], w.id] }));
    touchStreak();
    setI((x) => Math.min(WORDS.length - 1, Math.max(0, x + d)));
  };
  return (
    <AppShell title={`${L.en} · ${L.ar}`} singleScreen>
      <div className="activity-meta grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-xs text-muted-foreground">
        <span>Word {i + 1} of {WORDS.length}</span>
        <label className="flex items-center gap-2">Transliteration
          <input type="checkbox" checked={p.translit} onChange={(e) => update((s) => ({ ...s, translit: e.target.checked }))} className="accent-primary" />
        </label>
      </div>
      <progress aria-label="Lesson progress" className="qaf-progress h-1.5 w-full shrink-0" value={i + 1} max={WORDS.length} />
      <div className="learning-surface lesson-content text-center">
        <Button variant="ghost" aria-label="Play word" onClick={() => { setSelectedSound(null); playWord(w.ar); }} className="lesson-art mx-auto rounded-2xl p-0"><WordIllustration word={w} /></Button>
        <div className="lesson-word">
          <Ar className="block font-semibold">{w.ar}</Ar>
          {p.translit && <p className="text-sm text-muted-foreground">{w.tr}</p>}
          <p className="text-sm font-medium">{w.en}</p>
        </div>
        <div dir="rtl" className="lesson-sounds flex justify-center gap-3">
          {w.units.map((u, k) => (
            <Button key={k} variant="outline" aria-label={`Play sound ${u}`} aria-pressed={selectedSound === k} onClick={() => { setSelectedSound(k); playUnit(u); }} className={`sound-button ${selectedSound === k ? "border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" : "border-primary/20 bg-accent text-primary"}`}>
              <Ar>{u}</Ar>
            </Button>
          ))}
        </div>
        <Button onClick={() => { setSelectedSound(null); playWord(w.ar); }} className="activity-command w-full shrink-0">
          <Volume2 className="h-5 w-5" /> Listen to the word
        </Button>
      </div>
      <div className="activity-actions flex gap-3">
        <Button variant="outline" disabled={i === 0} onClick={() => go(-1)} className="activity-command min-w-0 flex-1"><ChevronLeft className="h-4 w-4" />Previous</Button>
        <Button onClick={() => go(1)} className="activity-command min-w-0 flex-1">{i === WORDS.length - 1 ? "Finish lesson" : "Next"}<ChevronRight className="h-4 w-4" /></Button>
      </div>
      {unit?.lessonsDone && (
        <div className="lesson-completion grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <p className="text-xs font-semibold text-primary">{unit.complete ? "Unit complete" : `All ${unit.total} words learned`}</p>
          <Button asChild variant="outline" size="sm"><Link to={unit.step === "test" ? "/test" : "/quiz"} search={{ lesson }}>{unit.step === "test" ? "Take the test" : "Take the quiz"}<ChevronRight /></Link></Button>
        </div>
      )}
    </AppShell>
  );
}
