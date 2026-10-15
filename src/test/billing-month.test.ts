import { describe, expect, it } from "vitest";
import { billingMonth } from "@/lib/store-verify.server";

describe("billingMonth", () => {
  it("uses the purchase date for a monthly plan", () => {
    const m = billingMonth(new Date("2026-10-01T00:00:00Z"), new Date("2026-11-01T00:00:00Z"), new Date("2026-10-15T00:00:00Z"));
    expect(m.start.toISOString()).toBe("2026-10-01T00:00:00.000Z");
    expect(m.end.toISOString()).toBe("2026-11-01T00:00:00.000Z");
  });
  it("splits a yearly plan into monthly 100-check windows", () => {
    const m = billingMonth(new Date("2026-01-10T00:00:00Z"), new Date("2027-01-10T00:00:00Z"), new Date("2026-04-20T00:00:00Z"));
    expect(m.start.toISOString()).toBe("2026-04-10T00:00:00.000Z");
    expect(m.end.toISOString()).toBe("2026-05-10T00:00:00.000Z");
  });
});
