import { describe, expect, it } from "vitest";
import { TANWEEN_KASR_WORDS, LESSONS, UNIT_ORDER, PASS_PCT, parseLesson, recordUnitResult, unitState } from "@/lib/lessons";
import { TANWEEN_LESSONS, learningSummary } from "@/lib/learning-path";
import { readProgress } from "@/lib/progress";
import { syllablesOf } from "@/lib/reading-sounds";
import { WORD_ILLUSTRATIONS } from "@/lib/illustrations";
import { hasRecording } from "@/lib/audio";

describe("Tanween Kasr", () => {
  it("preserves the exact 20 words, meanings and literal sound tiles", () => {
    expect(TANWEEN_KASR_WORDS.map(w => w.ar)).toEqual("تِمْسَاحٍ غُرَابٍ سُلَحْفَاةٍ نَحْلَةٍ نَمْلَةٍ عَنْكَبُوتٍ شَاحِنَةٍ حَافِلَةٍ مَطْبَخٍ مَلْعَبٍ حِذَاءٍ جَوْرَبٍ مِئْزَرٍ مِرْسَمٍ مِبْرَاةٍ مِرْوَحَةٍ صَحْنٍ مِلْعَقَةٍ فِنْجَانٍ مِصْعَدٍ".split(" "));
    expect(TANWEEN_KASR_WORDS.map(w => w.en)).toEqual(["A crocodile", "A crow", "A turtle", "A bee", "An ant", "A spider", "A truck", "A bus", "A kitchen", "A playground / stadium", "A shoe", "A sock", "An apron", "An art studio", "A pencil sharpener", "A fan", "A plate", "A spoon", "A cup", "An elevator"]);
    expect(TANWEEN_KASR_WORDS.map(w => w.units.join(" | "))).toEqual([
      "تِ | مْ | سَا | حٍ", "غُ | رَا | بٍ", "سُ | لَ | حْ | فَا | ةٍ", "نَ | حْ | لَ | ةٍ", "نَ | مْ | لَ | ةٍ", "عَ | نْ | كَ | بُو | تٍ", "شَا | حِ | نَ | ةٍ", "حَا | فِ | لَ | ةٍ", "مَ | طْ | بَ | خٍ", "مَ | لْ | عَ | بٍ", "حِ | ذَا | ءٍ", "جَ | وْ | رَ | بٍ", "مِ | ئْ | زَ | رٍ", "مِ | رْ | سَ | مٍ", "مِ | بْ | رَا | ةٍ", "مِ | رْ | وَ | حَ | ةٍ", "صَ | حْ | نٍ", "مِ | لْ | عَ | قَ | ةٍ", "فِ | نْ | جَا | نٍ", "مِ | صْ | عَ | دٍ",
    ]);
    for (const w of TANWEEN_KASR_WORDS) {
      expect(w.units.join("")).toBe(w.ar);
      expect(syllablesOf(w.ar)).toEqual(w.units);
      expect(WORD_ILLUSTRATIONS[w.id]).toBeTruthy();
    }
    const ids = Object.values(LESSONS).flatMap(l => l.words.map(w => w.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("isolates learning and results while retaining 70% passing", () => {
    const p = { ...readProgress(), learnedTanweenKasr: [901], learnedTanweenDamm: [801], units: {} };
    const failed = recordUnitResult(p, "tanween-kasr", "quiz", 60);
    expect(unitState(failed, "tanween-kasr")).toMatchObject({ learned: 1, total: 20, quizPassed: false });
    const passed = recordUnitResult(failed, "tanween-kasr", "quiz", 70);
    expect(passed.units["tanween-damm"]).toBeUndefined();
    expect(passed.learnedTanweenDamm).toEqual([801]);
    expect(learningSummary(passed.learnedTanweenKasr, TANWEEN_KASR_WORDS).resumeIndex).toBe(1);
    const completed = recordUnitResult({ ...passed, learnedTanweenKasr: TANWEEN_KASR_WORDS.map(w => w.id) }, "tanween-kasr", "test", 70);
    expect(unitState(completed, "tanween-kasr").complete).toBe(true);
    expect(recordUnitResult(completed, "tanween-kasr", "quiz", 40).units["tanween-kasr"]).toMatchObject({ quizBest: 70, quizPassed: true, testPassed: true });
    expect(LESSONS["tanween-kasr"].key).toBe("learnedTanweenKasr");
    expect(parseLesson("tanween-kasr")).toBe("tanween-kasr");
    expect(UNIT_ORDER.at(-1)).toBe("tanween-kasr");
    expect(PASS_PCT).toBe(70);
    expect(TANWEEN_LESSONS[2]).toMatchObject({ available: true, lesson: "tanween-kasr" });
  });

  it("loads earlier saved progress without resetting existing units", () => {
    localStorage.setItem("qaf-progress-v1", JSON.stringify({ learned: [1], learnedTanweenDamm: [801] }));
    expect(readProgress()).toMatchObject({ learned: [1], learnedTanweenDamm: [801], learnedTanweenKasr: [] });
    localStorage.removeItem("qaf-progress-v1");
  });

  it("has teacher recordings for every exact word and tile", () => {
    for (const w of TANWEEN_KASR_WORDS) {
      expect(hasRecording("w", w.ar), w.ar).toBe(true);
      for (const u of w.units) expect(hasRecording("u", u), u).toBe(true);
    }
  });
});