import { useLanguage } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Ar } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useProgress } from "@/lib/progress";
import { WORDS } from "@/lib/words";
import { learningSummary, SHORT_LESSONS, MADD_LESSONS, TANWEEN_LESSONS, SHADDAH_LESSONS } from "@/lib/learning-path";
import { ArrowRight, Flame } from "lucide-react";
import { LESSONS, UNIT_ORDER, unitState } from "@/lib/lessons";
import { CurriculumDestination } from "@/components/CurriculumDestination";
import castle from "@/assets/stages/castle.jpg";
import lighthouse from "@/assets/stages/lighthouse.jpg";
import garden from "@/assets/stages/garden.jpg";
import observatory from "@/assets/stages/observatory.jpg";

export const Route = createFileRoute("/reading")({
  head: () => ({ meta: [
    { title: "Reading — Qaf ق Arabic lessons" },
    { name: "description", content: "Learn Arabic with illustrated Short Sounds, Madd, Tanween and Shaddah lessons, unit quizzes and reading tests." },
    { property: "og:title", content: "Qaf Reading journey" },
    { property: "og:description", content: "Learn to read Arabic, one sound and one word at a time." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Reading,
});

const stages = [
  { ar: "الأصوات القصيرة", en: "Short Sounds", image: castle, landmark: "Castle", accent: "bg-stage-sage", live: true, lessons: SHORT_LESSONS },
  { ar: "الأصوات الطويلة", en: "Long Sounds", image: lighthouse, landmark: "Lighthouse", accent: "bg-stage-sky", live: true, lessons: MADD_LESSONS },
  { ar: "التنوين", en: "Tanween", image: garden, landmark: "Garden", accent: "bg-stage-lavender", live: true, lessons: TANWEEN_LESSONS },
  { ar: "الشدة", en: "Shaddah", image: observatory, landmark: "Observatory", accent: "bg-stage-gold", live: true, lessons: SHADDAH_LESSONS },
];

function Reading() {
  const { t } = useLanguage();
  const p = useProgress();
  const summary = learningSummary(p.learned);
  const units = UNIT_ORDER.map((id) => unitState(p, id));
  // Current unit = first unlocked unit not yet complete (or the last unit when all are done).
  const cur = units.find((u) => u.unlocked && !u.complete) ?? units.at(-1);
  if (!cur) return null;
  const L = LESSONS[cur.id];
  const started = cur.learned > 0;
  const completed = cur.complete;
  const stageStatus = (ls: readonly object[]) => {
    const us = units.filter((u) => ls.some((l) => (l as { lesson?: string }).lesson === u.id));
    return us.length && us.every((u) => u.complete) ? "Completed" : us.some((u) => u.learned > 0) ? "In progress" : "Available";
  };
  const stepRoute = cur.step === "quiz" ? "/quiz" : cur.step === "test" ? "/test" : "/learn";
  const actionLabel = completed ? `Review ${t(L.en)}` : cur.step === "quiz" ? t("Take the quiz") : cur.step === "test" ? "Take the reading test" : started ? t("Continue") : t("Start Learning");
  const currentStage = stages.find(s => s.lessons.some(l => "lesson" in l && l.lesson === cur.id));
  if (!currentStage) return null;
  return (
    <AppShell title={t("Reading")}>
      <section aria-label="Your learning progress" className="home-progress mb-4 grid grid-cols-[minmax(0,1fr)_48px] items-center gap-4 rounded-3xl bg-primary p-4 text-primary-foreground">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold">{t(L.en)} progress</h2>{p.streak > 0 && <span className="flex items-center gap-1 text-[11px]"><Flame className="h-3.5 w-3.5 text-gold" />{p.streak} day streak</span>}</div>
          <p className="mb-2 mt-1 text-xs opacity-80">{cur.learned}/{cur.total} words learned</p>
          <progress aria-label={`${t(L.en)} progress`} value={cur.learned} max={cur.total} className="qaf-progress h-1.5 w-full" />
        </div>
        <Ar className="text-center text-5xl text-gold">ق</Ar>
      </section>
      <section aria-label="Continue your lesson" className="continue-lesson mb-6 rounded-3xl border border-border bg-stage-sage p-4">
        <h2 className="mb-3 text-sm font-bold">{completed ? t("Review your lesson") : started ? t("Continue Learning") : t("Start Learning")}</h2>
        <div className="grid grid-cols-[80px_minmax(0,1fr)] items-center gap-4">
          <img src={currentStage.image} alt={`${currentStage.en} ${currentStage.landmark}`} width={80} height={80} className="aspect-square w-20 rounded-2xl object-cover" />
          <div className="min-w-0"><div className="flex items-start justify-between gap-2"><div><Ar className="block text-xl font-bold text-primary">{L.ar}</Ar><p className="text-[11px] text-muted-foreground">{t(L.en)}</p></div><span className="pt-2 text-[10px] text-muted-foreground">{cur.learned}/{cur.total}</span></div>
            <Button asChild className="mt-2 h-11 w-full justify-between rounded-full px-4 text-xs"><Link to={stepRoute} search={{ lesson: cur.id }}><span>{actionLabel}</span><ArrowRight /></Link></Button>
          </div>
        </div>
        {cur.step === "learn" && started && <p className="mt-3 text-right text-[11px] text-muted-foreground">Word {learningSummary(p[L.key], L.words).resumeIndex + 1} of {cur.total}</p>}
      </section>
      <div className="mb-3 flex items-center justify-between gap-2"><h2 className="text-sm font-bold">{t("Learning journey")}</h2><Ar className="text-base text-muted-foreground">رحلة التعلّم</Ar></div>
      <div className="space-y-3">{stages.map(s => <CurriculumDestination key={t(s.en)} {...s} status={stageStatus(s.lessons)} progress={p} />)}</div>
    </AppShell>
  );
}
