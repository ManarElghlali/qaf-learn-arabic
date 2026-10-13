import { Link } from "@tanstack/react-router";
import { Check, ChevronRight, LockKeyhole } from "lucide-react";
import { Ar } from "@/components/AppShell";
import { LESSONS, unitState, type LessonId } from "@/lib/lessons";
import type { Progress } from "@/lib/progress";

type DestinationProps = {
  ar: string; en: string; image: string; landmark: string; accent: string;
  live: boolean; status: string; progress: Progress;
  lessons: { ar: string; en: string; available?: boolean; lesson?: LessonId | null }[];
};

export function CurriculumDestination({ ar, en, image, landmark, accent, live, status, progress, lessons }: DestinationProps) {
  const heading = <>
    <img src={image} alt={`${landmark} illustration`} width={512} height={512} className="destination-art" />
    <div className="min-w-0 flex-1 text-right">
      <Ar className="block text-xl font-bold">{ar}</Ar>
      <p className="text-xs text-muted-foreground">{en}</p>
      <p className={`mt-2 flex items-center justify-end gap-1.5 text-[11px] font-semibold ${live ? "text-primary" : "text-muted-foreground"}`}>
        {live ? <>{status === "Completed" && <Check className="h-3 w-3" />}{status}</> : <><LockKeyhole className="h-3 w-3" /><Ar>قريبًا</Ar> · Coming Soon</>}
      </p>
    </div>
    {live && <ChevronRight className="h-4 w-4 shrink-0 text-primary" />}
  </>;
  return live ? (
    <details className={`destination ${accent}`}>
      <summary className="destination-heading cursor-pointer list-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${en} lessons`}>{heading}</summary>
      <div className="mx-4 mb-3 border-t border-border">
        {lessons.map(l => l.available && l.lesson ? (
          <UnitRow key={l.en} ar={l.ar} en={l.en} state={unitState(progress, l.lesson)} />
        ) : (
          <div key={l.en} aria-disabled="true" className="flex min-h-16 items-center justify-between gap-3 border-b border-border/60 py-3 text-muted-foreground last:border-0">
            <LockKeyhole className="h-4 w-4 shrink-0" />
            <span className="min-w-0 text-right"><Ar className="block text-base">{l.ar}</Ar><span className="block text-[11px]">{l.en} · Coming Soon</span></span>
          </div>
        ))}
      </div>
    </details>
  ) : (
    <article className={`destination ${accent}`} aria-disabled="true">
      <div className="destination-heading">{heading}</div>
      {lessons.length > 0 && <div className="mx-4 mb-3 flex flex-wrap justify-end gap-x-3 gap-y-1 border-t border-border/60 pt-2 text-muted-foreground">{lessons.map(l => <Ar key={l.en} className="text-sm">{l.ar}</Ar>)}</div>}
    </article>
  );
}
const STEP_ROUTE = { learn: "/learn", quiz: "/quiz", test: "/test", done: "/learn" } as const;

function UnitRow({ ar, en, state: s }: { ar: string; en: string; state: ReturnType<typeof unitState> }) {
  const steps = [
    { label: `Learn ${s.learned}/${s.total}`, done: s.lessonsDone },
    { label: "Quiz", done: s.quizPassed },
    { label: "Reading test", done: s.testPassed },
  ];
  const body = <>
    <span className="flex shrink-0 items-center">{s.unlocked ? (s.complete ? <Check className="h-4 w-4 text-success" /> : <ChevronRight className="h-4 w-4 text-primary" />) : <LockKeyhole className="h-4 w-4" />}</span>
    <span className="min-w-0 text-right">
      <Ar className="block text-lg font-bold">{ar}</Ar>
      <span className="block text-xs text-muted-foreground">{en}{!s.unlocked && s.prev ? ` · Complete ${LESSONS[s.prev].en} first` : s.complete ? " · Completed" : ""}</span>
      {s.unlocked && <span className="mt-1.5 flex flex-wrap justify-end gap-1.5">{steps.map(st => (
        <span key={st.label} className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${st.done ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"}`}>{st.done && <Check className="h-2.5 w-2.5" />}{st.label}</span>
      ))}</span>}
    </span>
  </>;
  return s.unlocked
    ? <Link to={STEP_ROUTE[s.step]} search={{ lesson: s.id }} className="flex min-h-16 items-center justify-between gap-3 border-b border-border/60 py-3">{body}</Link>
    : <div aria-disabled="true" className="flex min-h-16 items-center justify-between gap-3 border-b border-border/60 py-3 text-muted-foreground">{body}</div>;
}
