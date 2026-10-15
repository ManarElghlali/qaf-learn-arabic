// Single source of truth for what free learners can open, and the signed Premium pass.
// Premium is never read from an editable setting: only a pass signed by the server unlocks content.
import { useEffect, useState } from "react";
import { WORDS, type Word } from "@/lib/words";
import type { LessonId } from "@/lib/lessons";

/** The first 10 words of the approved Fatha list, in their existing order. */
export const FREE_WORDS: Word[] = WORDS.slice(0, 10);
export const FREE_WORD_IDS = new Set(FREE_WORDS.map((w) => w.id));
export const FREE_WORD_TEXTS: readonly string[] = FREE_WORDS.map((w) => w.ar);
export const FREE_LESSON: LessonId = "fatha";
export const FREE_SOUND_SET = "fatha";

export type FreeQuizMode = "listen" | "picture" | "build" | "mixed";
export const FREE_QUIZZES: { n: number; title: string; words: Word[]; mode: FreeQuizMode }[] = [
  { n: 1, title: "Listen and pick · words 1–5", words: FREE_WORDS.slice(0, 5), mode: "listen" },
  { n: 2, title: "Listen and pick · words 6–10", words: FREE_WORDS.slice(5, 10), mode: "listen" },
  { n: 3, title: "Match the picture", words: FREE_WORDS, mode: "picture" },
  { n: 4, title: "Build the word", words: FREE_WORDS, mode: "build" },
  { n: 5, title: "Mixed review", words: FREE_WORDS, mode: "mixed" },
];
export const FREE_QUIZ_LENGTH = 6;

export const canOpenUnit = (id: LessonId, premium: boolean) => premium || id === FREE_LESSON;
export const canOpenSoundSet = (setId: string, premium: boolean) => premium || setId === FREE_SOUND_SET;

// ---- Free quiz progress (own key; never touches saved lesson progress).
const QKEY = "qaf-free-quizzes-v1";
export function freeQuizzesDone(): number[] {
  try { const v = JSON.parse(localStorage.getItem(QKEY) || "[]"); return Array.isArray(v) ? v.filter((x) => typeof x === "number") : []; } catch { return []; }
}
export function markFreeQuiz(n: number) {
  const d = freeQuizzesDone(); if (d.includes(n)) return;
  localStorage.setItem(QKEY, JSON.stringify([...d, n])); emit();
}
export const freeQuizOpen = (n: number, done: number[]) => n === 1 || done.includes(n - 1);

// ---- Signed Premium pass.
const PASS_KEY = "qaf-premium-pass";
const PUBLIC_KEY_X = "9cxaJphJAgCZF33y6RJUVGNowxnekyNdnVYpfV1x44U";
export type PassPayload = { d: string; exp: number; prod?: string };

const fromB64u = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));
async function sha(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, "0")).join("");
}

/** Returns the payload when the pass is signed by Qaf's server, belongs to this device and hasn't expired. */
export async function checkPass(pass: string | null, device: string, now = Date.now()): Promise<PassPayload | null> {
  if (!pass) return null;
  try {
    const [p, s] = pass.split(".");
    if (!p || !s) return null;
    const key = await crypto.subtle.importKey("jwk", { kty: "OKP", crv: "Ed25519", x: PUBLIC_KEY_X }, { name: "Ed25519" }, false, ["verify"]);
    if (!(await crypto.subtle.verify({ name: "Ed25519" }, key, fromB64u(s), new TextEncoder().encode(p)))) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromB64u(p))) as PassPayload;
    if (payload.d !== (await sha(device)) || !(payload.exp > now)) return null;
    return payload;
  } catch { return null; }
}

type Access = { loaded: boolean; premium: boolean; billingLive: boolean; exp: number | null };
let state: Access = { loaded: false, premium: false, billingLive: false, exp: null };
const subs = new Set<(a: Access) => void>();
function emit() { subs.forEach((f) => f({ ...state })); }

async function deviceIdLazy() { const { deviceId } = await import("@/lib/api"); return deviceId(); }

export async function refreshAccess(): Promise<Access> {
  if (typeof window === "undefined") return state;
  let pass: string | null = null;
  try { pass = localStorage.getItem(PASS_KEY); } catch { /* ignore */ }
  const ok = await checkPass(pass, await deviceIdLazy());
  state = { ...state, loaded: true, premium: !!ok, exp: ok?.exp ?? null };
  if (!ok && pass) { try { localStorage.removeItem(PASS_KEY); } catch { /* ignore */ } }
  emit();
  return state;
}

/** Saves a pass from the server (or clears it) and re-checks access. */
export async function savePass(pass: string | null | undefined, billingLive?: boolean) {
  try { if (pass) localStorage.setItem(PASS_KEY, pass); else localStorage.removeItem(PASS_KEY); } catch { /* ignore */ }
  if (billingLive !== undefined) state = { ...state, billingLive };
  return refreshAccess();
}

/** Subscription testing builds (TestFlight / Play internal testing) can buy with sandbox accounts before launch. */
export const STORE_TESTING = import.meta.env["VITE_STORE_TESTING"] === "1";

export function useAccess(): Access & { canBuy: boolean } {
  const [a, setA] = useState<Access>(state);
  useEffect(() => { subs.add(setA); if (!state.loaded) void refreshAccess(); else setA({ ...state }); return () => { subs.delete(setA); }; }, []);
  return { ...a, canBuy: a.billingLive || STORE_TESTING };
}

export function useFreeQuizzes() {
  const [d, setD] = useState<number[]>([]);
  useEffect(() => { const f = () => setD(freeQuizzesDone()); f(); subs.add(f); return () => { subs.delete(f); }; }, []);
  return d;
}
