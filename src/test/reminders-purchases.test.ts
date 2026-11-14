import { describe, expect, it } from "vitest";
import { parseReminderTime, reminderNotification, REMINDER_ID, testReminderNotification } from "@/lib/reminders";
import { purchaseFailure } from "@/lib/purchases";

const pluginError = (message: string, code?: string) => Object.assign(new Error(message), code ? { code } : {});

describe("Daily reminder schedule", () => {
  it("schedules one repeating daily reminder at the chosen time", () => {
    const n = reminderNotification("07:30", "en");
    expect(n.schedule).toMatchObject({ on: { hour: 7, minute: 30 }, repeats: true });
  });
  it("never asks Android for the exact-alarm permission", () => {
    expect(reminderNotification("19:00", "en").isExactNotification).toBe(false);
  });
  it("rejects a cleared or impossible time instead of scheduling midnight", () => {
    expect(parseReminderTime("")).toBeNull();
    expect(parseReminderTime("24:00")).toBeNull();
    expect(parseReminderTime("12:60")).toBeNull();
    expect(reminderNotification("", "en").schedule.on).toEqual({ hour: 19, minute: 0 });
  });
  it("sends the test reminder once, 5 seconds later, without replacing the daily one", () => {
    const n = testReminderNotification(1_000_000, "en");
    expect(n.schedule.at.getTime()).toBe(1_005_000);
    expect(n.schedule).not.toHaveProperty("repeats");
    expect(n.id).not.toBe(REMINDER_ID);
  });
  it("writes the notification in the app language", () => {
    expect(reminderNotification("19:00", "ar").title).toBe("حان وقت العربية");
  });
});

describe("Store purchase failures", () => {
  it("treats a closed Google Play sheet as a cancellation", () => {
    expect(purchaseFailure(pluginError("Purchase is not purchased", "USER_CANCELED"))).toBe("cancelled");
  });
  it("treats a closed Apple sheet as a cancellation", () => {
    expect(purchaseFailure(pluginError("User cancelled"))).toBe("cancelled");
  });
  it("routes an already-owned Google subscription to restore", () => {
    expect(purchaseFailure(pluginError("Purchase is not purchased", "ITEM_ALREADY_OWNED"))).toBe("owned");
  });
  it("recognises pending payments and store outages", () => {
    expect(purchaseFailure(pluginError("Purchase is pending"))).toBe("pending");
    expect(purchaseFailure(pluginError("Transaction pending"))).toBe("pending");
    expect(purchaseFailure(pluginError("Purchase is not purchased", "NETWORK_ERROR"))).toBe("unavailable");
  });
  it("keeps real failures visible", () => {
    expect(purchaseFailure(pluginError("Purchase is not purchased", "DEVELOPER_ERROR"))).toBe("other");
    expect(purchaseFailure(pluginError("Invalid purchase: refund_cancelled"))).toBe("other");
  });
});
