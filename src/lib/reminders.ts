import { readProgress, update } from "./progress";

const TIME_KEY = "qaf-reminder-time";
const REMINDER_ID = 1001;

export function reminderTime(): string {
  try { const t = localStorage.getItem(TIME_KEY); return t && /^\d{2}:\d{2}$/.test(t) ? t : "19:00"; } catch { return "19:00"; }
}

async function native() {
  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform()) return null;
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  return LocalNotifications;
}

export type ReminderResult = "on" | "denied" | "web-limited";

async function schedule(time: string) {
  const LN = await native();
  if (!LN) return false;
  const [hour, minute] = time.split(":").map(Number);
  await LN.cancel({ notifications: [{ id: REMINDER_ID }] });
  await LN.schedule({ notifications: [{
    id: REMINDER_ID, title: "Time for Arabic 📖", body: "A few minutes of reading keeps your streak going.",
    schedule: { on: { hour, minute }, repeats: true, allowWhileIdle: true },
  }] });
  return true;
}

/** Call only from a user tap, after explaining why we ask. */
export async function enableReminders(time = reminderTime()): Promise<ReminderResult> {
  const LN = await native();
  if (LN) {
    const p = await LN.requestPermissions();
    if (p.display !== "granted") return "denied";
    await schedule(time);
    update((s) => ({ ...s, reminders: true }));
    return "on";
  }
  if (typeof Notification === "undefined") return "web-limited";
  const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (perm !== "granted") return "denied";
  update((s) => ({ ...s, reminders: true }));
  return "web-limited";
}

export async function disableReminders() {
  update((s) => ({ ...s, reminders: false }));
  const LN = await native();
  if (LN) await LN.cancel({ notifications: [{ id: REMINDER_ID }] });
}

export async function setReminderTime(time: string) {
  try { localStorage.setItem(TIME_KEY, time); } catch { /* ignore */ }
  if (readProgress().reminders) await schedule(time);
}
