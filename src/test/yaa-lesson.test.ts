import { describe, expect, it } from "vitest";
import { YAA_WORDS, LESSONS, UNIT_ORDER, parseLesson, recordUnitResult, unitState } from "@/lib/lessons";
import { MADD_LESSONS, learningSummary } from "@/lib/learning-path";
import { readProgress } from "@/lib/progress";
import { syllablesOf } from "@/lib/reading-sounds";
import { WORD_ILLUSTRATIONS } from "@/lib/illustrations";
import { hasRecording } from "@/lib/audio";

describe("Madd Yā", () => {
  it("preserves the exact approved word bank and grouped long ii sounds", () => {
    expect(YAA_WORDS.map(w => w.ar)).toEqual("فِيلُ تِينُ حَلِيبُ طَبِيبُ صَدِيقُ قَمِيصُ سَرِيرُ عَصِيرُ أَمِيرُ رَغِيفُ نَخِيلُ طَرِيقُ حَدِيقَةُ سَفِينَةُ قَرِيبُ نَشِيدُ بَرِيدُ كَبِيرُ صَغِيرُ جَمِيلُ قَصِيرُ طَوِيلُ لَطِيفُ سَرِيعُ نَظِيفُ".split(" "));
    expect(YAA_WORDS.map(w => w.en)).toEqual(["Elephant", "Figs", "Milk", "Doctor", "Friend", "Shirt", "Bed", "Juice", "Prince", "Loaf of bread", "Palm trees", "Road / Path", "Garden / Park", "Ship", "Relative / Near", "Anthem / Song", "Mail / Post", "Big / Large", "Small / Young", "Beautiful", "Short", "Tall / Long", "Kind / Gentle", "Fast / Quick", "Clean"]);
    for (const w of YAA_WORDS) {
      expect(w.units.join("")).toBe(w.ar);
      expect(syllablesOf(w.ar), w.ar).toEqual(w.units);
      expect(w.units.some(u => u.endsWith("ِي"))).toBe(true);
      expect(w.units).not.toContain("ي");
      expect(WORD_ILLUSTRATIONS[w.id]).toBeTruthy();
    }
    expect(YAA_WORDS[12]?.units).toEqual(["حَ", "دِي", "قَ", "ةُ"]);
    expect(YAA_WORDS[13]?.units).toEqual(["سَ", "فِي", "نَ", "ةُ"]);
    const ids = Object.values(LESSONS).flatMap(l => l.words.map(w => w.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps saved progress, continuation and 70% results isolated", () => {
    const p = { ...readProgress(), learnedYaa: [601], learnedWaw: [501], units: {} };
    const failed = recordUnitResult(p, "yaa", "quiz", 60);
    expect(unitState(failed, "yaa")).toMatchObject({ learned: 1, total: 25, quizPassed: false });
    const passed = recordUnitResult(failed, "yaa", "quiz", 70);
    expect(passed.units["yaa"]?.quizPassed).toBe(true);
    expect(passed.units["waw"]).toBeUndefined();
    expect(passed.learnedWaw).toEqual([501]);
    expect(learningSummary(passed.learnedYaa, YAA_WORDS).resumeIndex).toBe(1);
    const complete = recordUnitResult({ ...passed, learnedYaa: YAA_WORDS.map(w => w.id) }, "yaa", "test", 70);
    expect(unitState(complete, "yaa").complete).toBe(true);
    expect(LESSONS.yaa.key).toBe("learnedYaa");
    expect(parseLesson("yaa")).toBe("yaa");
    expect(UNIT_ORDER[UNIT_ORDER.indexOf("yaa") + 1]).toBe("tanween-fath");
    expect(MADD_LESSONS.at(-1)).toMatchObject({ available: true, lesson: "yaa" });
  });

  it("has teacher recordings for every word and grouped sound", () => {
    for (const w of YAA_WORDS) {
      expect(hasRecording("w", w.ar), w.ar).toBe(true);
      for (const u of w.units) expect(hasRecording("u", u), u).toBe(true);
    }
  });
});