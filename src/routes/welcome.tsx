import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Ar } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { completeOnboarding, ONBOARDING_STEPS, readOnboarding, saveStep } from "@/lib/onboarding";
import { BookOpen, ChevronLeft, ChevronRight, Headphones, Volume2 } from "lucide-react";

export const Route = createFileRoute("/welcome")({
  head: () => ({ meta: [
    { title: "Welcome to Qaf ق — Learn to read Arabic" },
    { name: "description", content: "Get started with Qaf: hear each sound, build words, and read Arabic with confidence." },
    { property: "og:title", content: "Welcome to Qaf ق" },
    { property: "og:description", content: "A calm, step-by-step way to learn to read Arabic." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Welcome,
});

const SCREENS = [
  { ar: "أَهْلًا وَسَهْلًا", title: "Welcome to Qaf", body: "Learn to read Arabic calmly, one sound and one word at a time. No account needed.", Icon: null },
  { ar: "اِسْمَعْ وَكَرِّرْ", title: "Hear every sound", body: "Tap any letter or word to hear a teacher read it. Repeat it out loud at your own pace.", Icon: Volume2 },
  { ar: "طَرِيقَانِ", title: "Two ways to learn", body: "Reading teaches whole words with quizzes and tests. Sound Practice lets you practise every letter.", Icon: null },
];

function Welcome() {
  const navigate = useNavigate();
  const [step, setStep] = useState<number | null>(null);
  useEffect(() => {
    const o = readOnboarding();
    if (o.completed) navigate({ to: "/", replace: true }); else setStep(o.step);
  }, [navigate]);
  if (step === null) return <div className="min-h-dvh bg-background" aria-busy="true" />;
  const s = SCREENS[step]!;
  const last = step === ONBOARDING_STEPS - 1;
  const go = (n: number) => { saveStep(n); setStep(n); };
  const finish = (to: "/" | "/reading" | "/sounds") => { completeOnboarding(); navigate({ to, replace: true }); };
  return (
    <main className="qaf-onboarding mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-background px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="flex h-11 items-center justify-between">
        {step > 0 ? <Button variant="ghost" size="sm" onClick={() => go(step - 1)}><ChevronLeft />Back</Button> : <span />}
        {!last && <Button variant="ghost" size="sm" onClick={() => finish("/")}>Skip</Button>}
      </div>
      <div key={step} className="flex flex-1 animate-in fade-in flex-col items-center justify-center gap-5 text-center duration-300">
        {s.Icon ? <span className="grid h-24 w-24 place-items-center rounded-full bg-accent"><s.Icon className="h-10 w-10 text-primary" /></span> : <Ar className="text-8xl font-bold text-primary">ق</Ar>}
        <Ar className="text-3xl font-bold text-primary">{s.ar}</Ar>
        <h1 className="text-2xl font-bold">{s.title}</h1>
        <p className="max-w-xs text-base text-muted-foreground">{s.body}</p>
        {last && <div className="grid w-full gap-3 pt-2">
          <button type="button" onClick={() => finish("/reading")} className="flex min-h-16 items-center gap-3 rounded-2xl border border-border bg-stage-sage p-4 text-left"><BookOpen className="h-6 w-6 text-primary" /><span className="flex-1"><span className="block font-bold">Start with Reading</span><Ar className="text-sm text-muted-foreground">القِرَاءَة</Ar></span><ChevronRight className="h-5 w-5 text-primary" /></button>
          <button type="button" onClick={() => finish("/sounds")} className="flex min-h-16 items-center gap-3 rounded-2xl border border-border bg-stage-lavender p-4 text-left"><Headphones className="h-6 w-6 text-primary" /><span className="flex-1"><span className="block font-bold">Start with Sound Practice</span><Ar className="text-sm text-muted-foreground">صَوْتِي</Ar></span><ChevronRight className="h-5 w-5 text-primary" /></button>
        </div>}
      </div>
      <div className="flex justify-center gap-2 py-4" aria-label={`Step ${step + 1} of ${ONBOARDING_STEPS}`}>{SCREENS.map((_, i) => <span key={i} className={`h-2 rounded-full transition-all ${i === step ? "w-6 bg-primary" : "w-2 bg-border"}`} />)}</div>
      {last ? <Button variant="ghost" className="h-12 rounded-full" onClick={() => finish("/")}>Go to Home</Button>
        : <Button className="h-14 rounded-full text-base" onClick={() => go(step + 1)}>Continue<ChevronRight /></Button>}
      <Link to="/" className="sr-only">Home</Link>
    </main>
  );
}
