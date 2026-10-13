import { describe, expect, it } from "vitest";
import { TANWEEN_DAMM_WORDS, LESSONS, UNIT_ORDER, PASS_PCT, parseLesson, recordUnitResult, unitState } from "@/lib/lessons";
import { TANWEEN_LESSONS, learningSummary } from "@/lib/learning-path";
import { readProgress } from "@/lib/progress";
import { syllablesOf } from "@/lib/reading-sounds";
import { WORD_ILLUSTRATIONS } from "@/lib/illustrations";
import { hasRecording } from "@/lib/audio";

describe("Tanween Damm", () => {
  it("preserves the exact 18 words, meanings and supplied tiles", () => {
    expect(TANWEEN_DAMM_WORDS.map(w => w.ar)).toEqual("قِرْدٌ ذِئْبٌ ثَعْلَبٌ أَرْنَبٌ مِفْتَاحٌ مِكْنَسَةٌ وِسَادَةٌ مِرْآةٌ مِنْشَفَةٌ دَلْوٌ غُرْفَةٌ نَافِذَةٌ تِلْفَازٌ طَاوِلَةٌ كَأْسٌ مِصْبَاحٌ مَكْتَبَةٌ صُورَةٌ".split(" "));
    expect(TANWEEN_DAMM_WORDS.map(w => w.en)).toEqual(["A monkey", "A wolf", "A fox", "A rabbit", "A key", "A broom", "A pillow", "A mirror", "A towel", "A bucket", "A room", "A window", "A television", "A table", "A cup / glass", "A lamp", "A library / bookcase", "A picture / photo"]);
    expect(TANWEEN_DAMM_WORDS.map(w => w.units.join(" | "))).toEqual([
      "قِ | رْ | دٌ", "ذِ | ئْ | بٌ", "ثَ | عْ | لَ | بٌ", "أَ | رْ | نَ | بٌ", "مِ | فْ | تَا | حٌ", "مِ | كْ | نَ | سَ | ةٌ", "وِ | سَا | دَ | ةٌ", "مِ | رْ | آ | ةٌ", "مِ | نْ | شَ | فَ | ةٌ", "دَ | لْ | وٌ", "غُ | رْ | فَ | ةٌ", "نَا | فِ | ذَ | ةٌ", "تِ | لْ | فَا | زٌ", "طَا | وِ | لَ | ةٌ", "كَ | أْ | سٌ", "مِ | صْ | بَا | حٌ", "مَ | كْ | تَ | بَ | ةٌ", "صُو | رَ | ةٌ",
    ]);
    for (const w of TANWEEN_DAMM_WORDS) {
      expect(w.units.join("")).toBe(w.ar);
      expect(syllablesOf(w.ar), w.ar).toEqual(w.units);
      expect(WORD_ILLUSTRATIONS[w.id], w.ar).toBeTruthy();
    }
    const ids = Object.values(LESSONS).flatMap(l => l.words.map(w => w.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("isolates saved words and results with the existing 70% pass mark", () => {
    const p = { ...readProgress(), learnedTanweenDamm: [801], learnedTanweenFath: [701], units: {} };
    const failed = recordUnitResult(p, "tanween-damm", "quiz", 60);
    expect(unitState(failed, "tanween-damm")).toMatchObject({ learned: 1, total: 18, quizPassed: false });
    const passed = recordUnitResult(failed, "tanween-damm", "quiz", 70);
    expect(passed.units["tanween-fath"]).toBeUndefined();
    expect(passed.learnedTanweenFath).toEqual([701]);
    expect(learningSummary(passed.learnedTanweenDamm, TANWEEN_DAMM_WORDS).resumeIndex).toBe(1);
    const complete = recordUnitResult({ ...passed, learnedTanweenDamm: TANWEEN_DAMM_WORDS.map(w => w.id) }, "tanween-damm", "test", 70);
    expect(unitState(complete, "tanween-damm").complete).toBe(true);
    expect(LESSONS["tanween-damm"].key).toBe("learnedTanweenDamm");
    expect(parseLesson("tanween-damm")).toBe("tanween-damm");
    expect(UNIT_ORDER.at(-1)).toBe("tanween-damm");
    expect(PASS_PCT).toBe(70);
    expect(TANWEEN_LESSONS[1]).toMatchObject({ available: true, lesson: "tanween-damm" });
    expect(TANWEEN_LESSONS[2]).not.toHaveProperty("lesson");
  });

  it("loads older progress without resetting any previous words", () => {
    localStorage.setItem("qaf-progress-v1", JSON.stringify({ learned: [1], learnedTanweenFath: [701] }));
    expect(readProgress()).toMatchObject({ learned: [1], learnedTanweenFath: [701], learnedTanweenDamm: [] });
    localStorage.removeItem("qaf-progress-v1");
  });

  it("has teacher audio for every word and exact sound tile", () => {
    for (const w of TANWEEN_DAMM_WORDS) {
      expect(hasRecording("w", w.ar), w.ar).toBe(true);
      for (const u of w.units) expect(hasRecording("u", u), u).toBe(true);
    }
  });
});