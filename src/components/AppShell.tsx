import { Link, useLocation } from "@tanstack/react-router";
import { BookOpen, ClipboardCheck, Headphones, House, Mic, Settings, User } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

const mainTabs = [
  { to: "/", label: "Home", Icon: House, match: (p: string) => p === "/" },
  { to: "/reading", label: "Reading", Icon: BookOpen, match: (p: string) => /^\/(reading|learn)/.test(p) },
  { to: "/sounds", label: "Sound Practice", Icon: Headphones, match: (p: string) => p.startsWith("/sounds") },
  { to: "/profile", label: "Profile", Icon: User, match: (p: string) => p.startsWith("/profile") },
];
// Inside a Reading unit the bar shows that unit's own activities.
const unitTabs = [
  { to: "/", label: "Home", Icon: House, match: (p: string) => p === "/" },
  { to: "/learn", label: "Reading", Icon: BookOpen, match: (p: string) => p.startsWith("/learn") },
  { to: "/quiz", label: "Quiz", Icon: ClipboardCheck, match: (p: string) => p.startsWith("/quiz") },
  { to: "/test", label: "Test", Icon: Mic, match: (p: string) => p.startsWith("/test") },
];

export function AppShell({ title, children, singleScreen = false }: { title: string; children: ReactNode; singleScreen?: boolean }) {
  const loc = useLocation();
  const path = loc.pathname;
  const inUnit = /^\/(learn|quiz|test)/.test(path);
  const lesson = (loc.search as { lesson?: string })?.lesson;
  const tabs = inUnit ? unitTabs : mainTabs;
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
      <nav aria-label="Main navigation" className={`qaf-nav z-20 grid w-full max-w-lg grid-cols-4 border-t border-border bg-background/95 px-2 pt-2 backdrop-blur ${singleScreen ? "relative shrink-0" : "fixed bottom-0 left-1/2 -translate-x-1/2"}`}>
        {tabs.map(({ to, label, Icon, match }) => {
          const on = match(path);
          return (
            <Link key={to} to={to} aria-current={on ? "page" : undefined}
              className={`flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${on ? "bg-accent font-bold text-primary" : "font-medium text-muted-foreground"}`}>
              <Icon className="h-5 w-5 shrink-0" strokeWidth={1.8} />{label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export const Ar = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <span dir="rtl" lang="ar" className={`font-arabic ${className}`}>{children}</span>
);
