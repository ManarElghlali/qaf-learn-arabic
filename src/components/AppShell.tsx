import { Link } from "@tanstack/react-router";
import { BookOpen, House, Mic, Puzzle, User } from "lucide-react";
import type { ReactNode } from "react";

const tabs = [
  { to: "/", label: "Home", Icon: House },
  { to: "/learn", label: "Learn", Icon: BookOpen },
  { to: "/quiz", label: "Quiz", Icon: Puzzle },
  { to: "/test", label: "Test", Icon: Mic },
  { to: "/profile", label: "Profile", Icon: User },
] as const;

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="qaf-shell mx-auto flex w-full max-w-lg flex-col bg-background">
      <header className="qaf-header sticky top-0 z-10 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border/70 bg-background/95 px-5 pb-3 backdrop-blur sm:px-7">
        {title === "Qaf" ? <h1 className="text-xl font-bold">Qaf<span className="ml-1 text-gold">.</span></h1> : <h1 className="min-w-0 text-lg font-bold">{title}</h1>}
        <Ar className="text-3xl font-bold text-primary" >ق</Ar>
      </header>
      <main className="qaf-main min-w-0 flex-1 px-5 pt-5 sm:px-7">{children}</main>
      <nav aria-label="Main navigation" className="qaf-nav fixed bottom-0 left-1/2 z-20 grid w-full max-w-lg -translate-x-1/2 grid-cols-5 border-t border-border bg-background/95 px-2 pt-2 backdrop-blur">
        {tabs.map(({ to, label, Icon }) => (
          <Link key={to} to={to} activeOptions={{ exact: to === "/" }}
            className="flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
