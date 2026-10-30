import { describe, expect, it } from "vitest";
import { hasAudibleSignal } from "@/lib/recording-signal";
import { readingResult } from "@/lib/reading-result";

const rate = 16000;
const tone = (seconds: number, amplitude: number) => Float32Array.from({ length: rate * seconds }, (_, i) => amplitude * Math.sin(2 * Math.PI * 220 * i / rate));

describe("silent reading protection", () => {
  it("rejects six seconds of silence", () => {
    expect(hasAudibleSignal([new Float32Array(rate * 6)], rate)).toBe(false);
  });
  it("rejects quiet background and a brief release click", () => {
    expect(hasAudibleSignal([tone(2, 0.002)], rate)).toBe(false);
    const click = new Float32Array(rate);
    click.set(tone(0.02, 0.3));
    expect(hasAudibleSignal([click], rate)).toBe(false);
  });
  it("rejects DC offset rather than treating it as speech", () => {
    expect(hasAudibleSignal([new Float32Array(rate).fill(0.1)], rate)).toBe(false);
  });
  it("accepts audible sound surrounded by silence, including a second channel", () => {
    const speech = new Float32Array(rate * 2);
    speech.set(tone(0.3, 0.04), rate);
    expect(hasAudibleSignal([new Float32Array(speech.length), speech], rate)).toBe(true);
  });
  it("never accepts a blank transcript even when every tile is marked correct", () => {
    expect(readingResult(["أَ", "كَ", "لَ"], { heard: "", syllables: [{ heard: "أَ", correct: true }, { heard: "كَ", correct: true }, { heard: "لَ", correct: true }] }).correct).toBe(false);
  });
  it("requires actual heard speech for each tile", () => {
    expect(readingResult(["أَ"], { heard: "أَ", syllables: [{ heard: "", correct: true }] }).correct).toBe(false);
    expect(readingResult(["أَ"], { heard: "أَ", syllables: [{ heard: "أَ", correct: true }] }).correct).toBe(true);
  });
});