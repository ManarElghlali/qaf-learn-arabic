import { useLanguage } from "@/lib/i18n";
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
import { useAccess, canOpenUnit, FREE_QUIZZES, FREE_QUIZ_LENGTH, freeQuizOpen, markFreeQuiz, useFreeQuizzes, type FreeQuizMode } from "@/lib/access";
import { PremiumLocked } from "@/components/PremiumLock";
import { LockKeyhole } from "lucide-react";
import { BuildQuestion, PickQuestion, type QuizMode } from "@/components/QuizQuestion";

export const Route = createFileRoute("/quiz")({
  validateSearch: (s: Record<string, unknown>): { lesson: LessonId; q?: number } => {
    const q = Number(s["q"]);
    return { lesson: parseLesson(s["lesson"]), ...(q >= 1 && q <= 5 ? { q } : {}) };
  },
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Unit quiz — Qaf" },
      { name: "description", content: "Build words, listen and pick, and match pictures in your selected Short Sounds, Madd, Tanween or Shaddah unit." },
      { property: "og:title", content: "Unit quiz — Qaf" },
      { property: "og:description", content: "Three quiz modes to practise reading Arabic." },
    ],
  }),
  component: () => <ClientOnly fallback={<AppShell title="Quiz"><div className="h-96" aria-busy="true" /></AppShell>}><QuizRoute /></ClientOnly>,
});


function QuizRoute() {
  const { t } = useLanguage();
  const { lesson, q } = Route.useSearch();
  const p = useLoadedProgress();
  const access = useAccess();
  const done = useFreeQuizzes();
  if (!access.loaded) return <AppShell title={t("Quiz")}><div className="h-96" aria-busy="true" /></AppShell>;
  if (!canOpenUnit(lesson, access.premium)) return <AppShell title={t("Quiz")}><PremiumLocked what={t("The {lesson} quiz", { lesson: t(LESSONS[lesson].en) })} /></AppShell>;
  if (!access.premium) {
    const fq = FREE_QUIZZES.find((x) => x.n === q);
    if (!fq || !freeQuizOpen(fq.n, done)) return <FreeQuizList done={done} />;
    return <Quiz key={`free-${fq.n}`} lesson={lesson} words={fq.words} label={t("Free quiz {number} · {title}", { number: fq.n, title: t(fq.title) })} forced={fq.mode} length={FREE_QUIZ_LENGTH} onFinish={() => markFreeQuiz(fq.n)} freeN={fq.n} />;
  }
  if (!p) return <AppShell title={t("Quiz")}><div className="h-96" aria-busy="true" /></AppShell>;
  const s = unitState(p, lesson);
  if (!s.unlocked) return <AppShell title={t("Quiz")}><UnitLocked id={lesson} progress={p} need="unit" /></AppShell>;
  return <Quiz key={lesson} lesson={lesson} words={LESSONS[lesson].words} label={LESSONS[lesson].en} />;
}

function FreeQuizList({ done }: { done: number[] }) {
  const { t } = useLanguage();
  return (
    <AppShell title={t("Free quizzes")}>
      <p className="mb-3 text-sm text-muted-foreground">{t("Five quizzes on your 10 free Fatha words. Each one opens after the one before it.")}</p>
      <div className="space-y-2">{FREE_QUIZZES.map((fq) => {
        const open = freeQuizOpen(fq.n, done);
        const body = <><span className="min-w-0"><span className="block text-sm font-bold">{t("Quiz {number}", { number: fq.n })}</span><span className="block text-xs text-muted-foreground">{t(fq.title)}</span></span>
          {done.includes(fq.n) ? <Check className="h-4 w-4 text-success" /> : open ? <ChevronRight className="h-4 w-4 text-primary" /> : <LockKeyhole className="h-4 w-4 text-muted-foreground" />}</>;
        return open
          ? <Link key={fq.n} to="/quiz" search={{ lesson: "fatha", q: fq.n }} className="learning-surface flex min-h-16 items-center justify-between gap-3 p-4">{body}</Link>
          : <div key={fq.n} aria-disabled="true" className="learning-surface flex min-h-16 items-center justify-between gap-3 p-4 opacity-60">{body}</div>;
      })}</div>
      {done.length >= 5 && <Button asChild className="mt-5 w-full"><Link to="/test" search={{ lesson: "fatha" }}>{t("Take the free reading test")}</Link></Button>}
    </AppShell>
  );
}

