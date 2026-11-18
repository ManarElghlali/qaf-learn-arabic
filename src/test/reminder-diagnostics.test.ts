import { describe, expect, it } from "vitest";
import { appendReminderEvent, errorMessage, REMINDER_LOG_LIMIT, summarizePending, type ReminderEvent } from "@/lib/reminder-log";
import { reminderProblems, REMINDER_ID, TEST_REMINDER_ID } from "@/lib/reminders";

const ev = (n: number): ReminderEvent => ({ at: new Date(n).toISOString(), kind: "error", source: "test", message: String(n) });

describe("Notification check history", () => {
  it("keeps the newest events first and never grows past the limit", () => {
    let log: ReminderEvent[] = [];
    for (let i = 0; i < REMINDER_LOG_LIMIT + 5; i++) log = appendReminderEvent(log, ev(i));
    expect(log).toHaveLength(REMINDER_LOG_LIMIT);
    expect(log[0]!.message).toBe(String(REMINDER_LOG_LIMIT + 4));
  });
  it("keeps the phone's error code with the message", () => {
    expect(errorMessage(Object.assign(new Error("Unable to schedule"), { code: "UNAVAILABLE" }))).toBe("UNAVAILABLE: Unable to schedule");
  });
  it("reads the daily reminder time and one-off test reminders from the phone", () => {
    const rows = summarizePending([{ id: REMINDER_ID, title: "Time", schedule: { on: { hour: 7, minute: 5 }, repeats: true } }, { id: TEST_REMINDER_ID, title: "Test", schedule: { at: new Date(2026, 0, 2, 9, 30) } }]);
    expect(rows[0]).toMatchObject({ when: "07:05", daily: true });
    expect(rows[1]!.daily).toBe(false);
    expect(rows[1]!.when).toContain("09:30");
  });
});

describe("Notification check findings", () => {
  const daily = [{ id: REMINDER_ID, title: "", when: "19:00", daily: true }];
  it("reports nothing when the reminder is allowed and scheduled", () => {
    expect(reminderProblems({ platform: "ios", permission: "granted", switchOn: true, scheduled: daily })).toEqual([]);
  });
  it("flags blocked notifications", () => {
    expect(reminderProblems({ platform: "android", permission: "denied", switchOn: false, scheduled: [] })[0]).toMatch(/blocked/);
  });
  it("flags a switched-on reminder the phone lost", () => {
    expect(reminderProblems({ platform: "android", permission: "granted", switchOn: true, scheduled: [] })[0]).toMatch(/not scheduled/);
  });
  it("flags a leftover reminder after switching off", () => {
    expect(reminderProblems({ platform: "ios", permission: "granted", switchOn: false, scheduled: daily })[0]).toMatch(/still scheduled/);
  });
});
