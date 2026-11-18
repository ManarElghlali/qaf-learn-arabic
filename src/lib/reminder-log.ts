// Small on-phone history of reminder events (scheduled, delivered, errors) for the Notification check panel.
// Kept separate from learning progress; holds no personal data, only event kinds and plugin messages.
export type ReminderEventKind = "error" | "scheduled" | "delivered" | "denied";
export type ReminderEvent = { at: string; kind: ReminderEventKind; source: string; message: string };

export const REMINDER_LOG_KEY = "qaf-reminder-log";
export const REMINDER_LOG_LIMIT = 12;

export function readReminderLog(): ReminderEvent[] {
  try {
    const raw = JSON.parse(localStorage.getItem(REMINDER_LOG_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((e) => e && typeof e.kind === "string" && typeof e.at === "string") : [];
  } catch { return []; }
}

/** Newest first, capped so the history never grows. */
export function appendReminderEvent(log: ReminderEvent[], event: ReminderEvent, limit = REMINDER_LOG_LIMIT): ReminderEvent[] {
  return [event, ...log].slice(0, limit);
}

export function errorMessage(e: unknown): string {
  const code = (e as { code?: unknown } | null)?.code;
  const msg = e instanceof Error ? e.message : typeof e === "string" ? e : JSON.stringify(e) ?? String(e);
  return (code ? `${String(code)}: ${msg}` : msg).slice(0, 300);
}

export function recordReminderEvent(kind: ReminderEventKind, source: string, detail: unknown = "") {
  const message = kind === "error" ? errorMessage(detail) : String(detail ?? "").slice(0, 300);
  if (kind === "error") console.error(`[reminders] ${source} failed`, detail);
  try {
    localStorage.setItem(REMINDER_LOG_KEY, JSON.stringify(appendReminderEvent(readReminderLog(), { at: new Date().toISOString(), kind, source, message })));
  } catch { /* storage full or blocked: diagnostics are best effort */ }
}

export function clearReminderLog() {
  try { localStorage.removeItem(REMINDER_LOG_KEY); } catch { /* ignore */ }
}

type PendingLike = { id: number; title?: string; schedule?: { at?: string | Date; on?: { hour?: number; minute?: number }; repeats?: boolean } };
export type ScheduledSummary = { id: number; title: string; when: string; daily: boolean };

const pad = (n: number) => String(n).padStart(2, "0");
/** Turns the phone's pending list into "daily at HH:MM" / one-off time rows. */
export function summarizePending(pending: PendingLike[]): ScheduledSummary[] {
  return pending.map((p) => {
    const on = p.schedule?.on;
    if (on && typeof on.hour === "number") return { id: p.id, title: p.title ?? "", when: `${pad(on.hour)}:${pad(on.minute ?? 0)}`, daily: true };
    const at = p.schedule?.at ? new Date(p.schedule.at) : null;
    const when = at && !Number.isNaN(at.getTime()) ? `${at.toLocaleDateString()} ${pad(at.getHours())}:${pad(at.getMinutes())}` : "";
    return { id: p.id, title: p.title ?? "", when, daily: false };
  });
}
