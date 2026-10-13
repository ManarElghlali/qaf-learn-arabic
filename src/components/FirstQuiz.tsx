import { useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, RotateCcw, Star, Volume2, X } from "lucide-react";
import { Ar } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { WordIllustration } from "@/components/WordIllustration";
import { playUnit, playWord, stopAudio } from "@/lib/audio";
import { WORDS } from "@/lib/words";
import { patchOnboarding, recordFirstCorrect, type Level } from "@/lib/onboarding";

type Q = { kind: "sound" | "word"; answer: string; choices: string[] };
const word = (ar: string) => WORDS.find((w) => w.ar === ar)!;

/** Three short questions built only from sounds shown on the "Learn by listening" screen (أَ كَ لَ) and existing recordings. */
export function firstQuizQuestions(level: Level | undefined): Q[] {
  const second: Q = level === "beginner" || !level
    ? { kind: "sound", answer: "لَ", choices: ["أَ", "لَ", "كَ"] }
    : { kind: "sound", answer: "بَ", choices: ["تَ", "مَ", "بَ"] };
  return [
    { kind: "sound", answer: "كَ", choices: ["كَ", "لَ", "أَ"] },
    second,
    { kind: "word", answer: "أَكَلَ", choices: ["كَتَبَ", "أَكَلَ", "جَلَسَ"] },
  ];
}

export function FirstQuiz({ level, onFinish }: { level: Level | undefined; onFinish: () => void }) {
  const qs = useMemo(() => firstQuizQuestions(level), [level]);
  const [n, setN] = useState(0);
  const [wrong, setWrong] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [rating, setRating] = useState<number | undefined>(undefined);
  const q = qs[n];
  const hear = () => { if (!q) return; if (q.kind === "sound") playUnit(q.answer); else playWord(q.answer); };
  useEffect(() => { if (q) { const t = setTimeout(hear, 300); return () => clearTimeout(t); } }, [n]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => stopAudio(), []);

  if (!q) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-success-soft"><Check className="h-10 w-10 text-success" /></span>
        <h2 className="text-2xl font-bold">You did it!</h2>
        <p className="max-w-xs text-muted-foreground">You heard Arabic sounds and read your first word, <Ar className="text-xl text-primary">أَكَلَ</Ar>.</p>
        <div className="mt-2 rounded-2xl border border-border p-3">
          <p className="text-xs text-muted-foreground">{rating ? "Thank you for your rating!" : "Enjoying Qaf so far? (optional)"}</p>
          <div className="mt-1 flex justify-center gap-1">{[1, 2, 3, 4, 5].map((r) => (
            <button key={r} type="button" aria-label={`Rate ${r} of 5`} aria-pressed={rating === r} onClick={() => { setRating(r); patchOnboarding({ rating: r }); }} className="grid h-11 w-11 place-items-center rounded-full">
              <Star className={`h-6 w-6 ${rating && r <= rating ? "fill-gold text-gold" : "text-muted-foreground"}`} />
            </button>
          ))}</div>
        </div>
        <Button className="mt-2 h-14 w-full rounded-full text-base" onClick={onFinish}>Continue<ChevronRight /></Button>
      </div>
    );
  }

  const choose = (c: string) => {
    if (solved || wrong.includes(c)) return;
    if (c === q.answer) {
      setSolved(true);
      if (wrong.length === 0) recordFirstCorrect();
      if (q.kind === "sound") playUnit(c); else playWord(c);
    } else setWrong((w) => [...w, c]);
  };
  const next = () => { stopAudio(); setWrong([]); setSolved(false); setN(n + 1); if (n + 1 === qs.length) patchOnboarding({ firstQuizDone: true }); };
  const w = q.kind === "word" ? word(q.answer) : null;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-3 text-xs text-muted-foreground"><span>Question {n + 1} of {qs.length}</span><progress value={n} max={qs.length} aria-label="First quiz progress" className="qaf-progress h-1.5 flex-1" /></div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <h2 className="text-lg font-bold">{q.kind === "sound" ? "Which sound did you hear?" : "Which word did you hear?"}</h2>
        {w && <><WordIllustration word={w} className="w-28" /><p className="text-sm font-medium">{w.en}</p></>}
        <Button aria-label={q.kind === "sound" ? "Play the sound again" : "Play the word again"} onClick={hear} className="h-16 w-16 rounded-full [&_svg]:size-7"><Volume2 /></Button>
      </div>
      <div className="grid grid-cols-1 gap-2" aria-label="Answer choices">{q.choices.map((c) => {
        const isRight = solved && c === q.answer, isWrong = wrong.includes(c);
        return (
          <Button key={c} variant="outline" aria-pressed={isRight || isWrong} disabled={solved || isWrong} onClick={() => choose(c)}
            className={`answer-button relative h-16 w-full border text-3xl disabled:opacity-100 ${isRight ? "border-primary bg-primary text-primary-foreground" : isWrong ? "border-destructive bg-error-soft text-destructive" : "border-border bg-card text-primary"}`}>
            <Ar>{c}</Ar>{isRight && <Check className="absolute right-5 size-5" />}{isWrong && <X className="absolute right-5 size-5" />}
          </Button>
        );
      })}</div>
      <div className="min-h-6 text-center" role="status">
        {solved ? <p className="flex items-center justify-center gap-2 text-sm font-semibold text-success"><Check className="size-4" />Correct!</p>
          : wrong.length > 0 ? <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground"><RotateCcw className="size-4" />Not quite — listen again and try another.</p> : null}
      </div>
      <Button disabled={!solved} className="h-14 w-full rounded-full text-base" onClick={next}>{n === qs.length - 1 ? "Finish" : "Continue"}<ChevronRight /></Button>
    </div>
  );
}

