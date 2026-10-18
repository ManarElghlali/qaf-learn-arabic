import { useLanguage } from "@/lib/i18n";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Ar } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { FirstQuiz } from "@/components/FirstQuiz";
import { WordIllustration } from "@/components/WordIllustration";
import qafSculpture from "@/assets/onboarding/qaf-sculpture.jpg";
import readingBook from "@/assets/onboarding/open-book-badge.png";
import { WORDS } from "@/lib/words";
import { playUnit, playWord, stopAudio } from "@/lib/audio";
import { completeOnboarding, ONBOARDING_STEPS, patchOnboarding, readOnboarding, recommend, saveStep, type Onboarding, type Recommendation } from "@/lib/onboarding";
import { BookOpen, Check, ChevronLeft, ChevronRight, Headphones, Sparkles, Sprout, Star, Volume2 } from "lucide-react";

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

const QUIZ_STEP = 7;
const LISTENING_WORD = WORDS.find((word) => word.ar === "أَكَلَ");

function Choice({ selected, onClick, icon, title, hint }: { selected: boolean; onClick: () => void; icon?: ReactNode; title: ReactNode; hint?: ReactNode }) {
  return (
    <Button variant="outline" type="button" role="radio" aria-checked={selected} onClick={onClick}
      className={`flex min-h-[4.5rem] w-full items-center gap-3.5 rounded-3xl p-4 text-start whitespace-normal transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected ? "glass-card-selected border-2" : "glass-card"}`}>
      {icon && <span className="onboarding-choice-icon grid h-14 w-14 shrink-0 place-items-center rounded-full text-primary">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block font-bold leading-snug">{title}</span>
        {hint && <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{hint}</span>}
      </span>
      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors ${selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card/60"}`}>{selected && <Check className="h-3.5 w-3.5" />}</span>
    </Button>
  );
}

function StepTitle({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="w-full text-start">
      <h1 className="onboarding-heading text-[1.75rem] font-extrabold leading-tight">{children}</h1>
      {hint && <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Welcome() {
  const { t, language, setLanguage } = useLanguage();
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
  const skip = step === 1 || step === 4 || step === 5 ? () => go(step + 1) : step < 4 ? () => go(6) : step === QUIZ_STEP ? finishHome : null;

  let body: ReactNode = null, primary: ReactNode = null;
  if (step === 0) {
    body = <>
      <img src={qafSculpture} alt="ق" width={768} height={1024} className="onboarding-welcome-art" />
      <div className="onboarding-welcome-copy w-full text-start">
        <h1 className="mt-1 max-w-64 text-3xl font-extrabold leading-tight">{t("Arabic, one sound at a time.")}</h1>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">{t("A new language, a bigger world. No account needed.")}</p>
      </div>
    </>;
    primary = <Button className="h-14 rounded-full text-base font-semibold shadow-lg" onClick={() => go(1)}>{t("Let’s begin")}<ChevronRight /></Button>;
  } else if (step === 1) {
    body = <>
      <StepTitle hint={t("Select your preferred language for the app.")}>{t("Choose your language")}</StepTitle>
      <div role="radiogroup" aria-label={t("App language")} className="grid w-full gap-3">
        <Choice selected={language === "en"} onClick={() => setLanguage("en")} title={<span lang="en" dir="ltr" className="text-lg">English</span>} />
        <Choice selected={language === "ar"} onClick={() => setLanguage("ar")} title={<Ar className="text-xl">العربية</Ar>} />
      </div>
    </>;
  } else if (step === 2) {
    body = <>
      <StepTitle hint={t("Tap a sound to hear it. Tap the speaker to hear the whole word.")}>{t("Learn by listening")}</StepTitle>
      {LISTENING_WORD && <WordIllustration word={LISTENING_WORD} className="onboarding-listening-art" />}
      <div dir="rtl" className="flex gap-2.5">{["أَ", "كَ", "لَ"].map((u) => <Button key={u} variant="outline" aria-label={`Hear ${u}`} onClick={() => playUnit(u)} className="sound-button glass-card h-16 w-16 rounded-2xl text-3xl text-primary"><Ar>{u}</Ar></Button>)}</div>
      <Button variant="ghost" onClick={() => playWord("أَكَلَ")} className="h-14 gap-3 rounded-full text-primary"><Volume2 className="!h-6 !w-6" /><Ar className="text-3xl">أَكَلَ</Ar><span className="text-sm text-muted-foreground">{t("He ate")}</span></Button>
    </>;
  } else if (step === 3) {
    body = <>
      <StepTitle hint={t("You can use both or select one.")}>{t("Choose your path")}</StepTitle>
      <div role="radiogroup" aria-label="Learning path" className="grid w-full gap-3">
        <Choice selected={o.path === "reading"} onClick={() => set({ path: "reading" })} icon={<BookOpen className="h-6 w-6" />} title={t("Reading")} hint={t("Build and read whole words, with quizzes and reading tests.")} />
        <Choice selected={o.path === "sounds"} onClick={() => set({ path: "sounds" })} icon={<Headphones className="h-6 w-6" />} title={t("Sound Practice")} hint={t("Hear and repeat every letter with each vowel.")} />
      </div>
    </>;
  } else if (step === 4) {
    body = <>
      <StepTitle hint={t("This helps us personalise your experience.")}>{t("What is your goal?")}</StepTitle>
      <div role="radiogroup" aria-label={t("Goal")} className="grid w-full gap-3">
        <Choice selected={o.goal === "read"} onClick={() => set({ goal: "read" })} icon={<BookOpen className="h-6 w-6" />} title={t("Learn to read Arabic")} />
        <Choice selected={o.goal === "sounds"} onClick={() => set({ goal: "sounds" })} icon={<Volume2 className="h-6 w-6" />} title={t("Improve Arabic letter sounds")} />
        <Choice selected={o.goal === "both"} onClick={() => set({ goal: "both" })} icon={<Sparkles className="h-6 w-6" />} title={t("Practise both")} />
      </div>
    </>;
  } else if (step === 5) {
    body = <>
      <StepTitle hint={t("Choose the level that best fits you.")}>{t("Where are you starting?")}</StepTitle>
      <div role="radiogroup" aria-label={t("Experience")} className="grid w-full gap-3">
        <Choice selected={o.level === "beginner"} onClick={() => set({ level: "beginner" })} icon={<Sprout className="h-6 w-6" />} title={t("I’m a complete beginner")} hint={t("I’ve never learned Arabic before.")} />
        <Choice selected={o.level === "letters"} onClick={() => set({ level: "letters" })} icon={<BookOpen className="h-6 w-6" />} title={t("I know the letters but need practice")} hint={t("I can recognise the letters but want to improve.")} />
        <Choice selected={o.level === "some"} onClick={() => set({ level: "some" })} icon={<Star className="h-6 w-6" />} title={t("I can read a little already")} hint={t("I can read some words and want to improve.")} />
      </div>
    </>;
  } else if (step === 6) {
    body = <>
      <StepTitle hint={t("Based on your answers, we recommend starting with:")}>{t("Your personal learning path")}</StepTitle>
      <div className="onboarding-recommendation glass-card w-full rounded-3xl p-4 text-center">
        <img src={readingBook} alt={t("Reading")} width={1152} height={576} loading="lazy" className="onboarding-book-art" />
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">{t("Recommended")}</p>
        <p className="mt-0.5 text-lg font-bold">{t(rec.title)}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t(rec.why)}</p>
        <Button className="mt-4 h-12 w-full rounded-full font-semibold" onClick={() => open(rec)}>{t("Start this lesson")}<ChevronRight /></Button>
      </div>
      {rec.alt && <Button variant="outline" className="glass-card h-12 w-full rounded-full" onClick={() => { if (rec.alt) open(rec.alt); }}>{t("Start with {lesson} instead", { lesson: t(rec.alt.title) })}</Button>}
      <p className="text-xs text-muted-foreground">{t("You can change your answers later in Profile.")}</p>
    </>;
    primary = <Button variant="outline" className="glass-card h-12 rounded-full font-semibold text-primary" onClick={() => go(QUIZ_STEP)}>{t("Try a 3-question first quiz")}<ChevronRight /></Button>;
  }

  return (
    <main className={`qaf-onboarding relative mx-auto flex w-full max-w-lg flex-col overflow-hidden bg-background px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] ${step === 0 ? "onboarding-welcome" : ""}`}>
      <div className="relative z-10 flex h-11 shrink-0 items-center justify-between">
        {step > 0 ? <Button variant="ghost" size="icon" aria-label={t("Back")} onClick={() => go(step - 1)}><ChevronLeft /></Button> : <span />}
        {skip && <Button variant="ghost" size="sm" onClick={skip}>{t("Skip")}</Button>}
      </div>
      {step === QUIZ_STEP ? <FirstQuiz level={o.level} onFinish={() => open(rec)} /> : <>
        <div key={step} className={`qaf-step-enter onboarding-step relative z-10 flex flex-1 flex-col items-center gap-5 text-center motion-reduce:animate-none ${step === 0 ? "justify-end" : "justify-start"}`}>{body}</div>
        <div className="onboarding-footer relative z-10">
          {primary ?? <Button className="h-14 w-full rounded-full text-base font-semibold" disabled={step === 3 && !o.path} onClick={() => go(step + 1)}>{t("Continue")}<ChevronRight /></Button>}
          <div className="mt-5 flex justify-center gap-1.5" aria-hidden>{Array.from({ length: ONBOARDING_STEPS }, (_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-3 bg-primary" : "w-1.5 bg-border"}`} />)}</div>
        </div>
      </>}
    </main>
  );
}
