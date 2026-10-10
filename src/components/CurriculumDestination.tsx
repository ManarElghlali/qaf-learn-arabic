import { Link } from "@tanstack/react-router";
import { Check, ChevronRight, LockKeyhole } from "lucide-react";
import { Ar } from "@/components/AppShell";
import { SHORT_LESSONS } from "@/lib/learning-path";
import { LESSONS } from "@/lib/lessons";

type DestinationProps = {
  ar: string; en: string; image: string; landmark: string; accent: string;
  live: boolean; status: string; completed: Record<string, number>;
  lessons: { ar: string; en: string }[];
};

export function CurriculumDestination({ ar, en, image, landmark, accent, live, status, completed, lessons }: DestinationProps) {
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
      <summary className="destination-heading cursor-pointer list-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Short Sounds lessons">{heading}</summary>
      <div className="mx-4 mb-3 border-t border-border">
        {SHORT_LESSONS.map(l => l.available ? (
          <Link to="/learn" search={{ lesson: l.lesson! }} key={l.en} className="flex min-h-16 items-center justify-between gap-3 border-b border-border/60 py-3">
            <span className="text-xs text-primary">{completed[l.lesson!]}/{LESSONS[l.lesson!].words.length}</span>
            <span className="text-right"><Ar className="block text-lg font-bold">{l.ar}</Ar><span className="text-xs text-muted-foreground">{l.en}</span></span>
          </Link>
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