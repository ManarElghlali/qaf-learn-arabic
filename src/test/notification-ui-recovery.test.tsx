import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const never = () => new Promise<never>(() => {});
const mocks = vi.hoisted(() => ({ collect: vi.fn(), enable: vi.fn(), disable: vi.fn(async () => {}) }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));
vi.mock("@/lib/reminders", async (orig) => ({
  ...(await orig<typeof import("@/lib/reminders")>()),
  collectReminderDiagnostics: mocks.collect,
  enableReminders: mocks.enable,
  disableReminders: mocks.disable,
}));

import { toast } from "sonner";
import { CHECK_LIMIT_MS, NotificationCheck } from "@/components/NotificationCheck";
import { ReminderToggle } from "@/components/ReminderToggle";

const ok = { platform: "ios", bridge: "ok", permission: "granted", exactAlarms: null, switchOn: false, savedTime: "19:00", scheduled: [], onScreen: 0, log: [], failures: [], problems: [] };

beforeEach(() => { Object.values(mocks).forEach((m) => m.mockReset()); vi.mocked(toast.error).mockReset(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("Notification check panel recovers", () => {
  it("replaces the spinner with an error when the phone never answers", async () => {
    vi.useFakeTimers();
    mocks.collect.mockImplementation(never);
    render(<NotificationCheck />);
    fireEvent.click(screen.getByRole("button", { name: "Notification check" }));
    expect(screen.getByText("Checking…")).toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(CHECK_LIMIT_MS); });
    expect(screen.queryByText("Checking…")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("couldn't finish");
    expect(screen.getByRole("alert")).toHaveTextContent("timed out");
  });
  it("shows a bridge error and lets Refresh try again", async () => {
    mocks.collect.mockRejectedValueOnce(new Error("bridge exploded")).mockResolvedValueOnce(ok);
    render(<NotificationCheck />);
    fireEvent.click(screen.getByRole("button", { name: "Notification check" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("bridge exploded");
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(await screen.findByText("Everything looks right.")).toBeInTheDocument();
    expect(screen.getByText("Connected")).toBeInTheDocument();
  });
});

describe("Daily reminder switch recovers", () => {
  it("shows it is waiting for the phone, then explains a timeout and unlocks", async () => {
    let answer: (r: string) => void = () => {};
    mocks.enable.mockImplementation(() => new Promise((res) => { answer = res; }));
    render(<ReminderToggle on={false} time="19:00" onTimeSaved={() => {}} />);
    const sw = screen.getByRole("switch", { name: "Daily reminder" });
    fireEvent.click(sw);
    expect(screen.getByRole("status")).toHaveTextContent("Waiting for your phone…");
    expect(sw).toBeDisabled();
    await act(async () => { answer("timeout"); });
    expect(sw).not.toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("Your phone didn't respond");
    expect(toast.error).toHaveBeenCalled();
  });
  it("explains a missing notification module", async () => {
    mocks.enable.mockResolvedValue("unavailable");
    render(<ReminderToggle on={false} time="19:00" onTimeSaved={() => {}} />);
    fireEvent.click(screen.getByRole("switch", { name: "Daily reminder" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Please update Qaf");
  });
  it("unlocks even if turning on throws", async () => {
    mocks.enable.mockRejectedValue(new Error("bridge error"));
    render(<ReminderToggle on={false} time="19:00" onTimeSaved={() => {}} />);
    const sw = screen.getByRole("switch", { name: "Daily reminder" });
    fireEvent.click(sw);
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't set the daily reminder");
    expect(sw).not.toBeDisabled();
  });
});
