import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Check, CircleAlert, LoaderCircle, Mic, Trophy, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell, Ar } from "@/components/AppShell";
import { shuffle, stripTashkeel } from "@/lib/words";
import { LESSONS, parseLesson, unitState, recordUnitResult, PASS_PCT, UNIT_ORDER } from "@/lib/lessons";
import { LessonSwitch, UnitLocked } from "@/components/LessonSwitch";
import { Link } from "@tanstack/react-router";
import { playWord, stopAudio } from "@/lib/audio";
import { touchStreak, update, useLoadedProgress, type Progress } from "@/lib/progress";

export const Route = createFileRoute("/test")({
  validateSearch: (s: Record<string, unknown>) => ({ lesson: parseLesson(s["lesson"]) }),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Reading test — Qaf" },
      { name: "description", content: "Read 10 Fatha or Fatha & Kasra words aloud and get instant pronunciation feedback." },
      { property: "og:title", content: "Reading test — Qaf" },
      { property: "og:description", content: "A 10-word Arabic reading assessment using your microphone." },
    ],
  }),
  component: TestRoute,
});

type State = "idle" | "recording" | "analyzing" | "correct" | "wrong" | "denied" | "unsupported" | "error";

// Recognisers drop harakat and often add ال / a final ة to single words; compare the core letters.
// They may also spell a word letter by letter ("ق، ر، أ"), so keep Arabic letters only.
export const normalizeHeard = (s: string) => stripTashkeel(s).replace(/[^\u0621-\u064A]/g, "").replace(/^ال/, "").replace(/ة$/, "");

