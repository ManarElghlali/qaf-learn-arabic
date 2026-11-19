import { useState } from "react";
import { Bell, CircleAlert, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/lib/i18n";
import { disableReminders, enableReminders, reminderTime, type ReminderResult } from "@/lib/reminders";

const FAILURE: Partial<Record<ReminderResult, string>> = {
  denied: "Notifications are blocked. You can allow them in your phone's settings.",
  unavailable: "This version of the app can't send notifications. Please update Qaf.",
  timeout: "Your phone didn't respond. Please try again.",
  error: "Couldn't set the daily reminder. Please try again.",
};

/**
 * Daily reminder switch. Shows a spinner and "Waiting for your phone…" while the OS answers, then either
 * confirms or leaves an inline explanation (plus a toast) so the switch never looks dead.
 */
export function ReminderToggle({ on, time, onTimeSaved }: { on: boolean; time: string; onTimeSaved: (time: string) => void }) {
  const { t } = useLanguage();
  const [asking, setAsking] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const turnOn = async () => {
    if (asking) return;
    setAsking(true);
    setProblem(null);
    let r: ReminderResult = "error";
    try { r = await enableReminders(time); } catch { r = "error"; } finally { setAsking(false); }
    onTimeSaved(reminderTime());
    const fail = FAILURE[r];
    if (fail) { setProblem(fail); if (r === "denied") toast(t(fail)); else toast.error(t(fail)); return; }
    if (r === "web-limited") toast(t("Reminder saved. Daily notifications are sent by the Qaf phone app."));
    else toast.success(t("Daily reminder set for {time}", { time: reminderTime() }));
  };
  const turnOff = () => { setProblem(null); void disableReminders(); toast(t("Daily reminder turned off")); };

  return (
    <div className="py-2">
      <div className="qaf-profile-row min-h-12">
        <label htmlFor="reminder" className="flex items-center gap-3 text-sm font-medium"><Bell className="h-5 w-5" />{t("Daily reminder")}</label>
        <span className="flex items-center gap-2">
          {asking && <LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />}
          <Switch id="reminder" checked={on || asking} disabled={asking} aria-busy={asking}
            onCheckedChange={(next) => { if (next) void turnOn(); else turnOff(); }} />
        </span>
      </div>
      {asking && <p role="status" className="mt-1 text-xs text-muted-foreground">{t("Waiting for your phone…")}</p>}
      {!asking && problem && (
        <p role="alert" className="mt-2 flex items-start gap-2 rounded-xl bg-error-soft p-3 text-xs font-medium text-destructive">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{t(problem)}
        </p>
      )}
    </div>
  );
}
