import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Bell, Crown, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Paywall } from "@/components/Paywall";
import { update, useProgress } from "@/lib/progress";
import { WORDS } from "@/lib/words";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile & settings — Qaf" },
      { name: "description", content: "Your streak, words learned, test scores and reminders." },
      { property: "og:title", content: "Profile — Qaf" },
      { property: "og:description", content: "Track your Arabic reading progress." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const p = useProgress();
  const [pay, setPay] = useState(false);
  const best = p.scores.length ? Math.max(...p.scores) : 0;
  const toggleRem = async () => {
    if (!p.reminders && "Notification" in window) {
      const r = await Notification.requestPermission();
      if (r !== "granted") return toast.error("Notifications are blocked in your browser");
      new Notification("Qaf", { body: "Daily reminders are on. See you tomorrow!" });
    }
    update((s) => ({ ...s, reminders: !s.reminders }));
  };
  return (
    <AppShell title="Profile">
      <div className="grid grid-cols-3 gap-3">
        {[["Streak", `${p.streak}🔥`], ["Words", `${p.learned.length}/${WORDS.length}`], ["Best test", `${best}%`]].map(([l, v]) => (
          <div key={l} className="rounded-2xl border border-border bg-card p-4 text-center">
            <p className="text-xl font-bold">{v}</p><p className="text-xs text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>
      {p.scores.length > 0 && <p className="mt-3 text-sm text-muted-foreground">Recent tests: {p.scores.slice(-5).join("%, ")}%</p>}
      <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
        <button onClick={toggleRem} className="flex w-full items-center justify-between p-4">
          <span className="flex items-center gap-3"><Bell className="h-5 w-5" />Daily reminder</span>
          <span className={`h-7 w-12 rounded-full p-1 transition ${p.reminders ? "bg-primary" : "bg-muted"}`}>
            <span className={`block h-5 w-5 rounded-full bg-card transition ${p.reminders ? "translate-x-5" : ""}`} />
          </span>
        </button>
        <button onClick={() => setPay(true)} className="flex w-full items-center justify-between p-4">
          <span className="flex items-center gap-3"><Crown className="h-5 w-5" />{p.premium ? "Premium active" : "Go Premium"}</span>
        </button>
        <button onClick={() => { if (confirm("Reset all progress?")) update((s) => ({ ...s, learned: [], streak: 0, scores: [], lastDay: "" })); }}
          className="flex w-full items-center gap-3 p-4 text-destructive"><RotateCcw className="h-5 w-5" />Reset progress</button>
      </div>
      <Paywall open={pay} onClose={() => setPay(false)} />
    </AppShell>
  );
}
