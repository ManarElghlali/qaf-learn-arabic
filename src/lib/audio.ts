// Single-channel playback: any new sound stops the previous one.
// Words and sound units play pre-recorded teacher audio (keyed by the exact vocalised text);
// the device voice is only a fallback for text without a recording.
const files = import.meta.glob("../assets/audio/*.mp3", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const stored = import.meta.glob("../assets/audio/*.mp3.asset.json", { eager: true, import: "default" }) as Record<string, { url: string }>;
const key = (s: string) => Array.from(s).map((c) => (c.codePointAt(0) ?? 0).toString(16).padStart(4, "0")).join("-");
// Native builds set VITE_API_BASE to the published origin; pointer URLs are relative
// ("/__l5e/...") and would otherwise resolve against the app's local origin and fail.
const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";
const absolute = (u: string) => (u.startsWith("/") && API_BASE ? API_BASE + u : u);
// Prefer the bundled recording (works offline); fall back to the CDN pointer.
const url = (kind: "w" | "u", text: string) => {
  const base = `../assets/audio/${kind}-${key(text)}.mp3`;
  return files[base] ?? (stored[`${base}.asset.json`] ? absolute(stored[`${base}.asset.json`]!.url) : undefined);
};
export const hasRecording = (kind: "w" | "u", text: string) => !!url(kind, text);

let current: HTMLAudioElement | null = null;
let pending: ReturnType<typeof setTimeout> | null = null;
let voice: SpeechSynthesisVoice | null = null;

function pickVoice() {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const vs = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("ar"));
  voice = vs.find((v) => /female|zeina|hoda|salma|laila|mariam|amina|zariyah|google/i.test(v.name)) ?? vs[0] ?? null;
  return voice;
}
if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.onvoiceschanged = pickVoice;

export function stopAudio() {
  if (typeof window === "undefined") return;
  if (pending) { clearTimeout(pending); pending = null; }
  if (current) { current.pause(); current.currentTime = 0; current = null; }
  window.speechSynthesis?.cancel();
}

/** Individual sounds play slightly slower for clarity; complete words always play at normal speed. */
export const UNIT_RATE = 0.9;
export const WORD_RATE = 1;

// Reuse one preloaded element per recording so repeat taps start instantly.
const cache = new Map<string, HTMLAudioElement>();
function makeAudio(src: string, kind: "w" | "u") {
  let a = cache.get(src);
  if (!a) { a = new Audio(src); a.preload = "auto"; cache.set(src, a); }
  a.onended = null; a.onerror = null;
  a.currentTime = 0;
  a.playbackRate = kind === "u" ? UNIT_RATE : WORD_RATE;
  a.preservesPitch = true;
  return a;
}

function failed(a: HTMLAudioElement) {
  if (current === a) current = null;
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    void import("sonner").then(({ toast }) => toast("This sound isn't saved for offline use yet", { id: "qaf-audio-offline", description: "Connect to the internet once to hear it." }));
  }
}

function play(kind: "w" | "u", text: string, rate: number) {
  if (typeof window === "undefined") return;
  stopAudio();
  const src = url(kind, text);
  if (src) {
    const a = makeAudio(src, kind);
    current = a;
    a.onerror = () => failed(a);
    a.play().catch(() => failed(a));
    return;
  }
  if (!window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ar-SA"; u.voice = voice ?? pickVoice(); u.rate = rate;
  pending = setTimeout(() => { pending = null; window.speechSynthesis.speak(u); }, 40);
}

/** Plays only the sound unit (e.g. كَ → "ka"). */
export const playUnit = (unit: string) => play("u", unit, UNIT_RATE);
/** Plays the whole vocalised word as one continuous word. */
export const playWord = (word: string) => play("w", word, WORD_RATE);

/** Plays several sound units one after another (e.g. بَ then بِ) without overlap. */
export function playUnits(units: string[]) {
  if (typeof window === "undefined" || !units.length) return;
  stopAudio();
  let i = 0;
  const next = () => {
    if (i >= units.length) return;
    const u = units[i++]!;
    const src = url("u", u);
    if (!src) { play("u", u, UNIT_RATE); pending = setTimeout(next, 900); return; }
    const a = makeAudio(src, "u"); current = a;
    a.onended = () => { if (current === a) pending = setTimeout(next, 250); };
    a.onerror = () => failed(a);
    a.play().catch(() => failed(a));
  };
  next();
}

/** Every teacher recording URL, used to store them for offline use. */
export const allRecordingUrls = () => [...new Set([...Object.values(stored).map((s) => absolute(s.url)), ...Object.values(files)])];

/** Starts downloading recordings ahead of time so the first tap plays without delay. */
export function preloadAudio(kind: "w" | "u", texts: string[]) {
  if (typeof window === "undefined") return;
  for (const t of texts) { const src = url(kind, t); if (src && !cache.has(src)) { const a = new Audio(src); a.preload = "auto"; a.load(); cache.set(src, a); } }
}
