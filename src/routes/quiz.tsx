import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { AppShell, Ar } from "@/components/AppShell";
import { shuffle, type Word } from "@/lib/words";
import { LESSONS, parseLesson, unitState, recordUnitResult, QUIZ_LENGTH, PASS_PCT, type LessonId } from "@/lib/lessons";
import { UnitLocked } from "@/components/LessonSwitch";
import { update, useLoadedProgress } from "@/lib/progress";
import { Link } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { stopAudio } from "@/lib/audio";
import { Button } from "@/components/ui/button";
import { BuildQuestion, PickQuestion, type QuizMode } from "@/components/QuizQuestion";

export const Route = createFileRoute("/quiz")({
  validateSearch: (s: Record<string, unknown>) => ({ lesson: parseLesson(s["lesson"]) }),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Unit quiz — Qaf" },
      { name: "description", content: "Build words, listen and pick, and match pictures to the words of each Short Sounds unit." },
      { property: "og:title", content: "Unit quiz — Qaf" },
      { property: "og:description", content: "Three quiz modes to practise reading Arabic." },
    ],
  }),
  component: () => <ClientOnly fallback={<AppShell title="Quiz"><div className="h-96" aria-busy="true" /></AppShell>}><QuizRoute /></ClientOnly>,
});


function QuizRoute() {
  const { lesson } = Route.useSearch();
  const p = useLoadedProgress();
  if (!p) return <AppShell title="Quiz"><div className="h-96" aria-busy="true" /></AppShell>;
  const s = unitState(p, lesson);
  if (!s.unlocked) return <AppShell title="Quiz"><UnitLocked id={lesson} progress={p} need="unit" /></AppShell>;
  return <Quiz key={lesson} lesson={lesson} words={LESSONS[lesson].words} label={LESSONS[lesson].en} />;
}

function Quiz({ lesson, words: WORDS, label }: { lesson: LessonId; words: Word[]; label: string }) {
  const [n, setN] = useState(0);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState<number[]>([]);
  const [round, setRound] = useState(0);
  const [answered, setAnswered] = useState(false);
  // adaptive: half the time re-ask a missed word
  const q = useMemo(() => {
    const pool: typeof WORDS = misses.length && Math.random() < 0.5 ? WORDS.filter((w) => misses.includes(w.id)) : WORDS;
    const w = pool[Math.floor(Math.random() * pool.length)] ?? WORDS[0];
    if (!w) return null;
    const mode: QuizMode = n % 3 === 0 ? "build" : n % 3 === 1 ? "listen" : "picture";
    return { w, mode, opts: shuffle([w, ...shuffle(WORDS.filter((x) => x.id !== w.id)).slice(0, 3)]) };
  }, [n, round]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => stopAudio(), []);
  const done = (ok: boolean) => {
    if (!q || answered) return;
    setAnswered(true);
    if (ok) { setScore((s) => s + 1); setMisses((m) => m.filter((id) => id !== q.w.id)); }
    else setMisses((m) => [...new Set([...m, q.w.id])]);

  };
  const total = Math.min(QUIZ_LENGTH, WORDS.length);
  const finished = n >= total;
  useEffect(() => { if (finished) update((p) => recordUnitResult(p, lesson, "quiz", Math.round(score / total * 100))); }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps
  if (finished) {
    const pct = Math.round(score / total * 100);
    const passed = pct >= PASS_PCT;
    return (
      <AppShell title="Quiz">
        <div className="learning-surface p-7 text-center">
          <Trophy className={`mx-auto h-12 w-12 ${passed ? "text-gold" : "text-muted-foreground"}`} />
          <h2 className="mt-3 text-2xl font-bold">{passed ? "Quiz passed" : "Keep practising"}</h2>
          <p className="mt-2 text-muted-foreground">{score} of {total} correct · {pct}%</p>
          {!passed && <p className="mt-1 text-xs text-muted-foreground">You need {PASS_PCT}% to pass this unit’s quiz.</p>}
          {passed && <Button asChild className="mt-6 w-full"><Link to="/test" search={{ lesson }}>Take the {label} reading test</Link></Button>}
          <Button variant={passed ? "outline" : "default"} className="mt-3 w-full" onClick={() => { setN(0); setScore(0); setMisses([]); setAnswered(false); setRound((r) => r + 1); }}>Try the quiz again</Button>
        </div>
      </AppShell>
    );
  }
  if (!q) return null;
  return (
    <AppShell title="Quiz">
      <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-xs text-muted-foreground"><span>{label} · Question {n + 1} of {total}</span><span className="flex items-center gap-1.5 rounded-lg bg-accent px-2.5 py-1.5 font-semibold text-primary"><Check className="h-3.5 w-3.5" />{score} correct</span></div>
      <progress aria-label="Quiz progress" className="qaf-progress mb-5 h-1.5 w-full" value={n} max={total} />
      {q.mode === "build" && <BuildQuestion key={`${round}-${n}`} w={q.w} words={WORDS} onDone={done} />}
      {q.mode !== "build" && <PickQuestion key={`${round}-${n}`} w={q.w} opts={q.opts} mode={q.mode} onDone={done} />}
      <Button disabled={!answered} className="mt-5 h-14 w-full" onClick={() => { stopAudio(); setAnswered(false); setN((x) => x + 1); }}>Continue<ChevronRight className="size-4" /></Button>
    </AppShell>
  );
}
