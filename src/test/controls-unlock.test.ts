import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const never = () => new Promise<never>(() => {});
const LN = {
  checkPermissions: vi.fn(),
  requestPermissions: vi.fn(),
  schedule: vi.fn(),
  cancel: vi.fn(async () => {}),
  getPending: vi.fn(),
  getDeliveredNotifications: vi.fn(),
  addListener: vi.fn(),
};
const bridge = { available: true };
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => true, getPlatform: () => "ios", isPluginAvailable: () => bridge.available } }));
vi.mock("@capacitor/local-notifications", () => ({ LocalNotifications: LN }));

import { withTimeout, TimeoutError } from "@/lib/timeout";
import { collectReminderDiagnostics, DIAG_CALL_MS, enableReminders, sendTestReminder, NATIVE_CALL_MS, PERMISSION_PROMPT_MS, reminderNotification, testReminderNotification } from "@/lib/reminders";

beforeEach(() => { vi.useFakeTimers(); bridge.available = true; Object.values(LN).forEach((f) => f.mockReset()); LN.cancel.mockImplementation(async () => {}); });
afterEach(() => { vi.useRealTimers(); });

describe("Controls unlock after failures", () => {
  it("gives up on a stalled call after its time limit", async () => {
    const p = withTimeout(never(), 1000, "store");
    const check = expect(p).rejects.toBeInstanceOf(TimeoutError);
    await vi.advanceTimersByTimeAsync(1000);
    await check;
  });
  it("frees the Daily reminder switch when the permission sheet never answers", async () => {
    LN.checkPermissions.mockResolvedValue({ display: "prompt" });
    LN.requestPermissions.mockImplementation(never);
    const r = enableReminders("19:00");
    await vi.advanceTimersByTimeAsync(PERMISSION_PROMPT_MS);
    expect(await r).toBe("timeout");
  });
  it("frees the switch when scheduling fails", async () => {
    LN.checkPermissions.mockResolvedValue({ display: "granted" });
    LN.schedule.mockRejectedValue(new Error("boom"));
    expect(await enableReminders("19:00")).toBe("error");
  });
  it("frees the test button when the phone never answers", async () => {
    LN.checkPermissions.mockImplementation(never);
    const r = sendTestReminder();
    await vi.advanceTimersByTimeAsync(NATIVE_CALL_MS);
    expect(await r).toBe("timeout");
  });
  it("reports a missing native notification module instead of hanging", async () => {
    bridge.available = false;
    expect(await enableReminders("19:00")).toBe("unavailable");
    expect(await sendTestReminder()).toBe("unavailable");
    expect(LN.checkPermissions).not.toHaveBeenCalled();
  });
});

describe("Notification check never hangs", () => {
  it("finishes within one probe limit even when every phone call stalls, because probes run together", async () => {
    LN.checkPermissions.mockImplementation(never);
    LN.getPending.mockImplementation(never);
    LN.getDeliveredNotifications.mockImplementation(never);
    let done = false;
    const r = collectReminderDiagnostics().then((d) => { done = true; return d; });
    await vi.advanceTimersByTimeAsync(DIAG_CALL_MS);
    expect(done).toBe(true);
    const d = await r;
    expect(d.failures).toHaveLength(3);
    expect(d.failures.join(" ")).toMatch(/timed out/);
    expect(d.problems[0]).toMatch(/didn't answer/);
  });
  it("reports the missing notification module", async () => {
    bridge.available = false;
    const d = await collectReminderDiagnostics();
    expect(d.bridge).toBe("missing");
    expect(d.problems).toEqual(["This version of the app can't send notifications. Please update Qaf."]);
  });
  it("turns a bridge error into a listed failure, not a crash", async () => {
    LN.checkPermissions.mockRejectedValue(Object.assign(new Error("not implemented"), { code: "UNIMPLEMENTED" }));
    LN.getPending.mockResolvedValue({ notifications: [] });
    LN.getDeliveredNotifications.mockResolvedValue({ notifications: [] });
    const d = await collectReminderDiagnostics();
    expect(d.failures).toEqual(["permission: UNIMPLEMENTED: not implemented"]);
  });
});

describe("iPhone reminders", () => {
  it("show while Qaf is open", () => {
    expect(reminderNotification("19:00", "en").foreground).toBe(true);
    expect(testReminderNotification(0, "en").foreground).toBe(true);
  });
});
