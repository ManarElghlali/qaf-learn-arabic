import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { readOnboarding } from "@/lib/onboarding";
import { AppShell, Ar } from "@/components/AppShell";
import { useProgress } from "@/lib/progress";
import { UNIT_ORDER, unitState } from "@/lib/lessons";
import { SOUND_CATEGORIES, setComplete, useSoundProgress } from "@/lib/sound-practice";
import { BookOpen, ChevronRight, Headphones, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Qaf ق — Learn to read Arabic step by step" },
    { name: "description", content: "Two learning paths: illustrated Arabic Reading units and Sound Practice for every letter with every vowel." },
    { property: "og:title", content: "Qaf ق — Your Arabic reading journey" },
    { property: "og:description", content: "Read words or practise letter sounds, one step at a time." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  // First run only: new learners see onboarding; existing learners are marked onboarded automatically.
  useEffect(() => { if (!readOnboarding().completed) navigate({ to: "/welcome", replace: true }); }, [navigate]);
  const p = useProgress();
  const sp = useSoundProgress();
  const unitsDone = UNIT_ORDER.filter((id) => unitState(p, id).complete).length;
  const sets = SOUND_CATEGORIES.flatMap((c) => c.sets);
  const setsDone = sets.filter((s) => setComplete(sp, s)).length;
  return (
    <AppShell title="Qaf">
      <div className="mb-5 text-center"><h2 className="text-lg font-bold text-primary">Assalamu Alaikum!</h2><p className="text-xs text-muted-foreground">Let's continue your Arabic learning journey</p></div>
      <div className="space-y-4">
        <Link to="/reading" className="path-card flex items-center gap-4 rounded-3xl bg-primary p-5 text-primary-foreground shadow-sm">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary-foreground/15"><BookOpen className="h-8 w-8 text-gold" /></span>
          <span className="min-w-0 flex-1"><Ar className="block text-2xl font-bold">القِرَاءَة</Ar><span className="block text-base font-bold">Reading</span><span className="block text-xs opacity-80">Learn to combine sounds and read words · {unitsDone}/{UNIT_ORDER.length} units</span></span>
          <ChevronRight className="h-5 w-5 shrink-0" />
        </Link>
        <Link to="/sounds" className="path-card flex items-center gap-4 rounded-3xl border border-border bg-stage-lavender p-5">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-background"><Headphones className="h-8 w-8 text-primary" /></span>
          <span className="min-w-0 flex-1"><Ar className="block text-2xl font-bold text-primary">صَوْتِي</Ar><span className="block text-base font-bold">Sound Practice</span><span className="block text-xs text-muted-foreground">Hear, repeat and practise individual letter sounds · {setsDone}/{sets.length} lessons</span></span>
          <ChevronRight className="h-5 w-5 shrink-0 text-primary" />
        </Link>
        <p className="flex items-center gap-2 rounded-2xl border border-border p-4 text-xs text-muted-foreground"><Sparkles className="h-4 w-4 text-gold" />Small steps. Big progress. You can do it!</p>
      </div>
    </AppShell>
  );
}
