import { Link } from "@tanstack/react-router";
import { Ar } from "@/components/AppShell";
import { LESSONS, type LessonId } from "@/lib/lessons";

// Lets Quiz and Test pick which Short Sounds lesson's words to use.
export function LessonSwitch({ to, current }: { to: "/quiz" | "/test"; current: LessonId }) {
  return (
    <div role="tablist" aria-label="Choose lesson" className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1">
      {(Object.keys(LESSONS) as LessonId[]).map((id) => (
        <Link key={id} to={to} search={{ lesson: id }} role="tab" aria-selected={current === id}
          className={`flex min-h-11 flex-col items-center justify-center rounded-xl px-2 text-center text-xs ${current === id ? "bg-card font-semibold text-primary shadow-sm" : "text-muted-foreground"}`}>
          <Ar className="text-sm">{LESSONS[id].ar}</Ar><span className="text-[10px]">{LESSONS[id].en}</span>
        </Link>
      ))}
    </div>
  );
}
