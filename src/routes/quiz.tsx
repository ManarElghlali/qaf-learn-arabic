import type React from "react";
import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, RotateCcw, Volume2, X } from "lucide-react";
import { AppShell, Ar } from "@/components/AppShell";
import { shuffle, type Word } from "@/lib/words";
import { LESSONS, parseLesson } from "@/lib/lessons";
import { LessonSwitch } from "@/components/LessonSwitch";
import { playUnit, playWord, stopAudio } from "@/lib/audio";
import { Button } from "@/components/ui/button";
import { WordIllustration } from "@/components/WordIllustration";

export const Route = createFileRoute("/quiz")({
  validateSearch: (s: Record<string, unknown>) => ({ lesson: parseLesson(s["lesson"]) }),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Fatha quiz — Qaf" },
      { name: "description", content: "Build words, listen and pick, and match pictures to Fatha words." },
      { property: "og:title", content: "Fatha quiz — Qaf" },
      { property: "og:description", content: "Three quiz modes to practise reading Arabic." },
    ],
  }),
  component: () => <ClientOnly fallback={<AppShell title="Quiz"><div className="h-96" aria-busy="true" /></AppShell>}><QuizRoute /></ClientOnly>,
});

type Mode = "build" | "listen" | "picture";

function QuizRoute() {
  const { lesson } = Route.useSearch();
  return <Quiz key={lesson} words={LESSONS[lesson].words} label={LESSONS[lesson].en} switcher={<LessonSwitch to="/quiz" current={lesson} />} />;
}

function Quiz({ words: WORDS, label, switcher }: { words: Word[]; label: string; switcher: React.ReactNode }) {
  const [n, setN] = useState(0);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState<number[]>([]);
  // adaptive: half the time re-ask a missed word
  const q = useMemo(() => {
    const pool: typeof WORDS = misses.length && Math.random() < 0.5 ? WORDS.filter((w) => misses.includes(w.id)) : WORDS;
    const w = pool[Math.floor(Math.random() * pool.length)]!;
    const mode = (["build", "listen", "picture"] as Mode[])[n % 3]!;
    return { w, mode, opts: shuffle([w, ...shuffle(WORDS.filter((x) => x.id !== w.id)).slice(0, 3)]) };
  }, [n]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => stopAudio(), []);
  const done = (ok: boolean) => {
    if (ok) { setScore((s) => s + 1); setMisses((m) => m.filter((id) => id !== q.w.id)); }
    else setMisses((m) => [...new Set([...m, q.w.id])]);
    setTimeout(() => setN((x) => x + 1), 900);
  };
  return (
    <AppShell title="Quiz">
      {switcher}
      <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-xs text-muted-foreground"><span>{label} · Question {n + 1}</span><span className="flex items-center gap-1.5 rounded-lg bg-accent px-2.5 py-1.5 font-semibold text-primary"><Check className="h-3.5 w-3.5" />{score} correct</span></div>
      {q.mode === "build" && <Build key={n} w={q.w} words={WORDS} onDone={done} />}
      {q.mode !== "build" && <Pick key={n} w={q.w} opts={q.opts} mode={q.mode} onDone={done} />}
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
