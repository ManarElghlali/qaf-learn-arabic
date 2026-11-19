// Daily reminders: local notifications on the phone apps only (no push server, no cost).
import { readProgress, update } from "./progress";
import { readLanguage, translate, type Language } from "./i18n";
import { withTimeout } from "./timeout";
import { errorMessage, readReminderLog, recordReminderEvent, summarizePending, type ReminderEvent, type ScheduledSummary } from "./reminder-log";

/** Plugin calls answer in milliseconds; the permission sheet waits for the learner, so it gets longer. */
export const NATIVE_CALL_MS = 3_000;
export const PERMISSION_PROMPT_MS = 45_000;
/** Each Notification check probe; all probes run at the same time. */
export const DIAG_CALL_MS = 2_500;

/** The app was built without the phone's notification module (native plugin not linked/synced). */
export class ReminderBridgeMissing extends Error {
  constructor() { super("LocalNotifications native plugin is not available in this build"); this.name = "ReminderBridgeMissing"; }
}

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
    // iPhone hides notifications from the open app unless asked; show the banner even while Qaf is open.
    foreground: true,
  };
}

export const TEST_REMINDER_ID = 1002;
export const TEST_REMINDER_DELAY_MS = 5000;

/**
 * One-off notification a few seconds from now so learners can confirm reminders reach them.
 * Android delivers inexact alarms up to an hour late (Android 12+), so there the app waits the
 * 5 seconds itself and posts the notification immediately (no schedule).
 */
export function testReminderNotification(now: number, language: Language, platform: "ios" | "android" = "ios") {
  const base: { id: number; title: string; body: string; isExactNotification: boolean; foreground: boolean; schedule?: { at: Date; allowWhileIdle: boolean } } = {
    id: TEST_REMINDER_ID,
    title: translate(language, "Time for Arabic"),
    body: translate(language, "This is a test reminder. Your daily reminders are working."),
    isExactNotification: false,
    foreground: true,
  };
  if (platform === "android") return base;
  return { ...base, schedule: { at: new Date(now + TEST_REMINDER_DELAY_MS), allowWhileIdle: true } };
}

/**
 * The phone's notification module, or null on the website. Throws ReminderBridgeMissing when running in the
 * phone app without the native plugin (otherwise Capacitor silently falls back to the browser version).
 */
async function native() {
  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform()) return null;
  if (!Capacitor.isPluginAvailable("LocalNotifications")) throw new ReminderBridgeMissing();
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  return LocalNotifications;
}

export type ReminderResult = "on" | "denied" | "web-limited" | "unavailable" | "timeout" | "error";

function failure(e: unknown): "unavailable" | "timeout" | "error" {
  if (e instanceof ReminderBridgeMissing) return "unavailable";
  if (e instanceof Error && e.name === "TimeoutError") return "timeout";
  return "error";
}

async function schedule(time: string) {
  const LN = await native();
  if (!LN) return false;
  await withTimeout(LN.cancel({ notifications: [{ id: REMINDER_ID }] }), NATIVE_CALL_MS, "cancel").catch(() => {});
  await withTimeout(LN.schedule({ notifications: [reminderNotification(time, readLanguage())] }), NATIVE_CALL_MS, "schedule");
  recordReminderEvent("scheduled", "daily", time);
  return true;
}

function saveTime(time: string) {
  try { localStorage.setItem(TIME_KEY, time); } catch { /* ignore */ }
}

