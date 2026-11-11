// Daily reminders: local notifications on the phone apps only (no push server, no cost).
import { readProgress, update } from "./progress";
import { readLanguage, translate, type Language } from "./i18n";

const TIME_KEY = "qaf-reminder-time";
export const REMINDER_ID = 1001;
export const DEFAULT_REMINDER_TIME = "19:00";

/** "HH:MM" (00:00–23:59) → hour/minute, or null for anything else (e.g. a cleared time field). */
export function parseReminderTime(time: string): { hour: number; minute: number } | null {
  const m = /^(\d{2}):(\d{2})$/.exec(time);
  if (!m) return null;
  const hour = Number(m[1]), minute = Number(m[2]);
  return hour <= 23 && minute <= 59 ? { hour, minute } : null;
}

export function reminderTime(): string {
  try { const t = localStorage.getItem(TIME_KEY) ?? ""; return parseReminderTime(t) ? t : DEFAULT_REMINDER_TIME; } catch { return DEFAULT_REMINDER_TIME; }
}

/** One repeating daily notification. Inexact on Android: a reminder never needs the "Alarms & reminders" permission. */
export function reminderNotification(time: string, language: Language) {
  const at = parseReminderTime(time) ?? parseReminderTime(DEFAULT_REMINDER_TIME)!;
  return {
    id: REMINDER_ID,
    title: translate(language, "Time for Arabic"),
    body: translate(language, "A few minutes of reading keeps your streak going."),
    schedule: { on: { hour: at.hour, minute: at.minute }, repeats: true, allowWhileIdle: true },
    isExactNotification: false,
  };
}

async function native() {
  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform()) return null;
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  return LocalNotifications;
}

export type ReminderResult = "on" | "denied" | "web-limited" | "error";

async function schedule(time: string) {
  const LN = await native();
  if (!LN) return false;
  await LN.cancel({ notifications: [{ id: REMINDER_ID }] }).catch(() => {});
  await LN.schedule({ notifications: [reminderNotification(time, readLanguage())] });
  return true;
}

function saveTime(time: string) {
  try { localStorage.setItem(TIME_KEY, time); } catch { /* ignore */ }
}

/** Call only from a user tap, after explaining why we ask. */
export async function enableReminders(time = reminderTime()): Promise<ReminderResult> {
  if (!parseReminderTime(time)) time = reminderTime();
  saveTime(time);
  try {
    const LN = await native();
    if (LN) {
      const current = await LN.checkPermissions();
      const p = current.display === "granted" ? current : await LN.requestPermissions();
      if (p.display !== "granted") return "denied";
      await schedule(time);
      update((s) => ({ ...s, reminders: true }));
      return "on";
    }
    // Website: keep the preference so the phone app picks it up; browsers can't send daily reminders reliably.
    if (typeof Notification !== "undefined") {
      const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
      if (perm !== "granted") return "denied";
    }
    update((s) => ({ ...s, reminders: true }));
    return "web-limited";
  } catch (e) {
    console.error("[reminders] enable failed", e);
    return "error";
  }
}

export async function disableReminders() {
  update((s) => ({ ...s, reminders: false }));
  try {
    const LN = await native();
    if (LN) await LN.cancel({ notifications: [{ id: REMINDER_ID }] });
  } catch (e) { console.error("[reminders] cancel failed", e); }
}

/** Returns false when the time is invalid or the phone refused to reschedule. */
export async function setReminderTime(time: string): Promise<boolean> {
  if (!parseReminderTime(time)) return false;
  saveTime(time);
  if (!readProgress().reminders) return true;
  try { await schedule(time); return true; } catch (e) { console.error("[reminders] reschedule failed", e); return false; }
}

/**
 * On app start (no prompts): if reminders are on, keep the switch honest with the phone's permission
 * and refresh the schedule so it follows the saved time and app language.
 */
export async function syncReminders() {
  if (!readProgress().reminders) return;
  try {
    const LN = await native();
    if (!LN) return;
    const p = await LN.checkPermissions();
    if (p.display !== "granted") { update((s) => ({ ...s, reminders: false })); return; }
    await schedule(reminderTime());
  } catch (e) { console.error("[reminders] sync failed", e); }
}
