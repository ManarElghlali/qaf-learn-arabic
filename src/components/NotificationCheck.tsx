import { useState } from "react";
import { ChevronDown, LoaderCircle, RefreshCw, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { collectReminderDiagnostics, REMINDER_ID, TEST_REMINDER_ID, type ReminderDiagnostics } from "@/lib/reminders";
import { clearReminderLog, type ReminderEventKind } from "@/lib/reminder-log";

const PERMISSION: Record<string, string> = { granted: "Allowed", denied: "Blocked", prompt: "Not asked yet", "prompt-with-rationale": "Not asked yet" };
const PLATFORM = { ios: "iPhone", android: "Android", web: "Website" } as const;
const KIND: Record<ReminderEventKind, string> = { error: "Error", scheduled: "Scheduled", delivered: "Delivered", denied: "Permission refused" };

/** Read-only notification status for learners and support: permission, what the phone has scheduled, recent events. */
export function NotificationCheck() {
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [d, setD] = useState<ReminderDiagnostics | null>(null);
  const load = async () => {
    setBusy(true);
    try { setD(await collectReminderDiagnostics()); } finally { setBusy(false); }
  };
  const toggle = () => { const next = !open; setOpen(next); if (next) void load(); };
  const time = (iso: string) => new Date(iso).toLocaleString(language === "ar" ? "ar" : undefined, { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="py-1">
      <Button variant="ghost" onClick={toggle} aria-expanded={open} className="h-14 w-full justify-between rounded-none px-0 text-sm font-medium">
        <span className="flex items-center gap-3"><Stethoscope className="h-5 w-5" />{t("Notification check")}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </Button>
      {open && (
        <div className="mb-3 rounded-2xl border border-border bg-card p-4 text-sm" aria-live="polite">
          {!d ? (
            <p className="flex items-center gap-2 text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" />{t("Checking…")}</p>
          ) : (
            <>
              {d.problems.length ? (
                <ul className="mb-3 space-y-1 rounded-xl bg-error-soft p-3 text-destructive">{d.problems.map((p) => <li key={p}>{t(p)}</li>)}</ul>
              ) : (
                <p className="mb-3 rounded-xl bg-success-soft p-3 font-medium text-success">{t("Everything looks right.")}</p>
              )}
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
                <dt className="text-muted-foreground">{t("Device")}</dt><dd className="text-end">{t(PLATFORM[d.platform])}</dd>
                <dt className="text-muted-foreground">{t("Permission")}</dt><dd className="text-end">{t(PERMISSION[d.permission] ?? "Unknown")}</dd>
                <dt className="text-muted-foreground">{t("Daily reminder")}</dt><dd className="text-end">{d.switchOn ? `${t("On")} · ${d.savedTime}` : t("Off")}</dd>
                {d.exactAlarms && (<><dt className="text-muted-foreground">{t("Exact timing")}</dt><dd className="text-end">{d.exactAlarms === "granted" ? t("Allowed") : t("Not allowed — reminders may arrive a few minutes late")}</dd></>)}
              </dl>
              <h3 className="mb-1 mt-4 font-semibold">{t("Scheduled reminders")}</h3>
              {d.scheduled.length ? (
                <ul className="space-y-1">{d.scheduled.map((s) => (
                  <li key={s.id} className="flex justify-between gap-3"><span>{s.id === REMINDER_ID ? t("Daily reminder") : s.id === TEST_REMINDER_ID ? t("Test reminder") : s.title}</span><span className="text-muted-foreground">{s.daily ? t("Daily at {time}", { time: s.when }) : s.when}</span></li>
                ))}</ul>
              ) : <p className="text-muted-foreground">{t(d.platform === "web" ? "Daily notifications are sent by the Qaf phone app." : "None scheduled")}</p>}
              {d.onScreen !== null && <p className="mt-1 text-muted-foreground">{t("Notifications on screen: {count}", { count: d.onScreen })}</p>}
              <h3 className="mb-1 mt-4 font-semibold">{t("Recent activity")}</h3>
              {d.log.length ? (
                <ul className="space-y-2">{d.log.slice(0, 6).map((e, i) => (
                  <li key={`${e.at}-${i}`} className="rounded-xl bg-muted/50 p-2">
                    <p className="flex justify-between gap-2"><span className={e.kind === "error" || e.kind === "denied" ? "font-medium text-destructive" : e.kind === "delivered" ? "font-medium text-success" : "font-medium"}>{t(KIND[e.kind])} · {e.source}</span><span className="shrink-0 text-xs text-muted-foreground">{time(e.at)}</span></p>
                    {e.message && <p dir="ltr" className="mt-0.5 break-words text-xs text-muted-foreground">{e.message}</p>}
                  </li>
                ))}</ul>
              ) : <p className="text-muted-foreground">{t("No activity recorded yet")}</p>}
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" disabled={busy} onClick={() => void load()} className="gap-2">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}{t("Refresh")}</Button>
                <Button variant="ghost" size="sm" disabled={busy || !d.log.length} onClick={() => { clearReminderLog(); void load(); }}>{t("Clear history")}</Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
