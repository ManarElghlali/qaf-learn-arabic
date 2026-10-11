import { describe, expect, it } from "vitest";
import { THREE_WORDS, unitState, recordUnitResult, LESSONS } from "@/lib/lessons";
import { WORD_ILLUSTRATIONS } from "@/lib/illustrations";
import { hasRecording } from "@/lib/audio";
import { readProgress, type Progress } from "@/lib/progress";
import { WORDS } from "@/lib/words";

describe("Three Short Sounds unit", () => {
  it("contains the 30 supplied words with exact tashkeel", () => {
    expect(THREE_WORDS.map(w => w.ar)).toEqual("قَلَمُ قَمَرُ مَلِكُ جَبَلُ رَجَلُ شَجَرُ ثَمَرُ حَمَلُ خَشَبُ ذَهَبُ زَهَرُ سَمَكُ طَبَقُ بَلَدُ وَلَدُ عَلَمُ كَبِدُ كَتِفُ فَخِذُ أَثَرُ قَدَمُ بَقَرُ حَجَرُ عَنَبُ مَطَرُ نَهَرُ وَطَنُ غَنَمُ عَسَلُ بَصَلُ".split(" "));
  });
  it("splits every word into three sound units, own picture and word recording", () => {
    for (const w of THREE_WORDS) {
      expect(w.units).toHaveLength(3);
      expect(w.units.join("")).toBe(w.ar);
      expect(WORD_ILLUSTRATIONS[w.id]).toBeTruthy();
      expect(hasRecording("w", w.ar), w.ar).toBe(true);
    }
  });
  it("locks until Fatha & Kasra is complete and keeps its own results", () => {
    const base: Progress = { ...readProgress(), learned: [], learnedKasra: [], learnedThree: [], units: {} };
    expect(unitState(base, "three").unlocked).toBe(!UNIT_LOCKING);
    let p: Progress = { ...base, learned: WORDS.map(w => w.id), learnedKasra: LESSONS.kasra.words.map(w => w.id) };
    for (const id of ["fatha", "kasra"] as const) { p = recordUnitResult(p, id, "quiz", 80); p = recordUnitResult(p, id, "test", 80); }
    expect(unitState(p, "three")).toMatchObject({ unlocked: true, total: 30, learned: 0 });
    p = recordUnitResult(p, "three", "quiz", 50);
    expect(p.units["kasra"]).toEqual({ quizBest: 80, quizPassed: true, testBest: 80, testPassed: true });
    expect(unitState(p, "three").quizPassed).toBe(false);
  });
});
