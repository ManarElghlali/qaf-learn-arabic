import { describe, expect, it } from "vitest";
import { SUKOON_WORDS, unitState, recordUnitResult, LESSONS } from "@/lib/lessons";
import { WORD_ILLUSTRATIONS } from "@/lib/illustrations";
import { hasRecording } from "@/lib/audio";
import { readProgress, type Progress } from "@/lib/progress";

describe("Sukoon unit", () => {
  it("contains the 20 supplied words with exact tashkeel", () => {
    expect(SUKOON_WORDS.map(w => w.ar)).toEqual("نَمْلُ قَلْبُ كَلْبُ شَمْسُ بَدْرُ نَجْمُ بَحْرُ نَهْرُ أَرْضُ وَرْدُ زَهْرُ فَهْدُ صَقْرُ نَسْرُ ثَوْرُ قِرْدُ طِفْلُ جِذْعُ خُبْزُ غُصْنُ".split(" "));
  });
  it("splits every word into vowel | sukoon | vowel, with picture and recordings", () => {
    for (const w of SUKOON_WORDS) {
      expect(w.units).toHaveLength(3);
      expect(w.units.join("")).toBe(w.ar);
      expect(w.units[1]!.endsWith("\u0652")).toBe(true);
      expect(WORD_ILLUSTRATIONS[w.id]).toBeTruthy();
      expect(hasRecording("w", w.ar), w.ar).toBe(true);
      for (const u of w.units) expect(hasRecording("u", u), u).toBe(true);
    }
  });
  it("keeps its own progress and results", () => {
    let p: Progress = { ...readProgress(), learnedSukoon: [], units: {} };
    p = recordUnitResult(p, "three", "quiz", 90);
    p = recordUnitResult(p, "sukoon", "quiz", 60);
    expect(unitState(p, "sukoon")).toMatchObject({ total: 20, learned: 0, quizPassed: false });
    expect(unitState(p, "three").quizPassed).toBe(true);
    p = recordUnitResult(p, "sukoon", "quiz", 70);
    expect(unitState(p, "sukoon").quizPassed).toBe(true);
    expect(LESSONS.sukoon.key).toBe("learnedSukoon");
  });
});
