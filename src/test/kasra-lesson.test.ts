import { describe, expect, it } from "vitest";
import { KASRA_WORDS } from "@/lib/lessons";
import { WORDS, stripTashkeel } from "@/lib/words";
import { learningSummary } from "@/lib/learning-path";
import { WORD_ILLUSTRATIONS } from "@/lib/illustrations";

describe("Fatha & Kasra lesson", () => {
  it("contains the 14 approved words with exact tashkeel", () => {
    expect(KASRA_WORDS.map(w => w.ar)).toEqual("عَلِمَ فَهِمَ حَفِظَ عَمِلَ غَضِبَ مَرِضَ خَسِرَ لَبِسَ رَبِحَ شَهِدَ نَسِيَ حَمِدَ عَطِشَ سَلِمَ".split(" "));
  });
  it("shares no root letters with any Fatha word", () => {
    const fatha = new Set(WORDS.map(w => stripTashkeel(w.ar)));
    expect(KASRA_WORDS.filter(w => fatha.has(stripTashkeel(w.ar)))).toEqual([]);
  });
  it("follows Fatha → Kasra → Fatha in three units that join into the word", () => {
    for (const w of KASRA_WORDS) {
      expect(w.units.map(u => u.slice(-1))).toEqual(["\u064E", "\u0650", "\u064E"]);
      expect(w.units.join("")).toBe(w.ar);
    }
  });
  it("has its own picture for every word and IDs that never clash with Fatha", () => {
    const ids = new Set(WORDS.map(w => w.id));
    for (const w of KASRA_WORDS) { expect(ids.has(w.id)).toBe(false); expect(WORD_ILLUSTRATIONS[w.id]).toBeTruthy(); }
  });
  it("counts progress out of 14 independently of Fatha", () => {
    expect(learningSummary([101, 102], KASRA_WORDS)).toMatchObject({ completed: 2, resumeIndex: 2 });
    expect(learningSummary([1, 2, 3], KASRA_WORDS).completed).toBe(0);
  });
});

import { unitState, recordUnitResult, UNIT_LOCKING } from "@/lib/lessons";
import { readProgress, type Progress } from "@/lib/progress";
describe("Unit flow", () => {
  const base = (): Progress => ({ ...readProgress(), learned: [], learnedKasra: [], units: {} });
  it("locks Fatha & Kasra until Fatha lessons, quiz and test are all passed", () => {
    let p: Progress = { ...base(), learned: WORDS.map(w => w.id) };
    expect(unitState(p, "fatha").step).toBe("quiz");
    expect(unitState(p, "kasra").unlocked).toBe(!UNIT_LOCKING);
    p = recordUnitResult(p, "fatha", "quiz", 60);
    expect(unitState(p, "fatha").quizPassed).toBe(false);
    p = recordUnitResult(p, "fatha", "quiz", 80);
    p = recordUnitResult(p, "fatha", "test", 70);
    expect(unitState(p, "fatha").complete).toBe(true);
    expect(unitState(p, "kasra")).toMatchObject({ unlocked: true, step: "learn", learned: 0 });
  });
  it("keeps each unit's results separate and never loses a pass", () => {
    let p = recordUnitResult(base(), "kasra", "quiz", 90);
    p = recordUnitResult(p, "kasra", "quiz", 20);
    expect(p.units["kasra"]).toEqual({ quizBest: 90, quizPassed: true });
    expect(p.units["fatha"]).toBeUndefined();
  });
});

import { hasRecording } from "@/lib/audio";
describe("Teacher recordings", () => {
  it("exist for every word and every sound unit in both units", () => {
    for (const w of [...WORDS, ...KASRA_WORDS]) {
      expect(hasRecording("w", w.ar), w.ar).toBe(true);
      for (const u of w.units) expect(hasRecording("u", u), u).toBe(true);
    }
  });
});
