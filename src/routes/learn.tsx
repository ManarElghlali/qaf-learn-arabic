import { useLanguage } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Volume2 } from "lucide-react";
import { AppShell, Ar } from "@/components/AppShell";
import { LESSONS, parseLesson, lessonLearned, unitState } from "@/lib/lessons";
import { UnitLocked } from "@/components/LessonSwitch";
import { playUnit, playWord, preloadAudio, stopAudio } from "@/lib/audio";
import { touchStreak, update, useProgress, useLoadedProgress, readProgress } from "@/lib/progress";
import { WordIllustration } from "@/components/WordIllustration";
import { learningSummary } from "@/lib/learning-path";
import { Button } from "@/components/ui/button";
import { useAccess, canOpenUnit, FREE_WORDS } from "@/lib/access";
import { PremiumLocked } from "@/components/PremiumLock";
import { Paywall } from "@/components/Paywall";

export const Route = createFileRoute("/learn")({
  validateSearch: (s: Record<string, unknown>) => ({ lesson: parseLesson(s["lesson"]) }),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Learn Arabic Sounds — Qaf" },
      { name: "description", content: "Practise illustrated words and grouped Short Sounds, Madd, Tanween and Shaddah sounds in your selected Arabic unit." },
      { property: "og:title", content: "Learn Arabic Sounds — Qaf" },
      { property: "og:description", content: "Segmented sound units, audio and meanings for every word." },
    ],
  }),
  component: Learn,
});

function Learn() {
  const { t } = useLanguage();
  const { lesson } = Route.useSearch();
  const L = LESSONS[lesson];
  const access = useAccess();
  const free = !access.premium;
  const WORDS = free && lesson === "fatha" ? FREE_WORDS : L.words;
  const [pay, setPay] = useState(false);
  const p = useProgress();
  const lp = useLoadedProgress();
  const [i, setI] = useState(0);
  const [selectedSound, setSelectedSound] = useState<number | null>(null);
  const w = WORDS[i];
  useEffect(() => { setI(learningSummary(lessonLearned(readProgress(), lesson), WORDS).resumeIndex); return () => stopAudio(); }, [lesson]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setSelectedSound(null); stopAudio(); }, [i, lesson]);
  useEffect(() => { const ws = WORDS.slice(i, i + 2).filter(Boolean); preloadAudio("w", ws.map((x) => x.ar)); preloadAudio("u", ws.flatMap((x) => x.units)); }, [i, WORDS]);
  if (!w) return null;
  if (access.loaded && !canOpenUnit(lesson, access.premium)) return <AppShell title={`${t(L.en)} · ${L.ar}`}><PremiumLocked what={`The ${t(L.en)} unit`} /></AppShell>;
  if (lp && !unitState(lp, lesson).unlocked) return <AppShell title={`${t(L.en)} · ${L.ar}`}><UnitLocked id={lesson} progress={lp} need="unit" /></AppShell>;
  const unit = lp ? unitState(lp, lesson) : null;
  const go = (d: number) => {
    update((s) => (s[L.key].includes(w.id) ? s : { ...s, [L.key]: [...s[L.key], w.id] }));
    touchStreak();
    if (free && d > 0 && i === WORDS.length - 1) setPay(true);
    setI((x) => Math.min(WORDS.length - 1, Math.max(0, x + d)));
  };
  const freeDone = free && lesson === "fatha" && !!lp && FREE_WORDS.every((x) => lp.learned.includes(x.id));
  return (
    <AppShell title={`${t(L.en)} · ${L.ar}`} singleScreen>
      <div className="activity-meta grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-xs text-muted-foreground">
        <span>{t("Word {current} of {total}", { current: i + 1, total: WORDS.length })}</span>
        <label className="flex items-center gap-2">{t("Transliteration")}
          <input type="checkbox" checked={p.translit} onChange={(e) => update((s) => ({ ...s, translit: e.target.checked }))} className="accent-primary" />
        </label>
      </div>
      <progress aria-label={t("Lesson progress")} className="qaf-progress h-1.5 w-full shrink-0" value={i + 1} max={WORDS.length} />
      <div className="learning-surface lesson-content text-center">
        <Button variant="ghost" aria-label={t("Play word")} onClick={() => { setSelectedSound(null); playWord(w.ar); }} className="lesson-art mx-auto rounded-2xl p-0"><WordIllustration word={w} /></Button>
        <div className="lesson-word">
          <Ar className="block font-semibold">{w.ar}</Ar>
          {p.translit && <p className="text-sm text-muted-foreground">{w.tr}</p>}
          <p lang="en" dir="ltr" className="text-sm font-medium">{w.en}</p>
        </div>
        <div dir="rtl" className="lesson-sounds flex justify-center gap-3">
          {w.units.map((u, k) => (
            <Button key={k} variant="outline" aria-label={t("Play sound {sound}", { sound: u })} aria-pressed={selectedSound === k} onClick={() => { setSelectedSound(k); playUnit(u); }} className={`sound-button ${selectedSound === k ? "border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" : "border-primary/20 bg-accent text-primary"}`}>
              <Ar>{u}</Ar>
            </Button>
          ))}
        </div>
        <Button onClick={() => { setSelectedSound(null); playWord(w.ar); }} className="activity-command w-full shrink-0">
          <Volume2 className="h-5 w-5" />{t("Listen to the word")}
        </Button>
      </div>
      <div className="activity-actions flex gap-3">
        <Button variant="outline" disabled={i === 0} onClick={() => go(-1)} className="activity-command min-w-0 flex-1"><ChevronLeft className="h-4 w-4" />{t("Previous")}</Button>
        <Button onClick={() => go(1)} className="activity-command min-w-0 flex-1">{i === WORDS.length - 1 ? t("Finish lesson") : t("Next")}<ChevronRight className="h-4 w-4" /></Button>
      </div>
      {freeDone && (
        <div className="lesson-completion grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <p className="text-xs font-semibold text-primary">{t("All {total} free words learned", { total: FREE_WORDS.length })}</p>
          <Button asChild variant="outline" size="sm"><Link to="/quiz" search={{ lesson }}>{t("Free quizzes")}<ChevronRight /></Link></Button>
        </div>
      )}
      <Paywall open={pay} onClose={() => setPay(false)} reason={t("You've reached the end of the {total} free Fatha words. The rest of Fatha and every other unit are part of Premium.", { total: FREE_WORDS.length })} />
      {!free && unit?.lessonsDone && (
        <div className="lesson-completion grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <p className="text-xs font-semibold text-primary">{unit.complete ? t("Unit complete") : t("All {total} words learned", { total: unit.total })}</p>
          <Button asChild variant="outline" size="sm"><Link to={unit.step === "test" ? "/test" : "/quiz"} search={{ lesson }}>{unit.step === "test" ? t("Take the test") : t("Take the quiz")}<ChevronRight /></Link></Button>
        </div>
      )}
    </AppShell>
  );
}
