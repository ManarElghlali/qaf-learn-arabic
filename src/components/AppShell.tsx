import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { parseLesson, type LessonId } from "@/lib/lessons";
import { BookOpen, House, Mic, Puzzle, Settings, User } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

const tabs = [
  { to: "/", label: "Home", Icon: House },
  { to: "/learn", label: "Learn", Icon: BookOpen },
  { to: "/quiz", label: "Quiz", Icon: Puzzle },
  { to: "/test", label: "Test", Icon: Mic },
  { to: "/profile", label: "Profile", Icon: User },
] as const;

const UNIT_KEY = "qaf-current-unit";

// Bottom-nav Learn/Quiz/Test keep the unit you are in, so a unit's quiz and test always use its own word bank.
function useCurrentUnit(): LessonId {
  const loc = useLocation();
  const fromUrl = (loc.search as Record<string, unknown>)["lesson"];
  const [unit, setUnit] = useState<LessonId>("fatha");
  useEffect(() => {
    if (fromUrl !== undefined) { const u = parseLesson(fromUrl); localStorage.setItem(UNIT_KEY, u); setUnit(u); }
    else setUnit(parseLesson(localStorage.getItem(UNIT_KEY)));
  }, [fromUrl]);
  return unit;
}

export function AppShell({ title, children, singleScreen = false }: { title: string; children: ReactNode; singleScreen?: boolean }) {
  const unit = useCurrentUnit();
  return (
    <div className={`qaf-shell mx-auto flex w-full max-w-lg flex-col bg-background ${singleScreen ? "qaf-activity-shell" : ""}`}>
      {title === "Qaf" ? <header className="qaf-header grid grid-cols-[44px_minmax(0,1fr)_44px] items-start gap-3 px-5 pb-4 sm:px-7">
        <Button asChild variant="ghost" size="icon"><Link to="/profile" aria-label="Settings" title="Settings"><Settings /></Link></Button>
        <div className="text-center"><Ar className="qaf-brand-symbol block font-bold text-primary">ق</Ar><h1 className="text-lg font-bold text-primary">Qaf<span className="text-gold">.</span></h1><p className="text-[11px] font-semibold text-primary">Arabic Reading</p></div>
        <Button asChild variant="ghost" size="icon"><Link to="/profile" aria-label="Profile" title="Profile"><User /></Link></Button>
      </header> : <header className="qaf-header sticky top-0 z-10 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border/70 bg-background/95 px-5 pb-3 backdrop-blur sm:px-7">
        <h1 className="min-w-0 text-lg font-bold">{title}</h1><Ar className="text-3xl font-bold text-primary">ق</Ar>
      </header>}
      <main className="qaf-main min-w-0 flex-1 px-5 pt-5 sm:px-7">{children}</main>
      <nav aria-label="Main navigation" className="qaf-nav fixed bottom-0 left-1/2 z-20 grid w-full max-w-lg -translate-x-1/2 grid-cols-5 border-t border-border bg-background/95 px-2 pt-2 backdrop-blur">
        {tabs.map(({ to, label, Icon }) => (
          <Link key={to} to={to} search={(to === "/learn" || to === "/quiz" || to === "/test" ? { lesson: unit } : {}) as never} activeOptions={{ exact: to === "/" }}
            className="flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            activeProps={{ className: "bg-accent text-primary font-bold", "aria-current": "page" }}>
            <Icon className="h-5 w-5 shrink-0" strokeWidth={1.8} />{label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export const Ar = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <span dir="rtl" lang="ar" className={`font-arabic ${className}`}>{children}</span>
);
