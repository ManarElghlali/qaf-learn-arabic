import { useLanguage } from "@/lib/i18n";
import { API_BASE, deviceId } from "@/lib/api";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Check, CircleAlert, LoaderCircle, Mic, Trophy, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell, Ar } from "@/components/AppShell";
import { shuffle } from "@/lib/words";
import { LESSONS, parseLesson, unitState, recordUnitResult, PASS_PCT, UNIT_ORDER } from "@/lib/lessons";
import { UnitLocked } from "@/components/LessonSwitch";
import { Link } from "@tanstack/react-router";
import { playWord, stopAudio } from "@/lib/audio";
import { Paywall } from "@/components/Paywall";
import { quotaStatus, type QuotaStatus } from "@/lib/purchases";
import { useAccess, canOpenUnit, FREE_WORDS } from "@/lib/access";
import { PremiumLocked } from "@/components/PremiumLock";
import { touchStreak, update, useLoadedProgress, type Progress } from "@/lib/progress";

export const Route = createFileRoute("/test")({
  validateSearch: (s: Record<string, unknown>) => ({ lesson: parseLesson(s["lesson"]) }),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Reading test — Qaf" },
      { name: "description", content: "Read your unit’s words aloud and get feedback on Arabic consonants, short vowels, Madd, Shaddah and Tanween endings." },
      { property: "og:title", content: "Reading test — Qaf" },
      { property: "og:description", content: "A 10-word Arabic reading assessment using your microphone." },
    ],
  }),
  component: TestRoute,
});

type State = "idle" | "recording" | "analyzing" | "correct" | "wrong" | "denied" | "unsupported" | "error";

type Syllable = { target: string; heard: string; correct: boolean };

function TestRoute() {
  const { t } = useLanguage();
  const { lesson } = Route.useSearch();
  const p = useLoadedProgress();
  const access = useAccess();
  if (!p || !access.loaded) return <AppShell title={t("Reading test")}><div className="h-96" aria-busy="true" /></AppShell>;
  if (!canOpenUnit(lesson, access.premium)) return <AppShell title={t("Reading test")}><PremiumLocked what={`The ${LESSONS[lesson].en} reading test`} /></AppShell>;
  const s = unitState(p, lesson);
  if (!s.unlocked) return <AppShell title={t("Reading test")}><UnitLocked id={lesson} progress={p} need="unit" /></AppShell>;
  return <Test key={`${lesson}-${access.premium}`} lesson={lesson} progress={p} free={!access.premium} />;
}

