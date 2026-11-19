// Pure, browser-safe rules for the paid pronunciation checker (server enforces them via
// begin_check / finish_check in the database; these helpers only classify and phrase outcomes).

/** Reasons begin_check can refuse a check, mapped to learner-facing messages and HTTP statuses. */
export const LIMIT_MSG: Record<string, string> = {
  quota: "You've used your free pronunciation checks. Lessons and quizzes stay open.",
  daily: "You've reached today's pronunciation-check limit. Please try again tomorrow.",
  network: "Too many free checks from this network today. Please try again tomorrow or go Premium.",
  premium_monthly: "You've used this month's 100 Premium pronunciation checks. They refresh with your next billing month.",
  global: "The reading checker is resting for today. Please try again tomorrow.",
  budget: "The reading checker is resting for now. Lessons and quizzes stay open.",
  paused: "The reading checker is paused. Lessons and quizzes stay open.",
  busy: "Your last recording is still being checked. Wait a moment, then try again.",
  in_progress: "This recording is still being checked. Wait a moment, then try again.",
  duplicate: "This recording was already checked. Please record the word again.",
  too_many_attempts: "This recording couldn't be checked. Please record the word again.",
  conflict: "Please record the word again.",
};

export const LIMIT_STATUS: Record<string, number> = {
  quota: 429, daily: 429, network: 429, premium_monthly: 429, global: 503, budget: 503, paused: 503,
  busy: 409, in_progress: 409, duplicate: 409, too_many_attempts: 409, conflict: 409,
};

/**
 * How a failed AI Gateway call is settled.
 * - "failed": refused before generation (bad request, auth, rate-limit, credits) — not billed.
 * - "unknown": generation may have run (5xx, timeout, network, unreadable output) — budget is charged
 *   with the reserved estimate, but the learner's quota is always given back.
 */
export type GatewayOutcome = "failed" | "unknown";
export function gatewayFailureOutcome(status: number | null): GatewayOutcome {
  if (status === null) return "unknown";
  return status >= 400 && status < 500 && status !== 408 ? "failed" : "unknown";
}

/** Only a pre-execution rate limit is safe to replay; an ambiguous 5xx may already be billed. */
export function shouldRetryGateway(status: number, attempt: number): boolean {
  return status === 429 && attempt === 0;
}

/** Token usage from an OpenAI-compatible response, or null when the gateway did not report it. */
export function usageOf(body: unknown): { input: number; output: number } | null {
  const u = (body as { usage?: { prompt_tokens?: unknown; completion_tokens?: unknown } } | null)?.usage;
  if (!u || typeof u.prompt_tokens !== "number" || typeof u.completion_tokens !== "number") return null;
  return { input: Math.max(0, Math.round(u.prompt_tokens)), output: Math.max(0, Math.round(u.completion_tokens)) };
}

/** Credits for one call at the configured per-token rates (mirrors finish_check_tokens). */
export function creditsFor(usage: { input: number; output: number }, rates: { input: number; output: number }): number {
  return usage.input * rates.input + usage.output * rates.output;
}
