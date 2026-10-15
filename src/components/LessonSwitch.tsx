import { useLanguage } from "@/lib/i18n";
import { Link } from "@tanstack/react-router";
import { LockKeyhole } from "lucide-react";
import { Ar } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { LESSONS, UNIT_ORDER, unitState, type LessonId } from "@/lib/lessons";
import type { Progress } from "@/lib/progress";

// Switches Learn / Quiz / Test between units; units not yet unlocked are shown but disabled.
export function LessonSwitch({ to, current, progress }: { to: "/learn" | "/quiz" | "/test"; current: LessonId; progress: Progress }) {
  return (
    <div role="tablist" aria-label="Choose unit" className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1">
      {UNIT_ORDER.map((id) => {
        const open = unitState(progress, id).unlocked;
        const cls = `flex min-h-11 flex-col items-center justify-center rounded-xl px-2 text-center text-xs ${current === id ? "bg-card font-semibold text-primary shadow-sm" : "text-muted-foreground"}`;
        const label = <><Ar className="flex items-center gap-1 text-sm">{!open && <LockKeyhole className="h-3 w-3" />}{LESSONS[id].ar}</Ar><span className="text-[10px]">{LESSONS[id].en}</span></>;
        return open
          ? <Link key={id} to={to} search={{ lesson: id }} role="tab" aria-selected={current === id} className={cls}>{label}</Link>
          : <div key={id} role="tab" aria-selected={false} aria-disabled="true" className={`${cls} opacity-60`}>{label}</div>;
      })}
    </div>
  );
}

const STEP_ROUTE = { learn: "/learn", quiz: "/quiz", test: "/test", done: "/learn" } as const;

/** Shown instead of a step the learner hasn't reached yet; points to the step they need. */
export function UnitLocked({ id, progress, need }: { id: LessonId; progress: Progress; need: "unit" | "quiz" | "test" }) {
  const { t } = useLanguage();
  const s = unitState(progress, id);
  const prevName = s.prev ? LESSONS[s.prev].en : "";
  const text = need === "unit"
    ? t("Complete the {lesson} unit first: its lessons, quiz and reading test.", { lesson: t(prevName) })
    : need === "quiz" ? t("Learn all {total} {lesson} words first ({done}/{total} done).", { total: s.total, lesson: t(LESSONS[id].en), done: s.learned })
    : t("Pass the {lesson} quiz first (70% or more).", { lesson: t(LESSONS[id].en) });
  const target = need === "unit" && s.prev ? { route: STEP_ROUTE[unitState(progress, s.prev).step], lesson: s.prev } : { route: STEP_ROUTE[s.step], lesson: id };
  return (
    <div className="learning-surface p-6 text-center">
      <LockKeyhole className="mx-auto h-8 w-8 text-muted-foreground" />
      <h2 className="mt-3 text-lg font-bold">{t("Not unlocked yet")}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
      <Button asChild className="mt-5 w-full"><Link to={target.route} search={{ lesson: target.lesson }}>{t("Continue")}</Link></Button>
    </div>
  );
}
