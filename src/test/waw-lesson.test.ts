import { describe, expect, it } from "vitest";
import { WAW_WORDS, LESSONS, UNIT_ORDER, PASS_PCT, parseLesson, recordUnitResult, unitState } from "@/lib/lessons";
import { readProgress } from "@/lib/progress";
import { syllablesOf } from "@/lib/reading-sounds";
import { WORD_ILLUSTRATIONS } from "@/lib/illustrations";
import { hasRecording } from "@/lib/audio";

describe("Madd Waw", () => {
  it("preserves all 26 approved spellings, order and sound units", () => {
    expect(WAW_WORDS.map(w => w.ar)).toEqual("حُوتُ ثُومُ سُورُ نُورُ سُوقُ كُوبُ تُوتُ عُودُ صُوفُ فُولُ زُهُورُ طُيُورُ نُجُومُ عُصْفُورُ صُنْدُوقُ قُرُودُ قُبُورُ عُلُومُ جُسُورُ شُمُوعُ صُوصُ خَرُوفُ زَيْتُونُ صَابُونُ لَيْمُونُ حَاسُوبُ".split(" "));
    for (const w of WAW_WORDS) {
      expect(w.units.join("")).toBe(w.ar);
      expect(syllablesOf(w.ar), w.ar).toEqual(w.units);
      expect(w.units.some(u => u.endsWith("ُو"))).toBe(true);
      expect(w.units).not.toContain("و");
      expect(WORD_ILLUSTRATIONS[w.id]).toBeTruthy();
    }
    expect(WAW_WORDS[22]?.units).toEqual(["زَيْ", "تُو", "نُ"]);
    expect(WAW_WORDS[23]?.units).toEqual(["صَا", "بُو", "نُ"]);
    expect(WAW_WORDS[24]?.units).toEqual(["لَيْ", "مُو", "نُ"]);
    expect(WAW_WORDS[25]?.units).toEqual(["حَا", "سُو", "بُ"]);
  });
  it("keeps progress and 70% results independent", () => {
    const p = { ...readProgress(), learnedWaw: [501], learnedAlif: [401], units: {} };
    const failed = recordUnitResult(p, "waw", "quiz", 60);
    expect(unitState(failed, "waw")).toMatchObject({ learned: 1, total: 26, quizPassed: false });
    const passed = recordUnitResult(failed, "waw", "quiz", 70);
    expect(passed.units.waw?.quizPassed).toBe(true);
    expect(passed.units.alif).toBeUndefined();
    expect(passed.learnedAlif).toEqual([401]);
    expect(LESSONS.waw.key).toBe("learnedWaw");
    expect(parseLesson("waw")).toBe("waw");
    expect(UNIT_ORDER.at(-1)).toBe("waw");
    expect(PASS_PCT).toBe(70);
  });
  it("has teacher recordings for every word and grouped sound", () => {
    for (const w of WAW_WORDS) {
      expect(hasRecording("w", w.ar), w.ar).toBe(true);
      for (const u of w.units) expect(hasRecording("u", u), u).toBe(true);
    }
  });
});