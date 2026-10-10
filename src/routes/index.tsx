import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Ar } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useProgress } from "@/lib/progress";
import { WORDS } from "@/lib/words";
import { learningSummary, SHORT_LESSONS, MADD_LESSONS, TANWEEN_LESSONS } from "@/lib/learning-path";
import { ArrowRight, Flame } from "lucide-react";
import { KASRA_WORDS } from "@/lib/lessons";
import { CurriculumDestination } from "@/components/CurriculumDestination";
import castle from "@/assets/stages/castle.jpg";
import lighthouse from "@/assets/stages/lighthouse.jpg";
import garden from "@/assets/stages/garden.jpg";
import observatory from "@/assets/stages/observatory.jpg";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Qaf ق — Learn to read Arabic step by step" },
    { name: "description", content: "Continue your Arabic reading journey with 42 illustrated Fatha words, sound practice, quizzes and a reading test." },
    { property: "og:title", content: "Qaf ق — Your Arabic reading journey" },
    { property: "og:description", content: "Learn to read Arabic, one sound and one word at a time." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Home,
});

const stages = [
  { ar: "الأصوات القصيرة", en: "Short Sounds", image: castle, landmark: "Castle", accent: "bg-stage-sage", live: true, lessons: SHORT_LESSONS },
  { ar: "الأصوات الطويلة", en: "Long Sounds", image: lighthouse, landmark: "Lighthouse", accent: "bg-stage-sky", live: false, lessons: MADD_LESSONS },
  { ar: "التنوين", en: "Tanween", image: garden, landmark: "Garden", accent: "bg-stage-lavender", live: false, lessons: TANWEEN_LESSONS },
  { ar: "الشدة", en: "Shadda", image: observatory, landmark: "Observatory", accent: "bg-stage-gold", live: false, lessons: [] },
];

function Home() {
  const p = useProgress();
  const summary = learningSummary(p.learned);
  const started = summary.completed > 0;
  const completed = summary.completed === WORDS.length;
  return (
    <AppShell title="Qaf">
      <section aria-label="Your learning progress" className="home-progress mb-4 grid grid-cols-[minmax(0,1fr)_48px] items-center gap-4 rounded-3xl bg-primary p-4 text-primary-foreground">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold">Fatha progress</h2>{p.streak > 0 && <span className="flex items-center gap-1 text-[11px]"><Flame className="h-3.5 w-3.5 text-gold" />{p.streak} day streak</span>}</div>
          <p className="mb-2 mt-1 text-xs opacity-80">{summary.completed}/{WORDS.length} words learned</p>
          <progress aria-label="Fatha progress" value={summary.completed} max={WORDS.length} className="qaf-progress h-1.5 w-full" />
        </div>
        <Ar className="text-center text-5xl text-gold">ق</Ar>
      </section>
      <section aria-label="Continue your lesson" className="continue-lesson mb-6 rounded-3xl border border-border bg-stage-sage p-4">
        <h2 className="mb-3 text-sm font-bold">{completed ? "Review your lesson" : started ? "Continue Learning" : "Start Learning"}</h2>
        <div className="grid grid-cols-[80px_minmax(0,1fr)] items-center gap-4">
          <img src={castle} alt="Fatha castle" width={80} height={80} className="aspect-square w-20 rounded-2xl object-cover" />
          <div className="min-w-0"><div className="flex items-start justify-between gap-2"><div><Ar className="block text-xl font-bold text-primary">الفَتْحَة</Ar><p className="text-[11px] text-muted-foreground">Fatha</p></div><span className="pt-2 text-[10px] text-muted-foreground">{summary.completed}/{WORDS.length}</span></div>
            <Button asChild className="mt-2 h-11 w-full justify-between rounded-full px-4 text-xs"><Link to="/learn" search={{ lesson: "fatha" }}><span>{completed ? "Review Fatha" : started ? "Continue" : "Start Learning"}</span><ArrowRight /></Link></Button>
          </div>
        </div>
        {started && !completed && <p className="mt-3 text-right text-[11px] text-muted-foreground">Word {summary.resumeIndex + 1} of {WORDS.length}</p>}
      </section>
      <div className="mb-3 flex items-center justify-between gap-2"><h2 className="text-sm font-bold">Learning journey</h2><Ar className="text-base text-muted-foreground">رحلة التعلّم</Ar></div>
      <div className="space-y-3">{stages.map(s => <CurriculumDestination key={s.en} {...s} status={summary.status} completed={{ fatha: summary.completed, kasra: learningSummary(p.learnedKasra, KASRA_WORDS).completed }} />)}</div>
    </AppShell>
  );
}
