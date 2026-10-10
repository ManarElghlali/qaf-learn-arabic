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
