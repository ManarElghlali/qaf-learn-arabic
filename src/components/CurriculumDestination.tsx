import { useLanguage } from "@/lib/i18n";
import { Link } from "@tanstack/react-router";
import { Check, ChevronRight, LockKeyhole } from "lucide-react";
import { Ar } from "@/components/AppShell";
import { LESSONS, unitState, type LessonId } from "@/lib/lessons";
import type { Progress } from "@/lib/progress";
import { useAccess, canOpenUnit, FREE_WORDS } from "@/lib/access";

type DestinationProps = {
  ar: string; en: string; image: string; landmark: string; accent: string;
  live: boolean; status: string; progress: Progress;
  lessons: { ar: string; en: string; available?: boolean; lesson?: LessonId | null }[];
};

export function CurriculumDestination({ ar, en, image, landmark, accent, live, status, progress, lessons }: DestinationProps) {
  const { t } = useLanguage();
  const { premium } = useAccess();
  const heading = <>
    <img src={image} alt={`${landmark} illustration`} width={512} height={512} className="destination-art" />
    <div className="min-w-0 flex-1 text-right">
      <Ar className="block text-xl font-bold">{ar}</Ar>
      <p className="text-xs text-muted-foreground">{t(en)}</p>
      <p className={`mt-2 flex items-center justify-end gap-1.5 text-[11px] font-semibold ${live ? "text-primary" : "text-muted-foreground"}`}>
        {live ? <>{status === "Completed" && <Check className="h-3 w-3" />}{t(status)}</> : <><LockKeyhole className="h-3 w-3" /><Ar>قريبًا</Ar> · Coming Soon</>}
      </p>
    </div>
    {live && <ChevronRight className="h-4 w-4 shrink-0 text-primary" />}
  </>;
  return live ? (
    <details className={`destination ${accent}`}>
      <summary className="destination-heading cursor-pointer list-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${t(en)} lessons`}>{heading}</summary>
      <div className="mx-4 mb-3 border-t border-border">
        {lessons.map(l => l.available && l.lesson ? (
          canOpenUnit(l.lesson, premium)
            ? <UnitRow key={t(l.en)} ar={l.ar} en={t(l.en)} state={unitState(progress, l.lesson)} free={!premium} progress={progress} />
            : <Link key={t(l.en)} to="/learn" search={{ lesson: l.lesson }} className="flex min-h-16 items-center justify-between gap-3 border-b border-border/60 py-3 text-muted-foreground last:border-0">
                <LockKeyhole className="h-4 w-4 shrink-0 text-gold" />
                <span className="min-w-0 text-right"><Ar className="block text-base">{l.ar}</Ar><span className="block text-[11px]">{t(l.en)} · Premium</span></span>
              </Link>
        ) : (
          <div key={t(l.en)} aria-disabled="true" className="flex min-h-16 items-center justify-between gap-3 border-b border-border/60 py-3 text-muted-foreground last:border-0">
            <LockKeyhole className="h-4 w-4 shrink-0" />
            <span className="min-w-0 text-right"><Ar className="block text-base">{l.ar}</Ar><span className="block text-[11px]">{t(l.en)} · Coming Soon</span></span>
          </div>
        ))}
      </div>
    </details>
  ) : (
    <article className={`destination ${accent}`} aria-disabled="true">
      <div className="destination-heading">{heading}</div>
      {lessons.length > 0 && <div className="mx-4 mb-3 flex flex-wrap justify-end gap-x-3 gap-y-1 border-t border-border/60 pt-2 text-muted-foreground">{lessons.map(l => <Ar key={t(l.en)} className="text-sm">{l.ar}</Ar>)}</div>}
    </article>
  );
}
const STEP_ROUTE = { learn: "/learn", quiz: "/quiz", test: "/test", done: "/learn" } as const;

function UnitRow({ ar, en, state: s, free, progress }: { ar: string; en: string; state: ReturnType<typeof unitState>; free: boolean; progress: Progress }) {
  const { t } = useLanguage();
  if (free) {
    const learned = FREE_WORDS.filter((w) => progress.learned.includes(w.id)).length;
    return <Link to={learned < FREE_WORDS.length ? "/learn" : "/quiz"} search={{ lesson: s.id }} className="flex min-h-16 items-center justify-between gap-3 border-b border-border/60 py-3">
      <ChevronRight className="h-4 w-4 shrink-0 text-primary" />
      <span className="min-w-0 text-right"><Ar className="block text-lg font-bold">{ar}</Ar><span className="block text-xs text-muted-foreground">{t(en)} · Free: {learned}/{FREE_WORDS.length} words, 5 quizzes, reading test</span></span>
    </Link>;
  }
  const steps = [
    { label: `Learn ${s.learned}/${s.total}`, done: s.lessonsDone },
    { label: t("Quiz"), done: s.quizPassed },
    { label: t("Reading test"), done: s.testPassed },
  ];
  const body = <>
    <span className="flex shrink-0 items-center">{s.unlocked ? (s.complete ? <Check className="h-4 w-4 text-success" /> : <ChevronRight className="h-4 w-4 text-primary" />) : <LockKeyhole className="h-4 w-4" />}</span>
    <span className="min-w-0 text-right">
      <Ar className="block text-lg font-bold">{ar}</Ar>
      <span className="block text-xs text-muted-foreground">{t(en)}{!s.unlocked && s.prev ? ` · Complete ${LESSONS[s.prev].en} first` : s.complete ? " · Completed" : ""}</span>
      {s.unlocked && <span className="mt-1.5 flex flex-wrap justify-end gap-1.5">{steps.map(st => (
        <span key={t(st.label)} className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${st.done ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"}`}>{st.done && <Check className="h-2.5 w-2.5" />}{t(st.label)}</span>
      ))}</span>}
    </span>
  </>;
  return s.unlocked
    ? <Link to={STEP_ROUTE[s.step]} search={{ lesson: s.id }} className="flex min-h-16 items-center justify-between gap-3 border-b border-border/60 py-3">{body}</Link>
    : <div aria-disabled="true" className="flex min-h-16 items-center justify-between gap-3 border-b border-border/60 py-3 text-muted-foreground">{body}</div>;
}
