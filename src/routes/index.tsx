import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Ar } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useProgress } from "@/lib/progress";
import { WORDS } from "@/lib/words";
import { learningSummary, SHORT_LESSONS, MADD_LESSONS, TANWEEN_LESSONS } from "@/lib/learning-path";
import { ArrowRight, BookOpen, Check, ChevronLeft, Flame, LockKeyhole } from "lucide-react";
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
      <section aria-label="Your learning progress" className="mb-5">
        <div className="mb-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <p className="text-sm font-semibold">Fatha progress <span className="ml-1 text-xs font-medium text-muted-foreground">{summary.completed}/{WORDS.length}</span></p>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Flame className="h-4 w-4 text-gold" />{p.streak} day streak</span>
        </div>
        <progress aria-label="Fatha progress" value={summary.completed} max={WORDS.length} className="qaf-progress h-1.5 w-full" />
      </section>
      <section aria-label="Continue your lesson" className="mb-7">
        <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0"><h2 className="text-xl font-bold">{completed ? "Keep your reading fluent" : started ? "Your next word awaits" : "Your Arabic journey begins"}</h2><p className="mt-1 text-sm text-muted-foreground">Short Sounds · Fatha · {completed ? "42 words completed" : `Word ${summary.resumeIndex + 1} of ${WORDS.length}`}</p></div>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent text-primary"><BookOpen className="h-5 w-5" /></span>
        </div>
        <Button asChild className="w-full justify-between"><Link to="/learn"><span>{completed ? "Review Fatha" : started ? "Continue Learning" : "Start Learning"}</span><ArrowRight className="h-4 w-4" /></Link></Button>
      </section>
      <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center"><h2 className="text-base font-bold">Learning journey</h2><Ar className="text-lg text-muted-foreground">رحلة التعلّم</Ar></div>
      <div className="space-y-3">
        {stages.map((s) => (
          <article key={s.en} className={`overflow-hidden rounded-3xl border border-border/70 ${s.accent}`}>
            <div dir="rtl" className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-3 p-4">
              <img src={s.image} alt={`${s.landmark} illustration`} width={512} height={512} loading="lazy" className="h-[72px] w-[72px] shrink-0 rounded-2xl object-cover" />
              <div className="min-w-0 text-right"><Ar className="block text-xl font-semibold">{s.ar}</Ar><p dir="ltr" className="text-right text-xs text-muted-foreground">{s.en}</p>
                <p dir="ltr" className={`mt-1.5 flex items-center justify-end gap-1 text-[11px] font-semibold ${s.live ? "text-primary" : "text-muted-foreground"}`}>
                  {s.live ? <>{summary.status === "Completed" && <Check className="h-3 w-3" />}{summary.status}</> : <><LockKeyhole className="h-3 w-3" /><Ar>قريبًا</Ar> · Coming Soon</>}
                </p>
              </div>
            </div>
            {s.live && <div className="mx-4 mb-2 border-t border-primary/10">
              {SHORT_LESSONS.map((l) => l.available ? <Link key={l.en} to="/learn" dir="rtl" className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <div className="min-w-0"><Ar className="block text-lg font-semibold">{l.ar}</Ar><p dir="ltr" className="text-right text-[11px] text-muted-foreground">{l.en} · 42 words</p></div><ChevronLeft className="h-4 w-4 text-primary" />
              </Link> : <div key={l.en} dir="rtl" aria-disabled="true" className="grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-border/70 py-2 text-muted-foreground">
                <div className="min-w-0"><Ar className="block text-base">{l.ar}</Ar><p dir="ltr" className="text-right text-[10px]">{l.en}</p></div><LockKeyhole aria-label="Coming Soon" className="h-3.5 w-3.5 shrink-0" />
              </div>)}
            </div>}
            {!s.live && s.lessons.length > 0 && <div dir="rtl" aria-disabled="true" className="mx-4 mb-4 flex flex-wrap gap-x-3 gap-y-1 border-t border-border/70 pt-2 text-muted-foreground">{s.lessons.map(l => <Ar key={l.en} className="text-sm" >{l.ar}</Ar>)}</div>}
          </article>
        ))}
      </div>
    </AppShell>
  );
}