const MODES: QuizMode[] = ["build", "listen", "picture"];

function Quiz({ lesson, words: WORDS, label, forced, length, onFinish, freeN }: { lesson: LessonId; words: Word[]; label: string; forced?: FreeQuizMode; length?: number; onFinish?: () => void; freeN?: number }) {
  const { t } = useLanguage();
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
    const mode: QuizMode = forced && forced !== "mixed" ? forced : MODES[n % 3]!;
    return { w, mode, opts: shuffle([w, ...shuffle(WORDS.filter((x) => x.id !== w.id)).slice(0, 3)]) };
  }, [n, round]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => stopAudio(), []);
  const done = (ok: boolean) => {
    if (!q || answered) return;
    setAnswered(true);
    if (ok) { setScore((s) => s + 1); setMisses((m) => m.filter((id) => id !== q.w.id)); }
    else setMisses((m) => [...new Set([...m, q.w.id])]);

  };
  const total = length ?? Math.min(QUIZ_LENGTH, WORDS.length);
  const finished = n >= total;
  useEffect(() => {
    if (!finished) return;
    if (onFinish) onFinish(); else update((p) => recordUnitResult(p, lesson, "quiz", Math.round(score / total * 100)));
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps
  if (finished) {
    const pct = Math.round(score / total * 100);
    const passed = pct >= PASS_PCT;
    return (
      <AppShell title={t("Quiz")} singleScreen>
        <div className="learning-surface p-7 text-center">
          <Trophy className={`mx-auto h-12 w-12 ${passed ? "text-gold" : "text-muted-foreground"}`} />
          <h2 className="mt-3 text-2xl font-bold">{passed ? t("Quiz passed") : t("Keep practising")}</h2>
          <p className="mt-2 text-muted-foreground">{t("{score} of {total} correct · {percent}%", { score, total, percent: pct })}</p>
          {!passed && <p className="mt-1 text-xs text-muted-foreground">{t("You need {percent}% to pass this unit’s quiz.", { percent: PASS_PCT })}</p>}
          {freeN ? <Button asChild className="mt-6 w-full">{freeN < 5 ? <Link to="/quiz" search={{ lesson, q: freeN + 1 }}>{t("Next free quiz")}</Link> : <Link to="/test" search={{ lesson }}>{t("Take the free reading test")}</Link>}</Button>
            : passed && <Button asChild className="mt-6 w-full"><Link to="/test" search={{ lesson }}>{t("Take the {lesson} reading test", { lesson: t(label) })}</Link></Button>}
          <Button variant={passed ? "outline" : "default"} className="mt-3 w-full" onClick={() => { setN(0); setScore(0); setMisses([]); setAnswered(false); setRound((r) => r + 1); }}>{t("Try the quiz again")}</Button>
        </div>
      </AppShell>
    );
  }
  if (!q) return null;
  return (
    <AppShell title={t("Quiz")} singleScreen>
      <div className="activity-meta grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-xs text-muted-foreground"><span className="min-w-0">{t(label)} · {n + 1}/{total}</span><span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-2 py-1 font-semibold text-primary"><Check className="h-3.5 w-3.5" />{t("{score} correct", { score })}</span></div>
      <progress aria-label="Quiz progress" className="qaf-progress h-1.5 w-full shrink-0" value={n} max={total} />
      {q.mode === "build" && <BuildQuestion key={`${round}-${n}`} w={q.w} words={WORDS} onDone={done} />}
      {q.mode !== "build" && <PickQuestion key={`${round}-${n}`} w={q.w} opts={q.opts} mode={q.mode} onDone={done} />}
      <div className="activity-actions">
        <Button disabled={!answered} className="activity-command w-full" onClick={() => { stopAudio(); setAnswered(false); setN((x) => x + 1); }}>{t("Continue")}<ChevronRight className="size-4" /></Button>
      </div>
    </AppShell>
  );
}