/** Call only from a user tap (the Daily reminder switch); it asks the phone for permission directly. */
export async function enableReminders(time = reminderTime()): Promise<ReminderResult> {
  if (!parseReminderTime(time)) time = reminderTime();
  saveTime(time);
  try {
    const LN = await native();
    if (LN) {
      const current = await withTimeout(LN.checkPermissions(), NATIVE_CALL_MS, "checkPermissions");
      const p = current.display === "granted" ? current : await withTimeout(LN.requestPermissions(), PERMISSION_PROMPT_MS, "requestPermissions");
      if (p.display !== "granted") { recordReminderEvent("denied", "enable", p.display); return "denied"; }
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
    recordReminderEvent("error", "enable", e);
    return failure(e);
  }
}

export type TestReminderResult = "sent" | "denied" | "web-limited" | "unavailable" | "timeout" | "error";

/** Sends one test notification 5 seconds from now. Never changes the daily schedule. */
export async function sendTestReminder(): Promise<TestReminderResult> {
  try {
    const LN = await native();
    if (LN) {
      const p = await withTimeout(LN.checkPermissions(), NATIVE_CALL_MS, "checkPermissions");
      if (p.display !== "granted") { recordReminderEvent("denied", "test", p.display); return "denied"; }
      await withTimeout(LN.cancel({ notifications: [{ id: TEST_REMINDER_ID }] }), NATIVE_CALL_MS, "cancel").catch(() => {});
      const { Capacitor } = await import("@capacitor/core");
      if (Capacitor.getPlatform() === "android") {
        setTimeout(() => {
          LN.schedule({ notifications: [testReminderNotification(Date.now(), readLanguage(), "android")] })
            .then(() => recordReminderEvent("scheduled", "test", "posted"))
            .catch((e) => recordReminderEvent("error", "test post", e));
        }, TEST_REMINDER_DELAY_MS);
      } else {
        await withTimeout(LN.schedule({ notifications: [testReminderNotification(Date.now(), readLanguage())] }), NATIVE_CALL_MS, "schedule");
        recordReminderEvent("scheduled", "test", "in 5 seconds");
      }
      return "sent";
    }
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      const n = testReminderNotification(Date.now(), readLanguage());
      setTimeout(() => { try { new Notification(n.title, { body: n.body, icon: "/icon-192.png" }); } catch { /* ignore */ } }, TEST_REMINDER_DELAY_MS);
      return "sent";
    }
    return "web-limited";
  } catch (e) {
    recordReminderEvent("error", "test", e);
    return failure(e);
  }
}

export async function disableReminders() {
  update((s) => ({ ...s, reminders: false }));
  try {
    const LN = await native();
    if (LN) await withTimeout(LN.cancel({ notifications: [{ id: REMINDER_ID }] }), NATIVE_CALL_MS, "cancel");
  } catch (e) { recordReminderEvent("error", "cancel", e); }
}

/** Returns false when the time is invalid or the phone refused to reschedule. */
export async function setReminderTime(time: string): Promise<boolean> {
  if (!parseReminderTime(time)) return false;
  saveTime(time);
  if (!readProgress().reminders) return true;
  try { await schedule(time); return true; } catch (e) { recordReminderEvent("error", "reschedule", e); return false; }
}

/**
 * On app start (no prompts): if reminders are on, keep the switch honest with the phone's permission
 * and refresh the schedule so it follows the saved time and app language.
 */
export async function syncReminders() {
  void listenForDeliveries();
  if (!readProgress().reminders) return;
  try {
    const LN = await native();
    if (!LN) return;
    const p = await withTimeout(LN.checkPermissions(), NATIVE_CALL_MS, "checkPermissions");
    if (p.display !== "granted") { recordReminderEvent("denied", "app start", p.display); update((s) => ({ ...s, reminders: false })); return; }
    await schedule(reminderTime());
  } catch (e) { recordReminderEvent("error", "app start", e); }
}

let listening = false;
/** Notes each reminder the phone shows while Qaf is running, so the check panel can confirm delivery. */
async function listenForDeliveries() {
  if (listening) return;
  listening = true;
  try {
    const LN = await native();
    if (!LN) return;
    await LN.addListener("localNotificationReceived", (n) => {
      recordReminderEvent("delivered", n.id === TEST_REMINDER_ID ? "test" : n.id === REMINDER_ID ? "daily" : String(n.id), n.title ?? "");
    });
  } catch (e) { listening = false; recordReminderEvent("error", "listen", e); }
}