function Test({ lesson, progress, free }: { lesson: ReturnType<typeof parseLesson>; progress: Progress; free: boolean }) {
  const { t } = useLanguage();
  const WORDS = free ? FREE_WORDS : LESSONS[lesson].words;
  const [words, setWords] = useState(WORDS.slice(0, 10));
  const [i, setI] = useState(0);
  const [st, setSt] = useState<State>("idle");
  const [heard, setHeard] = useState("");
  const [syl, setSyl] = useState<Syllable[]>([]);
  const [correct, setCorrect] = useState(0);
  const media = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startedAt = useRef(0);
  const releaseEarly = useRef(false);
  const lastMs = useRef(0);
  const autoStop = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [errMsg, setErrMsg] = useState("");
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [pay, setPay] = useState<string | null>(null);
  const refreshQuota = () => { void quotaStatus().then((q) => q && setQuota(q)); };
  useEffect(refreshQuota, []);
  const w = words[i] ?? WORDS[0];
  const finished = i >= words.length;
  useEffect(() => {
    if (!finished) return;
    const pct = Math.round((correct / words.length) * 100);
    update((p) => recordUnitResult({ ...p, scores: [...p.scores, pct] }, lesson, "test", pct)); touchStreak();
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setWords(shuffle(WORDS).slice(0, 10)); return () => { stopAudio(); media.current?.state === "recording" && media.current.stop(); stream.current?.getTracks().forEach((t) => t.stop()); }; }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const judge = (r: { correct: boolean; heard: string; syllables: Syllable[] }) => {
    setHeard(r.heard); setSyl(r.syllables);
    if (r.correct) {
      setSt("correct"); setCorrect((c) => c + 1);
      setTimeout(() => { setI((x) => x + 1); setSt("idle"); setHeard(""); setSyl([]); }, 1200);
    } else setSt("wrong");
  };

  const analyze = async (blob: Blob) => {
    if (!w) return;
    setSt("analyzing");
    try {
      const type = blob.type.split(";")[0] || "audio/webm";
      const fd = new FormData();
      fd.append("expected", w.ar);
      fd.append("durationMs", String(Math.max(1, Math.min(lastMs.current, 6000))));
      fd.append("file", new File([blob], type.includes("mp4") ? "reading.m4a" : "reading.webm", { type }));
      const res = await fetch(`${API_BASE}/api/public/check-reading`, { method: "POST", body: fd, headers: { "x-qaf-device": deviceId() } });
      const data = (await res.json()) as { correct?: boolean; heard?: string; syllables?: Syllable[]; error?: string; limit?: string };
      refreshQuota();
      if ((res.status === 429 && data.limit === "quota") || data.limit === "premium_content") setPay(data.error ?? "You've used your free pronunciation checks.");
      if (!res.ok || !data.syllables) { setErrMsg(data.error ?? "Reading check failed. Please try again."); setSt("error"); return; }
      judge({ correct: !!data.correct, heard: data.heard ?? "", syllables: data.syllables });
    } catch { setErrMsg("Couldn't reach the reading checker. Check your connection and try again."); setSt("error"); }
  };

  const start = async () => {
    if (st === "recording" || st === "analyzing" || st === "correct") return;
    stopAudio();
    releaseEarly.current = false;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") return setSt("unsupported");
    try {
      if (!stream.current) stream.current = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 } });
    } catch { return setSt("denied"); }
    // Released while the permission prompt was open: don't start a stuck recording.
    if (releaseEarly.current) { setSt("idle"); return; }
    chunks.current = [];
    let mr: MediaRecorder;
    try { mr = new MediaRecorder(stream.current, { audioBitsPerSecond: 24000 }); } catch { mr = new MediaRecorder(stream.current); }
    mr.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
    mr.onstop = () => {
      lastMs.current = Date.now() - startedAt.current;
      if (autoStop.current) clearTimeout(autoStop.current);
      const blob = new Blob(chunks.current, { type: mr.mimeType || "audio/webm" });
      if (Date.now() - startedAt.current < 400 || blob.size < 1000) { setErrMsg("That was too short. Hold the mic, read the word, then release."); setSt("error"); return; }
      void analyze(blob);
    };
    media.current = mr;
    startedAt.current = Date.now();
    mr.start();
    autoStop.current = setTimeout(() => { if (mr.state === "recording") mr.stop(); }, 6000);
    setSt("recording");
  };

  const stop = () => {
    releaseEarly.current = true;
    if (media.current?.state === "recording") media.current.stop();
  };

  if (finished) {
    const pct = Math.round((correct / words.length) * 100);
    const passed = pct >= PASS_PCT;
    const complete = unitState(recordUnitResult(progress, lesson, "test", pct), lesson).complete;
    const next = UNIT_ORDER[UNIT_ORDER.indexOf(lesson) + 1];
    return (
      <AppShell title={t("Reading test")}>
        <div className="learning-surface p-7 text-center">
          <Trophy className="mx-auto h-12 w-12 text-gold" />
          <h2 className="mt-3 text-2xl font-bold">{complete ? t("{lesson} unit complete", { lesson: t(LESSONS[lesson].en) }) : passed ? t("Reading test passed") : t("Test complete")}</h2>
          <p className="mt-2 text-muted-foreground">{t("You read {correct} of {total} words · {percent}%", { correct, total: words.length, percent: pct })}</p>
          {!passed && <p className="mt-1 text-xs text-muted-foreground">{t("You need {percent}% to complete this unit.", { percent: PASS_PCT })}</p>}
          {free && <Button className="mt-6 w-full" onClick={() => setPay("")}>{t("Unlock all units with Premium")}</Button>}
          {!free && complete && next && <Button asChild className="mt-6 w-full"><Link to="/learn" search={{ lesson: next }}>{t("Start {lesson}", { lesson: t(LESSONS[next].en) })}</Link></Button>}
          {!free && passed && !complete && <Button asChild className="mt-6 w-full"><Link to={unitState(progress, lesson).lessonsDone ? "/quiz" : "/learn"} search={{ lesson }}>{t("Continue this unit")}</Link></Button>}
          <Button asChild variant="outline" className="mt-3 w-full"><Link to="/">{t("Back to Home")}</Link></Button>
          <Button variant={passed ? "outline" : "default"} className="mt-3 w-full" onClick={() => {
            setWords(shuffle(WORDS).slice(0, 10)); setI(0); setCorrect(0); setSt("idle");
          }}>{t("Try the test again")}</Button>
        </div>
        <Paywall open={pay !== null} reason={pay || undefined} onClose={() => setPay(null)} />
      </AppShell>
    );
  }

  const msg: Record<State, string> = {
    idle: t("Press and hold the mic, read the word, then release."),
    recording: t("Listening\u2026 release when done"),
    analyzing: t("Checking your reading\u2026"),
    correct: t("Correct! \u2713"),
    wrong: t("Try again"),
    denied: t("Microphone access was blocked. Allow it in your browser settings, then tap the mic again."),
    unsupported: t("Recording isn't supported in this browser. Try an up-to-date Chrome or Safari."),
    error: errMsg,
  };

  if (!w) return null;

  return (
    <AppShell title={t("Reading test")}>
      <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-xs text-muted-foreground"><span>{t(LESSONS[lesson].en)} · {t("Word {current} of {total}", { current: i + 1, total: words.length })}</span><span>{t("{score} correct", { score: correct })}</span></div>
      {quota && (quota.premium || quota.enforced) && <p className="mb-2 text-center text-xs text-muted-foreground" aria-live="polite">
        {quota.premium ? t("Premium · {left} of {total} checks left this month", { left: Math.max(0, quota.limit - quota.used), total: quota.limit }) : t("{left} of {total} free checks left", { left: Math.max(0, quota.limit - quota.used), total: quota.limit })}
        {!quota.premium && <button className="ml-2 font-medium text-primary underline" onClick={() => setPay("")}>{t("Go Premium")}</button>}
      </p>}
      <div className="mb-4 flex gap-1">{words.map((_, k) => <div key={k} className={`h-1.5 flex-1 rounded-full ${k < i ? "bg-primary" : "bg-muted"}`} />)}</div>
      <div className="learning-surface p-6 text-center">
        <p className="mb-2 text-sm text-muted-foreground">Read this word aloud</p>
        <Ar className="block text-7xl font-semibold leading-relaxed">{w.ar}</Ar>
        <p role="status" aria-live="polite" className={`mt-4 flex min-h-16 items-center justify-center gap-2 rounded-2xl p-3 text-sm font-medium ${st === "correct" ? "bg-success-soft text-success" : st === "wrong" || st === "denied" || st === "error" ? "bg-error-soft text-destructive" : "bg-accent text-muted-foreground"}`}>{st === "correct" && <Check className="h-4 w-4 shrink-0" />}{(st === "wrong" || st === "denied" || st === "unsupported" || st === "error") && <CircleAlert className="h-4 w-4 shrink-0" />}{st === "analyzing" && <LoaderCircle className="h-4 w-4 shrink-0 animate-spin" />}{msg[st]}</p>
        {st === "wrong" && syl.length > 0 && <div className="mt-3" aria-label="Sound by sound">
          <div dir="rtl" className="flex flex-wrap justify-center gap-2">{syl.map((s, k) => <span key={k} className={`rounded-xl px-3 py-1.5 font-arabic text-2xl ${s.correct ? "bg-success-soft text-success" : "bg-error-soft text-destructive"}`} lang="ar">{s.target}</span>)}</div>
          <p className="mt-2 text-xs text-muted-foreground">Red sounds were not read exactly.{heard && <> We heard: <Ar className="text-base">{heard}</Ar></>}</p>
        </div>}
      </div>
      <div className="mt-8 flex flex-col items-center gap-4">
        <Button disabled={st === "analyzing" || st === "correct"} aria-label="Press and hold to record" aria-pressed={st === "recording"}
          onPointerDown={(e) => { e.preventDefault(); start(); }}
          onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop} onContextMenu={(e) => e.preventDefault()}
          className={`mic-button touch-none select-none ${st === "recording" ? "recording-state bg-destructive" : "bg-primary"}`}>
          {st === "analyzing" ? <LoaderCircle className="animate-spin" /> : st === "correct" ? <Check /> : <Mic />}
        </Button>
        {(st === "wrong" || st === "error") && (
          <Button variant="outline" onClick={() => playWord(w.ar)}>
            <Volume2 className="h-4 w-4" /> Hear the word
          </Button>
        )}
        {st === "wrong" && <Button variant="ghost" className="text-muted-foreground" onClick={() => { setI((x) => x + 1); setSt("idle"); setSyl([]); }}>{t("Skip")}</Button>}
      </div>
      <Paywall open={pay !== null} reason={pay || undefined} onClose={() => setPay(null)} />
    </AppShell>
  );
}
