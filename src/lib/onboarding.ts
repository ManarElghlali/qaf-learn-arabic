// First-run state lives in its own key so it can never touch learning progress.
const KEY = "qaf-onboarding-v1";

export type Path = "reading" | "sounds";
export type Goal = "read" | "sounds" | "both";
export type Level = "beginner" | "letters" | "some";
// welcome, language, listen, path, goal, level, recommendation, first quiz
export const ONBOARDING_STEPS = 8;
export type Onboarding = {
  completed: boolean; step: number; version?: number; completedAt?: string | undefined;
  path?: Path | undefined; goal?: Goal | undefined; level?: Level | undefined;
  firstQuizDone?: boolean | undefined; firstCorrectAt?: string | undefined; rating?: number | undefined;
};

const PATHS: Path[] = ["reading", "sounds"], GOALS: Goal[] = ["read", "sounds", "both"], LEVELS: Level[] = ["beginner", "letters", "some"];
const pick = <T,>(v: unknown, ok: T[]) => (ok.includes(v as T) ? (v as T) : undefined);

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

/** Browser-only. Damaged fields are dropped individually; learners with progress are treated as onboarded. */
export function readOnboarding(): Onboarding {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const o = JSON.parse(raw) as Record<string, unknown>;
      const savedStep = Math.max(Number(o["step"]) || 0, 0);
      const step = Math.min(savedStep + (o["version"] !== 2 && savedStep > 0 ? 1 : 0), ONBOARDING_STEPS - 1);
      return {
        completed: !!o["completed"], step, version: 2,
        completedAt: typeof o["completedAt"] === "string" ? o["completedAt"] : undefined,
        path: pick(o["path"], PATHS), goal: pick(o["goal"], GOALS), level: pick(o["level"], LEVELS),
        firstQuizDone: !!o["firstQuizDone"],
        firstCorrectAt: typeof o["firstCorrectAt"] === "string" ? o["firstCorrectAt"] : undefined,
        rating: typeof o["rating"] === "number" ? o["rating"] : undefined,
      };
    }
    if (hasExistingLearning()) return saveOnboarding({ completed: true, step: 0, completedAt: new Date().toISOString() });
  } catch { /* storage unavailable or corrupt: start fresh, never loop */ }
  return { completed: false, step: 0 };
}

function saveOnboarding(o: Onboarding) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...o, version: 2 })); } catch { /* private mode: keep going in memory */ }
  return o;
}

/** Merge a change into saved onboarding state (answers can be edited later from Settings). */
export const patchOnboarding = (patch: Partial<Onboarding>) => saveOnboarding({ ...readOnboarding(), ...patch });
export const saveStep = (step: number) => { const o = readOnboarding(); if (!o.completed) saveOnboarding({ ...o, step }); };
/** Recorded once: the first answer that was right on the first try. */
export const recordFirstCorrect = () => { const o = readOnboarding(); if (!o.firstCorrectAt) saveOnboarding({ ...o, firstCorrectAt: new Date().toISOString() }); };

/** Idempotent: completing twice keeps the first completion time. */
export function completeOnboarding() {
  const o = readOnboarding();
  if (o.completed) return o;
  return saveOnboarding({ ...o, completed: true, step: 0, completedAt: new Date().toISOString() });
}

export type Recommendation = { title: string; why: string; to: "/learn" | "/sounds/practice/$set"; lesson?: "fatha" | "kasra"; set?: "fatha"; alt?: Recommendation };
const READ_FATHA: Recommendation = { title: "Reading · Fatha", why: "", to: "/learn", lesson: "fatha" };
const SOUND_FATHA: Recommendation = { title: "Sound Practice · Fatha", why: "", to: "/sounds/practice/$set", set: "fatha" };

/** Maps answers onto lessons that already exist; nothing here changes curriculum or progress. */
export function recommend(o: Pick<Onboarding, "goal" | "level" | "path">): Recommendation {
  const goal = o.goal ?? (o.path === "sounds" ? "sounds" : o.path === "reading" ? "read" : "both");
  if (goal === "sounds") return { ...SOUND_FATHA, why: "You want clearer letter sounds, so start by hearing every letter with Fatha.", alt: { ...READ_FATHA, why: "" } };
  if (goal === "both") return { ...READ_FATHA, why: "Start reading your first words with Fatha, and practise the same sounds letter by letter.", alt: { ...SOUND_FATHA, why: "" } };
  if (o.level === "some") return { title: "Reading · Fatha & Kasra", why: "You can read a little, so continue with words that mix Fatha and Kasra.", to: "/learn", lesson: "kasra", alt: { ...READ_FATHA, why: "" } };
  if (o.level === "letters") return { ...READ_FATHA, why: "You know the letters, so start joining them into short Fatha words.", alt: { ...SOUND_FATHA, why: "" } };
  return { ...READ_FATHA, why: "Start at the very beginning: short words that use only Fatha.", alt: { ...SOUND_FATHA, why: "" } };
}
