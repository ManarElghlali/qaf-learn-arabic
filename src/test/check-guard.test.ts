import { afterEach, describe, expect, it, vi } from "vitest";
import { LIMIT_MSG, LIMIT_STATUS, creditsFor, gatewayFailureOutcome, shouldRetryGateway, usageOf } from "@/lib/check-guard";
import { adminAuthorized } from "@/lib/admin-auth.server";

describe("paid AI call settlement", () => {
  it("treats pre-execution refusals as unbilled failures", () => {
    for (const s of [400, 401, 402, 403, 429]) expect(gatewayFailureOutcome(s)).toBe("failed");
  });
  it("treats 5xx, timeouts and network errors as possibly billed", () => {
    for (const s of [500, 502, 503, 504, 408]) expect(gatewayFailureOutcome(s)).toBe("unknown");
    expect(gatewayFailureOutcome(null)).toBe("unknown");
  });
  it("replays only a first 429, never a 5xx or a second attempt", () => {
    expect(shouldRetryGateway(429, 0)).toBe(true);
    expect(shouldRetryGateway(429, 1)).toBe(false);
    expect(shouldRetryGateway(500, 0)).toBe(false);
    expect(shouldRetryGateway(503, 0)).toBe(false);
  });
});

describe("cost model", () => {
  it("prices a typical check at the catalog's audio-input and output rates", () => {
    // Observed request: 1684 prompt tokens, 116 output tokens.
    const c = creditsFor({ input: 1684, output: 116 }, { input: 0.000002, output: 0.000006 });
    expect(c).toBeCloseTo(0.004064, 6);
  });
  it("reads usage from the gateway response, or reports it missing", () => {
    expect(usageOf({ usage: { prompt_tokens: 10, completion_tokens: 3 } })).toEqual({ input: 10, output: 3 });
    expect(usageOf({})).toBeNull();
    expect(usageOf(null)).toBeNull();
  });
});

describe("refusal messages", () => {
  it("blocks budget, kill switch and concurrency with the right status", () => {
    expect(LIMIT_STATUS["budget"]).toBe(503);
    expect(LIMIT_STATUS["paused"]).toBe(503);
    expect(LIMIT_STATUS["busy"]).toBe(409);
    expect(LIMIT_STATUS["in_progress"]).toBe(409);
    expect(LIMIT_STATUS["quota"]).toBe(429);
    expect(LIMIT_STATUS["network"]).toBe(429);
  });
  it("keeps the approved 100 Premium checks in the monthly message", () => {
    expect(LIMIT_MSG["premium_monthly"]).toContain("100");
  });
});

describe("admin access", () => {
  afterEach(() => { vi.unstubAllEnvs(); });
  const req = (auth?: string) => new Request("https://x/api/public/admin-monitor", { headers: auth ? { authorization: auth } : {} });
  it("refuses everyone when no admin token is configured", async () => {
    vi.stubEnv("QAF_ADMIN_TOKEN", "");
    expect(await adminAuthorized(req("Bearer anything-at-all-here-123456"))).toBe(false);
  });
  it("refuses a short configured token", async () => {
    vi.stubEnv("QAF_ADMIN_TOKEN", "short");
    expect(await adminAuthorized(req("Bearer short"))).toBe(false);
  });
  it("accepts only the exact token", async () => {
    const t = "a".repeat(20) + "correct-token";
    vi.stubEnv("QAF_ADMIN_TOKEN", t);
    expect(await adminAuthorized(req())).toBe(false);
    expect(await adminAuthorized(req("Bearer " + t + "x"))).toBe(false);
    expect(await adminAuthorized(req("Bearer " + t))).toBe(true);
  });
});

describe("shared-network limit message", () => {
  it("explains the shared Wi-Fi limit in English with mobile data, tomorrow and optional Premium", async () => {
    const { NETWORK_LIMIT_MSG } = await import("@/lib/check-guard");
    const { translate } = await import("@/lib/i18n");
    const en = translate("en", NETWORK_LIMIT_MSG);
    expect(en).toBe(LIMIT_MSG["network"]);
    for (const part of ["Wi-Fi", "mobile data", "tomorrow", "Premium is also an option"]) expect(en).toContain(part);
  });
  it("shows the same guidance in Arabic", async () => {
    const { NETWORK_LIMIT_MSG } = await import("@/lib/check-guard");
    const { translate } = await import("@/lib/i18n");
    const ar = translate("ar", NETWORK_LIMIT_MSG);
    expect(ar).not.toBe(NETWORK_LIMIT_MSG);
    for (const part of ["الواي فاي", "بيانات الهاتف", "غدًا", "بريميوم"]) expect(ar).toContain(part);
  });
});