export type ReminderDiagnostics = {
  platform: "ios" | "android" | "web";
  /** "ok" = native notification module linked; "missing" = phone app built without it. */
  bridge: "ok" | "missing" | "n/a";
  permission: string;
  exactAlarms: string | null;
  switchOn: boolean;
  savedTime: string;
  scheduled: ScheduledSummary[];
  onScreen: number | null;
  log: ReminderEvent[];
  /** Probes that failed or timed out this time, e.g. "permission: checkPermissions timed out". */
  failures: string[];
  problems: string[];
};

/**
 * Read-only snapshot for the Notification check panel; never asks for permission or changes a schedule.
 * Never rejects and never takes much longer than DIAG_CALL_MS: every probe runs in parallel with its own limit.
 */
export async function collectReminderDiagnostics(): Promise<ReminderDiagnostics> {
  const out: ReminderDiagnostics = {
    platform: "web", bridge: "n/a", permission: "unknown", exactAlarms: null, switchOn: false, savedTime: DEFAULT_REMINDER_TIME,
    scheduled: [], onScreen: null, log: [], failures: [], problems: [],
  };
  try { out.switchOn = readProgress().reminders; out.savedTime = reminderTime(); } catch { /* defaults */ }
  try {
    const { Capacitor } = await withTimeout(import("@capacitor/core"), DIAG_CALL_MS, "load");
    out.platform = (Capacitor.isNativePlatform() ? Capacitor.getPlatform() : "web") as ReminderDiagnostics["platform"];
    if (out.platform !== "web") {
      out.bridge = Capacitor.isPluginAvailable("LocalNotifications") ? "ok" : "missing";
      if (out.bridge === "ok") {
        const { LocalNotifications: LN } = await withTimeout(import("@capacitor/local-notifications"), DIAG_CALL_MS, "load plugin");
        const probes = [
          ["permission", () => LN.checkPermissions().then((r) => { out.permission = r.display; })],
          ["scheduled", () => LN.getPending().then((r) => { out.scheduled = summarizePending(r.notifications); })],
          ["on screen", () => LN.getDeliveredNotifications().then((r) => { out.onScreen = r.notifications.length; })],
          ...(out.platform === "android" ? [["exact timing", () => LN.checkExactNotificationSetting().then((r) => { out.exactAlarms = r.exact_alarm; })]] as const : []),
        ] as const;
        const results = await Promise.allSettled(probes.map(([name, run]) => withTimeout(run(), DIAG_CALL_MS, name)));
        results.forEach((r, i) => { if (r.status === "rejected") out.failures.push(`${probes[i]![0]}: ${errorMessage(r.reason)}`); });
      }
    } else if (typeof Notification !== "undefined") out.permission = Notification.permission === "default" ? "prompt" : Notification.permission;
  } catch (e) {
    out.failures.push(`check: ${errorMessage(e)}`);
  }
  if (out.failures.length) recordReminderEvent("error", "notification check", out.failures.join("; "));
  out.log = readReminderLog();
  out.problems = reminderProblems(out);
  return out;
}

/** Plain-language findings shown at the top of the panel. Empty means everything looks right. */
export function reminderProblems(d: Pick<ReminderDiagnostics, "platform" | "permission" | "switchOn" | "scheduled"> & Partial<Pick<ReminderDiagnostics, "bridge" | "failures">>): string[] {
  const p: string[] = [];
  if (d.platform === "web") return d.switchOn ? ["Daily notifications are sent by the Qaf phone app."] : [];
  if (d.bridge === "missing") return ["This version of the app can't send notifications. Please update Qaf."];
  if (d.failures?.length) p.push("Your phone didn't answer every check. Tap Refresh to try again.");
  if (d.permission === "denied") p.push("Notifications are blocked. You can allow them in your phone's settings.");
  if (d.switchOn && d.permission === "granted" && !d.failures?.some((f) => f.startsWith("scheduled")) && !d.scheduled.some((s) => s.id === REMINDER_ID)) p.push("The daily reminder is on but not scheduled on this phone. Turn the switch off and on again.");
  if (!d.switchOn && d.scheduled.some((s) => s.id === REMINDER_ID)) p.push("A daily reminder is still scheduled although the switch is off.");
  return p;
}
