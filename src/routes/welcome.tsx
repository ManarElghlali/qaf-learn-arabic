import { useLanguage } from "@/lib/i18n";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Ar } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { FirstQuiz } from "@/components/FirstQuiz";
import { playUnit, playWord, stopAudio } from "@/lib/audio";
import { completeOnboarding, ONBOARDING_STEPS, patchOnboarding, readOnboarding, recommend, saveStep, type Onboarding, type Recommendation } from "@/lib/onboarding";
import { BookOpen, Check, ChevronLeft, ChevronRight, Headphones, Volume2 } from "lucide-react";

export const Route = createFileRoute("/welcome")({
  head: () => ({ meta: [
    { title: "Welcome to Qaf ق — Learn to read Arabic" },
    { name: "description", content: "Get started with Qaf: hear each sound, choose your path, and read your first Arabic word." },
    { property: "og:title", content: "Welcome to Qaf ق" },
    { property: "og:description", content: "A calm, step-by-step way to learn to read Arabic." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Welcome,
});

const QUIZ_STEP = 6;

function Choice({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  const { t } = useLanguage();
  return (
    <button type="button" role="radio" aria-checked={selected} onClick={onClick}
      className={`flex min-h-16 w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected ? "border-primary bg-accent" : "border-border bg-card"}`}>
      <span className="min-w-0 flex-1">{children}</span>
      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${selected ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{selected && <Check className="h-3.5 w-3.5" />}</span>
    </button>
  );
}

function Welcome() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [o, setO] = useState<Onboarding | null>(null);
  useEffect(() => {
    const s = readOnboarding();
    if (s.completed) navigate({ to: "/", replace: true }); else setO(s);
  }, [navigate]);
  useEffect(() => () => stopAudio(), []);
  if (!o) return <div className="min-h-dvh bg-background" aria-busy="true" />;
  const step = o.step;
  const set = (patch: Partial<Onboarding>) => setO(patchOnboarding(patch));
  const go = (n: number) => { stopAudio(); saveStep(n); setO({ ...readOnboarding(), step: n }); };
  const open = (r: Recommendation) => {
    completeOnboarding();
    if (r.to === "/learn") navigate({ to: "/learn", search: { lesson: r.lesson ?? "fatha" }, replace: true });
    else navigate({ to: "/sounds/practice/$set", params: { set: r.set ?? "fatha" }, replace: true });
  };
  const finishHome = () => { completeOnboarding(); navigate({ to: "/", replace: true }); };
  const rec = recommend(o);
  // Skip on an optional question moves on without saving an answer; skip on intro screens goes to the recommendation.
  const skip = step === 3 || step === 4 ? () => go(step + 1) : step < 3 ? () => go(5) : step === QUIZ_STEP ? finishHome : null;

  let body: ReactNode = null, primary: ReactNode = null;
  if (step === 0) {
    body = <><Ar className="text-8xl font-bold text-primary">ق</Ar><Ar className="text-3xl font-bold text-primary">أَهْلًا وَسَهْلًا</Ar><h1 className="text-2xl font-bold">{t("Welcome to Qaf")}</h1><p className="max-w-xs text-muted-foreground">{t("Arabic Reading, calmly — one sound and one word at a time. No account needed.")}</p></>;
  } else if (step === 1) {
    body = <><h1 className="text-2xl font-bold">{t("Learn by listening")}</h1><p className="max-w-xs text-muted-foreground">{t("Tap a sound to hear it. Tap the speaker to hear the whole word.")}</p>
      <div dir="rtl" className="flex gap-2">{["أَ", "كَ", "لَ"].map((u) => <Button key={u} variant="outline" aria-label={`Hear ${u}`} onClick={() => playUnit(u)} className="sound-button h-16 w-16 border-primary/20 bg-accent text-3xl text-primary"><Ar>{u}</Ar></Button>)}</div>
      <Button variant="ghost" onClick={() => playWord("أَكَلَ")} className="h-14 gap-3 rounded-full text-primary"><Volume2 className="!h-6 !w-6" /><Ar className="text-3xl">أَكَلَ</Ar><span className="text-sm text-muted-foreground">{t("He ate")}</span></Button></>;
  } else if (step === 2) {
    body = <><h1 className="text-2xl font-bold">{t("Choose your path")}</h1><p className="text-sm text-muted-foreground">{t("You can use both any time.")}</p>
      <div role="radiogroup" aria-label="Learning path" className="grid w-full gap-3">
        <Choice selected={o.path === "reading"} onClick={() => set({ path: "reading" })}><span className="flex items-center gap-2 font-bold"><BookOpen className="h-5 w-5 text-primary" />Reading <Ar className="text-primary">القِرَاءَة</Ar></span><span className="block text-xs text-muted-foreground">{t("Build and read whole words, with quizzes and reading tests.")}</span></Choice>
        <Choice selected={o.path === "sounds"} onClick={() => set({ path: "sounds" })}><span className="flex items-center gap-2 font-bold"><Headphones className="h-5 w-5 text-primary" />Sound Practice <Ar className="text-primary">صَوْتِي</Ar></span><span className="block text-xs text-muted-foreground">{t("Hear and repeat every letter with each vowel.")}</span></Choice>
      </div></>;
  } else if (step === 3) {
    body = <><h1 className="text-2xl font-bold">{t("What is your goal?")}</h1><div role="radiogroup" aria-label={t("Goal")} className="grid w-full gap-3">
      {([["read", "Learn to read Arabic"], ["sounds", "Improve Arabic letter sounds"], ["both", "Practise both"]] as const).map(([v, l]) => <Choice key={v} selected={o.goal === v} onClick={() => set({ goal: v })}><span className="font-semibold">{l}</span></Choice>)}
    </div></>;
  } else if (step === 4) {
    body = <><h1 className="text-2xl font-bold">{t("How familiar are you with Arabic reading?")}</h1><div role="radiogroup" aria-label={t("Experience")} className="grid w-full gap-3">
      {([["beginner", "I’m a complete beginner"], ["letters", "I know the letters but need practice"], ["some", "I can read a little and want to improve"]] as const).map(([v, l]) => <Choice key={v} selected={o.level === v} onClick={() => set({ level: v })}><span className="font-semibold">{l}</span></Choice>)}
    </div></>;
  } else if (step === 5) {
    body = <><h1 className="text-2xl font-bold">{t("Your starting point")}</h1>
      <div className="w-full rounded-3xl bg-primary p-5 text-left text-primary-foreground"><p className="text-xs opacity-80">{t("Recommended")}</p><p className="text-lg font-bold">{t(rec.title)}</p><p className="mt-1 text-sm opacity-90">{t(rec.why)}</p></div>
      {rec.alt && <Button variant="outline" className="h-12 w-full rounded-full" onClick={() => open(rec.alt!)}>Start with {rec.alt.title} instead</Button>}
      <p className="text-xs text-muted-foreground">{t("You can change your answers later in Profile.")}</p></>;
    primary = <div className="grid gap-2"><Button className="h-14 rounded-full text-base" onClick={() => go(QUIZ_STEP)}>{t("Try a 3-question first quiz")}<ChevronRight /></Button><Button variant="ghost" className="h-12 rounded-full" onClick={() => open(rec)}>Go straight to {t(rec.title)}</Button></div>;
  }

  return (
    <main className="qaf-onboarding mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-background px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="flex h-11 items-center justify-between">
        {step > 0 ? <Button variant="ghost" size="sm" onClick={() => go(step - 1)}><ChevronLeft />{t("Back")}</Button> : <span />}
        {skip && <Button variant="ghost" size="sm" onClick={skip}>{t("Skip")}</Button>}
      </div>
      {step === QUIZ_STEP ? <FirstQuiz level={o.level} onFinish={() => open(rec)} /> : <>
        <div key={step} className="flex flex-1 animate-in fade-in flex-col items-center justify-center gap-5 text-center duration-300 motion-reduce:animate-none">{body}</div>
        <p className="py-4 text-center text-xs text-muted-foreground" aria-live="polite">Step {step + 1} of {ONBOARDING_STEPS}</p>
        <div className="mb-4 flex justify-center gap-1.5" aria-hidden>{Array.from({ length: ONBOARDING_STEPS }, (_, i) => <span key={i} className={`h-1.5 rounded-full ${i < step ? "w-4 bg-primary/60" : i === step ? "w-6 bg-primary" : "w-1.5 bg-border"}`} />)}</div>
        {primary ?? <Button className="h-14 rounded-full text-base" disabled={step === 2 && !o.path} onClick={() => go(step + 1)}>{t("Continue")}<ChevronRight /></Button>}
      </>}
    </main>
  );
}
