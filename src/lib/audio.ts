// Single-channel playback: any new sound stops the previous one.
// Words and sound units play pre-recorded teacher audio (keyed by the exact vocalised text);
// the device voice is only a fallback for text without a recording.
const files = import.meta.glob("../assets/audio/*.mp3", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const stored = import.meta.glob("../assets/audio/*.mp3.asset.json", { eager: true, import: "default" }) as Record<string, { url: string }>;
const key = (s: string) => Array.from(s).map((c) => (c.codePointAt(0) ?? 0).toString(16).padStart(4, "0")).join("-");
const url = (kind: "w" | "u", text: string) => stored[`../assets/audio/${kind}-${key(text)}.mp3.asset.json`]?.url ?? files[`../assets/audio/${kind}-${key(text)}.mp3`];
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

function play(kind: "w" | "u", text: string, rate: number) {
  if (typeof window === "undefined") return;
  stopAudio();
  const src = url(kind, text);
  if (src) {
    const a = new Audio(src);
    current = a;
    a.play().catch(() => { if (current === a) current = null; });
    return;
  }
  if (!window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ar-SA"; u.voice = voice ?? pickVoice(); u.rate = rate;
  pending = setTimeout(() => { pending = null; window.speechSynthesis.speak(u); }, 40);
}

/** Plays only the sound unit (e.g. كَ → "ka"). */
export const playUnit = (unit: string) => play("u", unit, 0.75);
/** Plays the whole vocalised word as one continuous word. */
export const playWord = (word: string) => play("w", word, 0.8);

/** Plays several sound units one after another (e.g. بَ then بِ) without overlap. */
export function playUnits(units: string[]) {
  if (typeof window === "undefined" || !units.length) return;
  stopAudio();
  let i = 0;
  const next = () => {
    if (i >= units.length) return;
    const u = units[i++]!;
    const src = url("u", u);
    if (!src) { play("u", u, 0.75); pending = setTimeout(next, 900); return; }
    const a = new Audio(src); current = a;
    a.onended = () => { if (current === a) pending = setTimeout(next, 250); };
    a.play().catch(() => { if (current === a) current = null; });
  };
  next();
}
