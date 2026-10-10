import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Mic, Volume2 } from "lucide-react";
import { AppShell, Ar } from "@/components/AppShell";
import { WORDS, shuffle, stripTashkeel } from "@/lib/words";
import { playWord, stopAudio } from "@/lib/audio";
import { touchStreak, update } from "@/lib/progress";

export const Route = createFileRoute("/test")({
  head: () => ({
    meta: [
      { title: "Reading test — Qaf" },
      { name: "description", content: "Read 10 Fatha words aloud and get instant pronunciation feedback." },
      { property: "og:title", content: "Reading test — Qaf" },
      { property: "og:description", content: "A 10-word Arabic reading assessment using your microphone." },
    ],
  }),
  component: Test,
});

type State = "idle" | "recording" | "analyzing" | "correct" | "wrong" | "denied" | "unsupported";

// Levenshtein similarity on unvowelled letters (recognisers drop harakat).
function similar(a: string, b: string) {
  const m = a.length, n = b.length;
  const d: number[][] = Array.from({ length: m + 1 }, (_, i) => [i, ...Array<number>(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0]![j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    d[i]![j] = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
  return 1 - d[m]![n]! / Math.max(m, n, 1);
}

function Test() {
  const [words, setWords] = useState(WORDS.slice(0, 10));
  const [i, setI] = useState(0);
  const [st, setSt] = useState<State>("idle");
  const [heard, setHeard] = useState("");
  const [correct, setCorrect] = useState(0);
  const rec = useRef<any>(null);
  const media = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const alts = useRef<string[]>([]);
  const w = (words[i] ?? WORDS[0])!;
  const finished = i >= words.length;

  useEffect(() => { setWords(shuffle(WORDS).slice(0, 10)); return () => { stopAudio(); stream.current?.getTracks().forEach((t) => t.stop()); }; }, []);

  const analyze = () => {
    setSt("analyzing");
    setTimeout(() => {
      const target = stripTashkeel(w.ar);
      const best = Math.max(0, ...alts.current.map((t) => similar(stripTashkeel(t), target)));
      setHeard(alts.current[0] ?? "");
      if (best >= 0.67) {
        setSt("correct"); setCorrect((c) => c + 1);
        setTimeout(() => { setI((x) => x + 1); setSt("idle"); setHeard(""); }, 1200);
      } else setSt("wrong");
    }, 600);
  };

  const start = async () => {
    if (st === "recording" || st === "analyzing" || st === "correct") return;
    stopAudio();
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!navigator.mediaDevices?.getUserMedia && !SR) return setSt("unsupported");
    try {
      if (!stream.current) stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch { return setSt("denied"); }
    alts.current = [];
    try { media.current = new MediaRecorder(stream.current); media.current.start(); } catch { /* capture optional */ }
    if (SR) {
      const r = new SR();
      r.lang = "ar-SA"; r.interimResults = true; r.maxAlternatives = 5; r.continuous = true;
      r.onresult = (e: any) => {
        for (let k = 0; k < e.results.length; k++) for (let a = 0; a < e.results[k].length; a++) alts.current.push(e.results[k][a].transcript);
      };
      r.onerror = (e: any) => { if (e.error === "not-allowed") setSt("denied"); };
      r.onend = () => { if (rec.current === r) { rec.current = null; analyze(); } };
      rec.current = r;
      try { r.start(); } catch { /* already started */ }
    }
    setSt("recording");
  };

  const stop = () => {
    if (st !== "recording") return;
    try { media.current?.state === "recording" && media.current.stop(); } catch { /* noop */ }
    if (rec.current) { setSt("analyzing"); rec.current.stop(); }
    else setSt("unsupported");
  };

  if (finished) {
    const pct = Math.round((correct / words.length) * 100);
    return (
      <AppShell title="Reading test">
        <div className="rounded-3xl bg-card border border-border p-8 text-center">
          <p className="text-6xl">🎉</p>
          <h2 className="mt-3 text-2xl font-bold">Test complete</h2>
          <p className="mt-2 text-muted-foreground">You read {correct} of {words.length} words · {pct}%</p>
          <button className="mt-6 rounded-2xl bg-primary px-6 py-3 font-semibold text-primary-foreground" onClick={() => {
            update((p) => ({ ...p, scores: [...p.scores, pct] })); touchStreak();
            setWords(shuffle(WORDS).slice(0, 10)); setI(0); setCorrect(0); setSt("idle");
          }}>Save & try again</button>
        </div>
      </AppShell>
    );
  }

  const msg: Record<State, string> = {
    idle: "Press and hold the mic, read the word, then release.",
    recording: "Listening… release when done",
    analyzing: "Checking your reading…",
    correct: "Correct! ✓",
    wrong: "Try again",
    denied: "Microphone access was blocked. Allow it in your browser settings, then tap the mic again.",
    unsupported: "Pronunciation checking isn't supported in this browser. Try Chrome or Safari.",
  };

  return (
    <AppShell title="Reading test">
      <div className="mb-3 flex justify-between text-sm text-muted-foreground"><span>Word {i + 1} of 10</span><span>{correct} correct</span></div>
      <div className="mb-4 flex gap-1">{words.map((_, k) => <div key={k} className={`h-1.5 flex-1 rounded-full ${k < i ? "bg-primary" : "bg-muted"}`} />)}</div>
      <div className="rounded-3xl border border-border bg-card p-8 text-center">
        <p className="mb-2 text-sm text-muted-foreground">Read this word aloud</p>
        <Ar className="block text-7xl leading-relaxed">{w.ar}</Ar>
        <p className={`mt-4 min-h-12 text-sm font-medium ${st === "correct" ? "text-primary text-lg" : st === "wrong" || st === "denied" ? "text-destructive" : "text-muted-foreground"}`}>{msg[st]}</p>
        {st === "wrong" && heard && <p className="text-xs text-muted-foreground">We heard: <Ar>{heard}</Ar></p>}
      </div>
      <div className="mt-8 flex flex-col items-center gap-4">
        <button aria-label="Press and hold to record"
          onPointerDown={(e) => { e.preventDefault(); start(); }}
          onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop} onContextMenu={(e) => e.preventDefault()}
          className={`flex h-24 w-24 touch-none select-none items-center justify-center rounded-full text-primary-foreground transition ${st === "recording" ? "scale-110 bg-destructive animate-pulse" : "bg-primary"}`}>
          <Mic className="h-10 w-10" />
        </button>
        {(st === "wrong" || st === "idle" || st === "denied") && (
          <button onClick={() => playWord(w.ar)} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm">
            <Volume2 className="h-4 w-4" /> Hear the word
          </button>
        )}
        {st === "wrong" && <button className="text-sm text-muted-foreground" onClick={() => { setI((x) => x + 1); setSt("idle"); }}>Skip</button>}
      </div>
    </AppShell>
  );
}
