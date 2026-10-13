import { describe, expect, it } from "vitest";
import { ALIF_WORDS, LESSONS } from "@/lib/lessons";
import { WORD_ILLUSTRATIONS } from "@/lib/illustrations";
import { syllablesOf } from "@/routes/api/public/check-reading";

describe("Madd Alif unit", () => {
  it("has 25 words, each long-alif sound as one unit, with pictures", () => {
    expect(ALIF_WORDS).toHaveLength(25);
    expect(LESSONS.alif.key).toBe("learnedAlif");
    for (const w of ALIF_WORDS) {
      expect(w.units.join("")).toBe(w.ar);
      expect(w.units.some((u) => u.endsWith("ا"))).toBe(true);
      expect(w.units.every((u) => u !== "ا")).toBe(true);
      expect(syllablesOf(w.ar)).toEqual(w.units);
      expect(WORD_ILLUSTRATIONS[w.id]).toBeTruthy();
    }
  });
});