// Levenshtein similarity on unvowelled letters.
function similar(a: string, b: string) {
  const m = a.length, n = b.length;
  const d: number[][] = Array.from({ length: m + 1 }, (_, i) => [i, ...Array<number>(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0]![j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    d[i]![j] = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
  return 1 - d[m]![n]! / Math.max(m, n, 1);
}

function TestRoute() {
  const { lesson } = Route.useSearch();
  const p = useLoadedProgress();
  if (!p) return <AppShell title="Reading test"><div className="h-96" aria-busy="true" /></AppShell>;
  const s = unitState(p, lesson);
  if (!s.unlocked) return <AppShell title="Reading test"><LessonSwitch to="/test" current={lesson} progress={p} /><UnitLocked id={lesson} progress={p} need="unit" /></AppShell>;
  return <Test key={lesson} lesson={lesson} progress={p} />;
}

function Test({ lesson, progress }: { lesson: ReturnType<typeof parseLesson>; progress: Progress }) {
  const WORDS = LESSONS[lesson].words;
  const [words, setWords] = useState(WORDS.slice(0, 10));
  const [i, setI] = useState(0);
  const [st, setSt] = useState<State>("idle");
  const [heard, setHeard] = useState("");
  const [correct, setCorrect] = useState(0);
  const media = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startedAt = useRef(0);
  const releaseEarly = useRef(false);
  const [errMsg, setErrMsg] = useState("");
  const w = (words[i] ?? WORDS[0])!;
  const finished = i >= words.length;
  useEffect(() => {
    if (!finished) return;
    const pct = Math.round((correct / words.length) * 100);
    update((p) => recordUnitResult({ ...p, scores: [...p.scores, pct] }, lesson, "test", pct)); touchStreak();
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setWords(shuffle(WORDS).slice(0, 10)); return () => { stopAudio(); media.current?.state === "recording" && media.current.stop(); stream.current?.getTracks().forEach((t) => t.stop()); }; }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const judge = (text: string) => {
    setHeard(text);
    if (similar(normalizeHeard(text), normalizeHeard(w.ar)) >= 0.67) {
      setSt("correct"); setCorrect((c) => c + 1);
      setTimeout(() => { setI((x) => x + 1); setSt("idle"); setHeard(""); }, 1200);
    } else setSt("wrong");
  };

  const analyze = async (blob: Blob) => {
    setSt("analyzing");
    try {
      const fd = new FormData();
      fd.append("file", new File([blob], "reading.webm", { type: blob.type.split(";")[0] || "audio/webm" }));
      const res = await fetch("/api/public/transcribe", { method: "POST", body: fd });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok) { setErrMsg(data.error ?? "Speech checking failed. Please try again."); setSt("error"); return; }
      judge(data.text ?? "");
    } catch { setErrMsg("Couldn't reach speech checking. Check your connection and try again."); setSt("error"); }
  };

  const start = async () => {
    if (st === "recording" || st === "analyzing" || st === "correct") return;
    stopAudio();
    releaseEarly.current = false;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") return setSt("unsupported");
    try {
      if (!stream.current) stream.current = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch { return setSt("denied"); }
    // Released while the permission prompt was open: don't start a stuck recording.
    if (releaseEarly.current) { setSt("idle"); return; }
    chunks.current = [];
    const mr = new MediaRecorder(stream.current);
    mr.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunks.current, { type: mr.mimeType || "audio/webm" });
      if (Date.now() - startedAt.current < 400 || blob.size < 1000) { setErrMsg("That was too short. Hold the mic, read the word, then release."); setSt("error"); return; }
      void analyze(blob);
    };
    media.current = mr;
    startedAt.current = Date.now();
    mr.start();
    setSt("recording");
  };

  const stop = () => {
    releaseEarly.current = true;
    if (media.current?.state === "recording") media.current.stop();
  };

  if (finished) {
    const pct = Math.round((correct / words.length) * 100);
    const passed = pct >= PASS_PCT;
    const next = UNIT_ORDER[UNIT_ORDER.indexOf(lesson) + 1];
    return (
      <AppShell title="Reading test">
        <LessonSwitch to="/test" current={lesson} progress={progress} />
        <div className="learning-surface p-7 text-center">
          <Trophy className="mx-auto h-12 w-12 text-gold" />
          <h2 className="mt-3 text-2xl font-bold">{passed ? `${LESSONS[lesson].en} unit complete` : "Test complete"}</h2>
          <p className="mt-2 text-muted-foreground">You read {correct} of {words.length} words · {pct}%</p>
          {!passed && <p className="mt-1 text-xs text-muted-foreground">You need {PASS_PCT}% to complete this unit.</p>}
          {passed && next && <Button asChild className="mt-6 w-full"><Link to="/learn" search={{ lesson: next }}>Start {LESSONS[next].en}</Link></Button>}
          {passed && !next && <Button asChild className="mt-6 w-full"><Link to="/">Back to Home</Link></Button>}
          <Button variant={passed ? "outline" : "default"} className="mt-3 w-full" onClick={() => {
            setWords(shuffle(WORDS).slice(0, 10)); setI(0); setCorrect(0); setSt("idle");
          }}>Try the test again</Button>
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
    unsupported: "Recording isn't supported in this browser. Try an up-to-date Chrome or Safari.",
    error: errMsg,
  };

  return (
    <AppShell title="Reading test">
      <LessonSwitch to="/test" current={lesson} progress={progress} />
      <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-xs text-muted-foreground"><span>{LESSONS[lesson].en} · Word {i + 1} of {words.length}</span><span>{correct} correct</span></div>
      <div className="mb-4 flex gap-1">{words.map((_, k) => <div key={k} className={`h-1.5 flex-1 rounded-full ${k < i ? "bg-primary" : "bg-muted"}`} />)}</div>
      <div className="learning-surface p-6 text-center">
        <p className="mb-2 text-sm text-muted-foreground">Read this word aloud</p>
        <Ar className="block text-7xl font-semibold leading-relaxed">{w.ar}</Ar>
        <p role="status" aria-live="polite" className={`mt-4 flex min-h-16 items-center justify-center gap-2 rounded-2xl p-3 text-sm font-medium ${st === "correct" ? "bg-success-soft text-success" : st === "wrong" || st === "denied" || st === "error" ? "bg-error-soft text-destructive" : "bg-accent text-muted-foreground"}`}>{st === "correct" && <Check className="h-4 w-4 shrink-0" />}{(st === "wrong" || st === "denied" || st === "unsupported" || st === "error") && <CircleAlert className="h-4 w-4 shrink-0" />}{st === "analyzing" && <LoaderCircle className="h-4 w-4 shrink-0 animate-spin" />}{msg[st]}</p>
        {st === "wrong" && heard && <p className="text-xs text-muted-foreground">We heard: <Ar>{heard}</Ar></p>}
      </div>
      <div className="mt-8 flex flex-col items-center gap-4">
        <Button disabled={st === "analyzing" || st === "correct"} aria-label="Press and hold to record" aria-pressed={st === "recording"}
          onPointerDown={(e) => { e.preventDefault(); start(); }}
          onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop} onContextMenu={(e) => e.preventDefault()}
          className={`mic-button touch-none select-none ${st === "recording" ? "recording-state bg-destructive" : "bg-primary"}`}>
          {st === "analyzing" ? <LoaderCircle className="animate-spin" /> : st === "correct" ? <Check /> : <Mic />}
        </Button>
        {(st === "wrong" || st === "idle" || st === "denied" || st === "error") && (
          <Button variant="outline" onClick={() => playWord(w.ar)}>
            <Volume2 className="h-4 w-4" /> Hear the word
          </Button>
        )}
        {st === "wrong" && <Button variant="ghost" className="text-muted-foreground" onClick={() => { setI((x) => x + 1); setSt("idle"); }}>Skip</Button>}
      </div>
    </AppShell>
  );
}
