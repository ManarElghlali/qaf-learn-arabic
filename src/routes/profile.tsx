import { useLanguage } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { patchOnboarding, readOnboarding, type Goal, type Level } from "@/lib/onboarding";
import { Bell, BellRing, ChevronRight, Crown, RotateCcw, Shield } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { disableReminders, enableReminders, reminderTime, sendTestReminder, setReminderTime, syncReminders } from "@/lib/reminders";
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
  const { t, language, setLanguage } = useLanguage();
  const p = useProgress();
  const [pay, setPay] = useState(false);
  const [goal, setGoal] = useState<Goal | undefined>();
  const [level, setLevel] = useState<Level | undefined>();
  useEffect(() => { const o = readOnboarding(); setGoal(o.goal); setLevel(o.level); }, []);
  const [time, setTime] = useState("19:00");
  const [asking, setAsking] = useState(false);
  const [testing, setTesting] = useState(false);
  useEffect(() => { setTime(reminderTime()); }, []);
  const turnOn = async () => {
    if (asking) return;
    setAsking(true);
    const r = await enableReminders(time);
    setAsking(false);
    setTime(reminderTime());
    if (r === "denied") toast(t("Notifications are blocked. You can allow them in your phone's settings."));
    else if (r === "error") toast.error(t("Couldn't set the daily reminder. Please try again."));
    else if (r === "web-limited") toast(t("Reminder saved. Daily notifications are sent by the Qaf phone app."));
    else toast.success(t("Daily reminder set for {time}", { time: reminderTime() }));
  };
  const testReminder = async () => {
    if (testing) return;
    setTesting(true);
    const r = await sendTestReminder();
    if (r === "sent") { toast.success(t("Test reminder on its way. It arrives in 5 seconds.")); setTimeout(() => setTesting(false), 5000); return; }
    setTesting(false);
    if (r === "denied") toast(t("Notifications are blocked. You can allow them in your phone's settings."));
    else if (r === "web-limited") toast(t("Test reminders are sent by the Qaf phone app."));
    else toast.error(t("Couldn't set the daily reminder. Please try again."));
  };
  const changeTime = async (value: string) => {
    setTime(value);
    if (!value) return; // field cleared mid-edit: keep the saved reminder as it is
    if (!(await setReminderTime(value))) toast.error(t("Couldn't set the daily reminder. Please try again."));
  };
  const best = p.scores.length ? Math.max(...p.scores) : 0;
  return (
    <AppShell title={t("Profile")}>
      <h2 className="mb-3 text-base font-semibold">{t("Your progress")}</h2>
      <div className="grid grid-cols-3 gap-2">
        {[["Streak", `${p.streak}`], ["Words", `${p.learned.length}/${WORDS.length}`], ["Best test", `${best}%`]].map(([l, v]) => (
          <div key={l} className="rounded-2xl border border-border bg-card px-2 py-4 text-center">
            <p className="text-xl font-bold text-primary">{v}</p><p className="text-xs text-muted-foreground">{t(l ?? "")}</p>
          </div>
        ))}
      </div>
      {p.scores.length > 0 && <p className="mt-3 text-sm text-muted-foreground">{t("Recent tests: {scores}%", { scores: p.scores.slice(-5).join("%, ") })}</p>}
      <h2 className="mb-2 mt-7 text-base font-semibold">{t("Your learning preferences")}</h2>
      <label className="mb-3 block text-sm font-medium">{t("Goal")}
        <select value={goal ?? ""} onChange={(e) => { const v = (e.target.value || undefined) as Goal | undefined; setGoal(v); patchOnboarding({ goal: v }); }} className="mt-1 h-12 w-full rounded-xl border border-border bg-card px-3 text-sm">
          <option value="">{t("Not set")}</option><option value="read">{t("Learn to read Arabic")}</option><option value="sounds">{t("Improve Arabic letter sounds")}</option><option value="both">{t("Practise both")}</option>
        </select></label>
      <label className="block text-sm font-medium">{t("Experience")}
        <select value={level ?? ""} onChange={(e) => { const v = (e.target.value || undefined) as Level | undefined; setLevel(v); patchOnboarding({ level: v }); }} className="mt-1 h-12 w-full rounded-xl border border-border bg-card px-3 text-sm">
          <option value="">{t("Not set")}</option><option value="beginner">{t("I’m a complete beginner")}</option><option value="letters">{t("I know the letters but need practice")}</option><option value="some">{t("I can read a little and want to improve")}</option>
        </select></label>
      <h2 className="mb-2 mt-7 text-base font-semibold">{t("Settings")}</h2>
      <div className="divide-y divide-border">
        <label className="qaf-profile-row min-h-16 py-2 text-sm font-medium"><span>{t("App language")}</span>
          <select aria-label={t("App language")} value={language} onChange={(e) => { setLanguage(e.target.value === "ar" ? "ar" : "en"); void syncReminders(); }} className="h-11 rounded-xl border border-border bg-card px-3">
            <option value="en">English</option><option value="ar">العربية</option>
          </select>
        </label>
        <div className="qaf-profile-row min-h-16 py-2">
          <label htmlFor="reminder" className="flex items-center gap-3 text-sm font-medium"><Bell className="h-5 w-5" />{t("Daily reminder")}</label>
          <Switch id="reminder" checked={p.reminders} disabled={asking} aria-busy={asking} onCheckedChange={(on) => { if (on) void turnOn(); else { void disableReminders(); toast(t("Daily reminder turned off")); } }} />
        </div>
        {p.reminders && (
          <label className="qaf-profile-row min-h-14 text-sm font-medium"><span>{t("Reminder time")}</span>
            <input type="time" value={time} onChange={(e) => void changeTime(e.target.value)} className="h-11 rounded-xl border border-border bg-card px-3" /></label>
        )}
        {p.reminders && (
          <Button variant="ghost" onClick={() => void testReminder()} disabled={testing} className="h-14 w-full justify-start gap-3 rounded-none px-0 text-sm font-medium">
            <BellRing className="h-5 w-5" />{t("Send a test reminder")}
          </Button>
        )}
        <Button variant="ghost" onClick={() => setPay(true)} className="h-16 w-full justify-between rounded-none px-0 text-sm font-medium">
          <span className="flex items-center gap-3"><Crown className="h-5 w-5" />{p.premium ? t("Premium active") : t("Go Premium")}</span><ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button asChild variant="ghost" className="h-16 w-full justify-between rounded-none px-0 text-sm font-medium">
          <Link to="/privacy"><span className="flex items-center gap-3"><Shield className="h-5 w-5" />{t("Privacy Policy")}</span><ChevronRight className="h-4 w-4 text-muted-foreground" /></Link>
        </Button>
        <Button asChild variant="ghost" className="h-16 w-full justify-between rounded-none px-0 text-sm font-medium">
          <Link to="/terms"><span className="flex items-center gap-3"><Shield className="h-5 w-5" />{t("Terms of Use")}</span><ChevronRight className="h-4 w-4 text-muted-foreground" /></Link>
        </Button>
        <Button variant="ghost" onClick={() => { if (confirm(t("Reset all progress?"))) update((s) => ({ ...s, learned: [], streak: 0, scores: [], lastDay: "" })); }}
          className="h-16 w-full justify-start gap-3 rounded-none px-0 text-sm font-medium text-destructive"><RotateCcw className="h-5 w-5" />{t("Reset progress")}</Button>
      </div>
      <Paywall open={pay} onClose={() => setPay(false)} />
    </AppShell>
  );
}
