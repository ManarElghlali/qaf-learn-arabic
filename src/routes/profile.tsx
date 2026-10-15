import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { patchOnboarding, readOnboarding, type Goal, type Level } from "@/lib/onboarding";
import { Bell, ChevronRight, Crown, RotateCcw, Shield } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { disableReminders, enableReminders, reminderTime, setReminderTime } from "@/lib/reminders";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/AppShell";
import { Paywall } from "@/components/Paywall";
import { update, useProgress } from "@/lib/progress";
import { WORDS } from "@/lib/words";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Profile & settings — Qaf" },
      { name: "description", content: "Your streak, words learned, test scores and settings." },
      { property: "og:title", content: "Profile — Qaf" },
      { property: "og:description", content: "Track your Arabic reading progress." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const p = useProgress();
  const [pay, setPay] = useState(false);
  const [goal, setGoal] = useState<Goal | undefined>();
  const [level, setLevel] = useState<Level | undefined>();
  useEffect(() => { const o = readOnboarding(); setGoal(o.goal); setLevel(o.level); }, []);
  const [time, setTime] = useState("19:00");
  const [ask, setAsk] = useState(false);
  useEffect(() => { setTime(reminderTime()); }, []);
  const turnOn = async () => {
    setAsk(false);
    const r = await enableReminders(time);
    if (r === "denied") toast("Notifications are blocked. You can allow them in your phone's settings.");
    else if (r === "web-limited") toast("Reminder saved. Daily notifications are sent by the Qaf phone app.");
    else toast.success(`Daily reminder set for ${time}`);
  };
  const best = p.scores.length ? Math.max(...p.scores) : 0;
  return (
    <AppShell title="Profile">
      <h2 className="mb-3 text-base font-semibold">Your progress</h2>
      <div className="grid grid-cols-3 gap-2">
        {[["Streak", `${p.streak}`], ["Words", `${p.learned.length}/${WORDS.length}`], ["Best test", `${best}%`]].map(([l, v]) => (
          <div key={l} className="rounded-2xl border border-border bg-card px-2 py-4 text-center">
            <p className="text-xl font-bold text-primary">{v}</p><p className="text-xs text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>
      {p.scores.length > 0 && <p className="mt-3 text-sm text-muted-foreground">Recent tests: {p.scores.slice(-5).join("%, ")}%</p>}
      <h2 className="mb-2 mt-7 text-base font-semibold">Your learning preferences</h2>
      <label className="mb-3 block text-sm font-medium">Goal
        <select value={goal ?? ""} onChange={(e) => { const v = (e.target.value || undefined) as Goal | undefined; setGoal(v); patchOnboarding({ goal: v }); }} className="mt-1 h-12 w-full rounded-xl border border-border bg-card px-3 text-sm">
          <option value="">Not set</option><option value="read">Learn to read Arabic</option><option value="sounds">Improve Arabic letter sounds</option><option value="both">Practise both</option>
        </select></label>
      <label className="block text-sm font-medium">Experience
        <select value={level ?? ""} onChange={(e) => { const v = (e.target.value || undefined) as Level | undefined; setLevel(v); patchOnboarding({ level: v }); }} className="mt-1 h-12 w-full rounded-xl border border-border bg-card px-3 text-sm">
          <option value="">Not set</option><option value="beginner">I’m a complete beginner</option><option value="letters">I know the letters but need practice</option><option value="some">I can read a little and want to improve</option>
        </select></label>
      <h2 className="mb-2 mt-7 text-base font-semibold">Settings</h2>
      <div className="divide-y divide-border">
        <div className="flex min-h-16 items-center justify-between gap-3 py-2">
          <label htmlFor="reminder" className="flex items-center gap-3 text-sm font-medium"><Bell className="h-5 w-5" />Daily reminder</label>
          <Switch id="reminder" checked={p.reminders} onCheckedChange={(on) => { if (on) setAsk(true); else { void disableReminders(); toast("Daily reminder turned off"); } }} />
        </div>
        {ask && (
          <div className="rounded-2xl border border-border bg-card p-4 text-sm">
            <p className="mb-3 text-muted-foreground">Qaf will send one gentle notification a day to remind you to practise. We'll ask your phone for permission next. You can turn it off any time.</p>
            <div className="flex gap-2"><Button onClick={() => void turnOn()} className="flex-1">Allow reminders</Button><Button variant="outline" onClick={() => setAsk(false)} className="flex-1">Not now</Button></div>
          </div>
        )}
        {p.reminders && (
          <label className="flex min-h-14 items-center justify-between text-sm font-medium">Reminder time
            <input type="time" value={time} onChange={(e) => { setTime(e.target.value); void setReminderTime(e.target.value); }} className="h-11 rounded-xl border border-border bg-card px-3" /></label>
        )}
        <Button variant="ghost" onClick={() => setPay(true)} className="h-16 w-full justify-between rounded-none px-0 text-sm font-medium">
          <span className="flex items-center gap-3"><Crown className="h-5 w-5" />{p.premium ? "Premium active" : "Go Premium"}</span><ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button asChild variant="ghost" className="h-16 w-full justify-between rounded-none px-0 text-sm font-medium">
          <Link to="/privacy"><span className="flex items-center gap-3"><Shield className="h-5 w-5" />Privacy Policy</span><ChevronRight className="h-4 w-4 text-muted-foreground" /></Link>
        </Button>
        <Button variant="ghost" onClick={() => { if (confirm("Reset all progress?")) update((s) => ({ ...s, learned: [], streak: 0, scores: [], lastDay: "" })); }}
          className="h-16 w-full justify-start gap-3 rounded-none px-0 text-sm font-medium text-destructive"><RotateCcw className="h-5 w-5" />Reset progress</Button>
      </div>
      <Paywall open={pay} onClose={() => setPay(false)} />
    </AppShell>
  );
}
