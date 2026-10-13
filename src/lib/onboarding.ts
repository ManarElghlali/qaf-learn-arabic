// First-run state lives in its own key so it can never touch learning progress.
const KEY = "qaf-onboarding-v1";
export const ONBOARDING_STEPS = 3;
export type Onboarding = { completed: boolean; step: number; completedAt?: string };

function hasExistingLearning() {
  try {
    const p = JSON.parse(localStorage.getItem("qaf-progress-v1") || "{}");
    const anyLearned = Object.entries(p).some(([k, v]) => k.startsWith("learned") && Array.isArray(v) && v.length > 0);
    const anyUnit = p.units && Object.keys(p.units).length > 0;
    const sp = JSON.parse(localStorage.getItem("qaf-sound-practice-v1") || "{}");
    const anySound = Object.values(sp).some((v) => Array.isArray(v) && v.length > 0);
    return anyLearned || anyUnit || anySound || (p.scores?.length ?? 0) > 0 || (p.streak ?? 0) > 0;
  } catch { return false; }
}

/** Browser-only. Learners who already have progress are treated as onboarded so they never see it again. */
export function readOnboarding(): Onboarding {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const o = JSON.parse(raw) as Partial<Onboarding>;
      const step = Math.min(Math.max(Number(o.step) || 0, 0), ONBOARDING_STEPS - 1);
      return { completed: !!o.completed, step, completedAt: o.completedAt };
    }
    if (hasExistingLearning()) return saveOnboarding({ completed: true, step: 0, completedAt: new Date().toISOString() });
  } catch { /* storage unavailable or corrupt: start fresh, never loop */ }
  return { completed: false, step: 0 };
}

function saveOnboarding(o: Onboarding) {
  try { localStorage.setItem(KEY, JSON.stringify(o)); } catch { /* private mode: keep going in memory */ }
  return o;
}

export const saveStep = (step: number) => { const o = readOnboarding(); if (!o.completed) saveOnboarding({ ...o, step }); };

/** Idempotent: completing twice keeps the first completion time. */
export function completeOnboarding() {
  const o = readOnboarding();
  if (o.completed) return o;
  return saveOnboarding({ completed: true, step: 0, completedAt: new Date().toISOString() });
}
