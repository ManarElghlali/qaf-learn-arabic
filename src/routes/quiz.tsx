import type React from "react";
import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, RotateCcw, Volume2, X } from "lucide-react";
import { AppShell, Ar } from "@/components/AppShell";
import { shuffle, type Word } from "@/lib/words";
import { LESSONS, parseLesson, unitState, recordUnitResult, QUIZ_LENGTH, PASS_PCT, type LessonId } from "@/lib/lessons";
import { UnitLocked } from "@/components/LessonSwitch";
import { update, useLoadedProgress } from "@/lib/progress";
import { Link } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { playUnit, playWord, stopAudio } from "@/lib/audio";
import { Button } from "@/components/ui/button";
import { WordIllustration } from "@/components/WordIllustration";

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

type Mode = "build" | "listen" | "picture";

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
  // adaptive: half the time re-ask a missed word
  const q = useMemo(() => {
    const pool: typeof WORDS = misses.length && Math.random() < 0.5 ? WORDS.filter((w) => misses.includes(w.id)) : WORDS;
    const w = pool[Math.floor(Math.random() * pool.length)]!;
    const mode = (["build", "listen", "picture"] as Mode[])[n % 3]!;
    return { w, mode, opts: shuffle([w, ...shuffle(WORDS.filter((x) => x.id !== w.id)).slice(0, 3)]) };
  }, [n, round]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => stopAudio(), []);
  const done = (ok: boolean) => {
    if (ok) { setScore((s) => s + 1); setMisses((m) => m.filter((id) => id !== q.w.id)); }
    else setMisses((m) => [...new Set([...m, q.w.id])]);
    setTimeout(() => setN((x) => x + 1), 900);
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
          {!passed && <p className="mt-1 text-xs text-muted-foreground">You need {PASS_PCT}% to unlock the {label} reading test.</p>}
          {passed && <Button asChild className="mt-6 w-full"><Link to="/test" search={{ lesson }}>Take the {label} reading test</Link></Button>}
          <Button variant={passed ? "outline" : "default"} className="mt-3 w-full" onClick={() => { setN(0); setScore(0); setMisses([]); setRound((r) => r + 1); }}>Try the quiz again</Button>
        </div>
      </AppShell>
    );
  }
  return (
    <AppShell title="Quiz">
      <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-xs text-muted-foreground"><span>{label} · Question {n + 1} of {total}</span><span className="flex items-center gap-1.5 rounded-lg bg-accent px-2.5 py-1.5 font-semibold text-primary"><Check className="h-3.5 w-3.5" />{score} correct</span></div>
      {q.mode === "build" && <Build key={`${round}-${n}`} w={q.w} words={WORDS} onDone={done} />}
      {q.mode !== "build" && <Pick key={`${round}-${n}`} w={q.w} opts={q.opts} mode={q.mode} onDone={done} />}
    </AppShell>
  );
}

function Pick({ w, opts, mode, onDone }: { w: Word; opts: Word[]; mode: Mode; onDone: (ok: boolean) => void }) {
  const [sel, setSel] = useState<number | null>(null);
  useEffect(() => { if (mode === "listen") playWord(w.ar); }, [w, mode]);
  return (
    <div>
      <div className="learning-surface mb-5 p-5 text-center">
        <p className="mb-4 text-base font-semibold">{mode === "listen" ? "Listen and pick the word" : "Match the picture to the word"}</p>
        {mode === "listen"
          ? <Button aria-label="Listen to the word" onClick={() => playWord(w.ar)} className="mx-auto h-20 w-20 rounded-full [&_svg]:size-7"><Volume2 className="h-10 w-10" /></Button>
          : <><WordIllustration word={w} /><p className="mt-2 font-medium">{w.en}</p></>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {opts.map((o) => {
          const st = sel === null ? "border-border" : o.id === w.id ? "border-success bg-success-soft text-success" : sel === o.id ? "border-destructive bg-error-soft text-destructive" : "border-border opacity-50";
          return (
            <Button variant="outline" key={o.id} disabled={sel !== null} onClick={() => { setSel(o.id); onDone(o.id === w.id); }}
              className={`answer-button h-auto rounded-2xl border disabled:opacity-100 ${st}`}><Ar>{o.ar}</Ar></Button>
          );
        })}
      </div>
      {sel !== null && <p role="status" className={`mt-4 flex min-h-12 items-center justify-center gap-2 rounded-2xl text-sm font-semibold ${sel === w.id ? "bg-success-soft text-success" : "bg-error-soft text-destructive"}`}>{sel === w.id ? <><Check className="h-4 w-4" />Correct</> : <><X className="h-4 w-4" />Not quite</>}</p>}
    </div>
  );
}

function Build({ w, words: WORDS, onDone }: { w: Word; words: Word[]; onDone: (ok: boolean) => void }) {
  const blocks = useMemo(() => {
    const extra = shuffle(WORDS.flatMap((x) => x.units).filter((u) => !w.units.includes(u))).slice(0, 2);
    return shuffle([...w.units, ...extra].map((u, k) => ({ u, k })));
  }, [w]);
  const [picked, setPicked] = useState<{ u: string; k: number }[]>([]);
  const [res, setRes] = useState<boolean | null>(null);
  const tap = (b: { u: string; k: number }) => {
    if (res !== null || picked.some((p) => p.k === b.k)) return;
    playUnit(b.u);
    const next = [...picked, b];
    setPicked(next);
    if (next.length === w.units.length) {
      const ok = next.map((p) => p.u).join("") === w.units.join("");
      setRes(ok); onDone(ok);
    }
  };
  return (
    <div>
      <div className="learning-surface mb-5 p-5 text-center">
        <p className="mb-4 text-base font-semibold">Build the word</p>
        <WordIllustration word={w} />
        <p className="mt-2 font-medium">{w.en}</p>
        <Button variant="ghost" onClick={() => playWord(w.ar)} className="mt-2 text-primary"><Volume2 className="h-4 w-4" />Hear it</Button>
      </div>
      <div dir="rtl" className={`mb-5 flex min-h-20 justify-center gap-2 rounded-2xl border-2 border-dashed p-3 ${res === true ? "border-primary" : res === false ? "border-destructive bg-error-soft text-destructive" : "border-border"}`}>
        {picked.map((p) => <span key={p.k} className="font-arabic text-4xl">{p.u}</span>)}
      </div>
      {res === true && <p role="status" className="mb-3 flex items-center justify-center gap-2 text-sm font-semibold text-success"><Check className="h-4 w-4" />Correct</p>}
      {res === false && <p className="mb-3 text-center text-sm">Answer: <Ar className="text-2xl">{w.ar}</Ar></p>}
      <div dir="rtl" className="flex flex-wrap justify-center gap-3">
        {blocks.map((b) => (
          <Button variant="secondary" key={b.k} onClick={() => tap(b)} disabled={picked.some((p) => p.k === b.k)}
            className="sound-button disabled:opacity-30"><Ar>{b.u}</Ar></Button>
        ))}
      </div>
      {picked.length > 0 && res === null && <Button variant="ghost" onClick={() => setPicked([])} className="mx-auto mt-4 flex text-muted-foreground"><RotateCcw className="h-4 w-4" />Clear</Button>}
    </div>
  );
}
