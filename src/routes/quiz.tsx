import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Volume2 } from "lucide-react";
import { AppShell, Ar } from "@/components/AppShell";
import { WORDS, shuffle, type Word } from "@/lib/words";
import { playUnit, playWord, stopAudio } from "@/lib/audio";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "Fatha quiz — Qaf" },
      { name: "description", content: "Build words, listen and pick, and match pictures to Fatha words." },
      { property: "og:title", content: "Fatha quiz — Qaf" },
      { property: "og:description", content: "Three quiz modes to practise reading Arabic." },
    ],
  }),
  component: Quiz,
});

type Mode = "build" | "listen" | "picture";

function Quiz() {
  const [n, setN] = useState(0);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState<number[]>([]);
  // adaptive: half the time re-ask a missed word
  const q = useMemo(() => {
    const pool: typeof WORDS = misses.length && Math.random() < 0.5 ? WORDS.filter((w) => misses.includes(w.id)) : WORDS;
    const w = pool[Math.floor(Math.random() * pool.length)]!;
    const mode = (["build", "listen", "picture"] as Mode[])[n % 3];
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
      <p className="mb-4 text-sm text-muted-foreground">Score {score} · Question {n + 1}</p>
      {q.mode === "build" && <Build key={n} w={q.w} onDone={done} />}
      {q.mode !== "build" && <Pick key={n} w={q.w} opts={q.opts} mode={q.mode} onDone={done} />}
    </AppShell>
  );
}

function Pick({ w, opts, mode, onDone }: { w: Word; opts: Word[]; mode: Mode; onDone: (ok: boolean) => void }) {
  const [sel, setSel] = useState<number | null>(null);
  useEffect(() => { if (mode === "listen") playWord(w.ar); }, [w, mode]);
  return (
    <div>
      <div className="mb-5 rounded-3xl bg-card p-6 text-center border border-border">
        <p className="mb-3 text-sm text-muted-foreground">{mode === "listen" ? "Listen and pick the word" : "Match the picture to the word"}</p>
        {mode === "listen"
          ? <button onClick={() => playWord(w.ar)} className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary text-primary-foreground"><Volume2 className="h-10 w-10" /></button>
          : <><div className="text-7xl">{w.icon}</div><p className="mt-2 font-medium">{w.en}</p></>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {opts.map((o) => {
          const st = sel === null ? "border-border" : o.id === w.id ? "border-primary bg-accent" : sel === o.id ? "border-destructive" : "border-border opacity-50";
          return (
            <button key={o.id} disabled={sel !== null} onClick={() => { setSel(o.id); onDone(o.id === w.id); }}
              className={`rounded-2xl border-2 bg-card py-5 text-4xl ${st}`}><Ar>{o.ar}</Ar></button>
          );
        })}
      </div>
    </div>
  );
}

function Build({ w, onDone }: { w: Word; onDone: (ok: boolean) => void }) {
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
      <div className="mb-5 rounded-3xl border border-border bg-card p-6 text-center">
        <p className="mb-2 text-sm text-muted-foreground">Build the word</p>
        <div className="text-6xl">{w.icon}</div>
        <p className="mt-2 font-medium">{w.en}</p>
        <button onClick={() => playWord(w.ar)} className="mt-2 inline-flex items-center gap-1 text-sm text-primary"><Volume2 className="h-4 w-4" />Hear it</button>
      </div>
      <div dir="rtl" className={`mb-5 flex min-h-20 justify-center gap-2 rounded-2xl border-2 border-dashed p-3 ${res === true ? "border-primary" : res === false ? "border-destructive" : "border-border"}`}>
        {picked.map((p) => <span key={p.k} className="font-arabic text-4xl">{p.u}</span>)}
      </div>
      {res === false && <p className="mb-3 text-center text-sm">Answer: <Ar className="text-2xl">{w.ar}</Ar></p>}
      <div dir="rtl" className="flex flex-wrap justify-center gap-3">
        {blocks.map((b) => (
          <button key={b.k} onClick={() => tap(b)} disabled={picked.some((p) => p.k === b.k)}
            className="h-16 w-16 rounded-2xl bg-secondary text-3xl disabled:opacity-30"><Ar>{b.u}</Ar></button>
        ))}
      </div>
      {picked.length > 0 && res === null && <button onClick={() => setPicked([])} className="mx-auto mt-4 block text-sm text-muted-foreground">Clear</button>}
    </div>
  );
}
