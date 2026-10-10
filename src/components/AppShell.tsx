import { Link } from "@tanstack/react-router";
import { BookOpen, Home, Mic, Puzzle, User } from "lucide-react";
import type { ReactNode } from "react";

const tabs = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/learn", label: "Learn", Icon: BookOpen },
  { to: "/quiz", label: "Quiz", Icon: Puzzle },
  { to: "/test", label: "Test", Icon: Mic },
  { to: "/profile", label: "Profile", Icon: User },
] as const;

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 px-5 pb-3 pt-6 backdrop-blur">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      </header>
      <main className="flex-1 px-5 pb-28 pt-4">{children}</main>
      <nav className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-md -translate-x-1/2 justify-around border-t border-border bg-card/95 px-2 pb-5 pt-2 backdrop-blur">
        {tabs.map(({ to, label, Icon }) => (
          <Link key={to} to={to} activeOptions={{ exact: to === "/" }}
            className="flex flex-col items-center gap-1 rounded-xl px-3 py-1 text-xs text-muted-foreground"
            activeProps={{ className: "text-primary font-semibold" }}>
            <Icon className="h-5 w-5" />{label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export const Ar = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <span dir="rtl" lang="ar" className={`font-arabic ${className}`}>{children}</span>
);
