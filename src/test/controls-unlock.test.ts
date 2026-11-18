import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const never = () => new Promise<never>(() => {});
const LN = {
  checkPermissions: vi.fn(),
  requestPermissions: vi.fn(),
  schedule: vi.fn(),
  cancel: vi.fn(async () => {}),
};
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => true, getPlatform: () => "ios" } }));
vi.mock("@capacitor/local-notifications", () => ({ LocalNotifications: LN }));

import { withTimeout, TimeoutError } from "@/lib/timeout";
import { enableReminders, sendTestReminder, NATIVE_CALL_MS, PERMISSION_PROMPT_MS, reminderNotification, testReminderNotification } from "@/lib/reminders";

beforeEach(() => { vi.useFakeTimers(); Object.values(LN).forEach((f) => f.mockReset()); LN.cancel.mockImplementation(async () => {}); });
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
    expect(await r).toBe("error");
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
    expect(await r).toBe("error");
  });
});

describe("iPhone reminders", () => {
  it("show while Qaf is open", () => {
    expect(reminderNotification("19:00", "en").foreground).toBe(true);
    expect(testReminderNotification(0, "en").foreground).toBe(true);
  });
});
