import { useEffect, useMemo, useState } from "react";
import { Check, RotateCcw, Volume2, X } from "lucide-react";
import { Ar } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { WordIllustration } from "@/components/WordIllustration";
import { playUnit, playWord } from "@/lib/audio";
import { shuffle, type Word } from "@/lib/words";

export type QuizMode = "build" | "listen" | "picture";

export function PickQuestion({ w, opts, mode, onDone }: { w: Word; opts: Word[]; mode: QuizMode; onDone: (ok: boolean) => void }) {
  const [sel, setSel] = useState<number | null>(null);
  useEffect(() => { if (mode === "listen") playWord(w.ar); }, [w, mode]);
  return (
    <div>
      <div className="mb-5 py-4 text-center">
        <h2 className="mb-5 text-sm font-semibold text-muted-foreground">{mode === "listen" ? "Listen & choose" : "Match the picture"}</h2>
        {mode === "listen"
          ? <Button aria-label="Listen to the word" onClick={() => playWord(w.ar)} className="mx-auto h-24 w-24 rounded-full [&_svg]:size-9"><Volume2 /></Button>
          : <><WordIllustration word={w} /><p className="mt-3 font-medium">{w.en}</p></>}
      </div>
      <div className="grid grid-cols-1 gap-3" aria-label="Answer choices">
        {opts.map((o) => {
          const correct = sel !== null && o.id === w.id;
          const wrong = sel === o.id && o.id !== w.id;
          const state = correct ? "border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" : wrong ? "border-destructive bg-error-soft text-destructive" : sel !== null ? "border-border bg-muted text-muted-foreground" : "border-border bg-card text-primary";
          return (
            <Button variant="outline" key={o.id} aria-pressed={sel === o.id} disabled={sel !== null}
              onClick={() => { setSel(o.id); onDone(o.id === w.id); }}
              className={`answer-button relative w-full border disabled:opacity-100 ${state}`}>
              <Ar>{o.ar}</Ar>{correct && <Check className="absolute right-5 size-5" />}{wrong && <X className="absolute right-5 size-5" />}
            </Button>
          );
        })}
      </div>
      {sel !== null && <p role="status" className={`mt-4 flex min-h-10 items-center justify-center gap-2 text-sm font-semibold ${sel === w.id ? "text-success" : "text-destructive"}`}>{sel === w.id ? <><Check className="size-4" />Correct!</> : <><X className="size-4" />Not quite</>}</p>}
    </div>
  );
}

export function BuildQuestion({ w, words, onDone }: { w: Word; words: Word[]; onDone: (ok: boolean) => void }) {
  const blocks = useMemo(() => {
    const extra = shuffle(words.flatMap((x) => x.units).filter((u) => !w.units.includes(u))).slice(0, 2);
    return shuffle([...w.units, ...extra].map((u, k) => ({ u, k })));
  }, [w, words]);
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
      <div className="mb-4 py-2 text-center">
        <h2 className="mb-4 text-sm font-semibold text-muted-foreground">Build the word</h2>
        <WordIllustration word={w} />
        <p className="mt-2 font-medium">{w.en}</p>
        <Button variant="ghost" onClick={() => playWord(w.ar)} className="mt-1 text-primary"><Volume2 className="size-4" />Hear it</Button>
      </div>
      <div dir="rtl" aria-label="Your word" className="mb-5 grid grid-cols-3 gap-2">
        {w.units.map((_, k) => <div key={k} className={`word-slot ${picked[k] ? res === false ? "border-destructive bg-error-soft text-destructive" : "border-primary/20 bg-accent text-primary" : "border-dashed border-border bg-card"}`}><Ar>{picked[k]?.u ?? ""}</Ar></div>)}
      </div>
      <div dir="rtl" className="flex flex-wrap justify-center gap-3" aria-label="Sound choices">
        {blocks.map((b) => {
          const selected = picked.some((p) => p.k === b.k);
          return <Button variant="outline" key={b.k} aria-label={`Choose sound ${b.u}`} aria-pressed={selected}
            onClick={() => tap(b)} disabled={selected || res !== null}
            className={`sound-button disabled:opacity-100 ${selected ? "border-primary bg-primary text-primary-foreground" : "border-primary/20 bg-accent text-primary"}`}><Ar>{b.u}</Ar></Button>;
        })}
      </div>
      <div className="mt-3 flex min-h-12 items-center justify-center">
        {res === true && <p role="status" className="flex items-center gap-2 text-sm font-semibold text-success"><Check className="size-4" />Correct!</p>}
        {res === false && <p role="status" className="text-sm text-destructive">Answer: <Ar className="text-2xl">{w.ar}</Ar></p>}
        {picked.length > 0 && res === null && <Button variant="ghost" onClick={() => setPicked([])} className="text-muted-foreground"><RotateCcw className="size-4" />Clear</Button>}
      </div>
    </div>
  );
}