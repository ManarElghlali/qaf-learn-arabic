// Single-channel playback queue: any new sound cancels the previous one.
let voice: SpeechSynthesisVoice | null = null;

function pickVoice() {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const vs = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("ar"));
  const female = vs.find((v) => /female|zeina|hoda|salma|laila|mariam|amina|zariyah|google/i.test(v.name));
  voice = female ?? vs[0] ?? null;
  return voice;
}
if (typeof window !== "undefined" && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = pickVoice;
}

export function stopAudio() {
  if (typeof window !== "undefined") window.speechSynthesis?.cancel();
}

function speak(text: string, rate: number) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  stopAudio();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ar-SA";
  u.voice = voice ?? pickVoice();
  u.rate = rate;
  u.pitch = 1.1;
  // small delay so cancel() fully flushes on Safari/Chrome
  setTimeout(() => window.speechSynthesis.speak(u), 40);
}

/** Plays only the syllable (e.g. كَ → "ka"), short, no elongation. */
export const playUnit = (unit: string) => speak(unit, 0.75);
/** Plays the whole vocalised word as one continuous word. */
export const playWord = (word: string) => speak(word, 0.8);
