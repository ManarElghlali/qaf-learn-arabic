import { describe, expect, it } from "vitest";
import { TANWEEN_FATH_WORDS, LESSONS, UNIT_ORDER, PASS_PCT, parseLesson, recordUnitResult, unitState } from "@/lib/lessons";
import { TANWEEN_LESSONS, learningSummary } from "@/lib/learning-path";
import { readProgress } from "@/lib/progress";
import { syllablesOf } from "@/lib/reading-sounds";
import { WORD_ILLUSTRATIONS } from "@/lib/illustrations";
import { hasRecording } from "@/lib/audio";

describe("Tanween Fath", () => {
  it("preserves all 30 approved words, meanings and sound boundaries", () => {
    expect(TANWEEN_FATH_WORDS.map(w => w.ar)).toEqual("قَلَمًا كِتَابًا بَابًا وَلَدًا رَجُلًا جَبَلًا بَيْتًا نَهْرًا بَحْرًا كَلْبًا أَسَدًا طَرِيقًا طَبِيبًا عَصِيرًا صُنْدُوقًا قَمَرًا نَجْمًا ثَوْبًا خُبْزًا زَهْرًا مَدْرَسَةً شَجَرَةً سَاعَةً حَقِيبَةً وَرَقًا بَصَلًا مَاءً سَمَاءً دَوَاءً هَوَاءً".split(" "));
    expect(TANWEEN_FATH_WORDS.map(w => w.en)).toEqual(["A pen", "A book", "A door", "A boy", "A man", "A mountain", "A house", "A river", "A sea", "A dog", "A lion", "A road / path", "A doctor", "Juice", "A box", "A moon", "A star", "A garment", "Bread", "A flower", "A school", "A tree", "A clock / watch", "A bag", "Paper", "An onion", "Water", "Sky", "Medicine", "Air"]);
    expect(TANWEEN_FATH_WORDS.map(w => w.units.join(" | "))).toEqual([
      "قَ | لَ | مًا", "كِ | تَا | بًا", "بَا | بًا", "وَ | لَ | دًا", "رَ | جُ | لًا", "جَ | بَ | لًا", "بَيْ | تًا", "نَ | هْ | رًا", "بَ | حْ | رًا", "كَ | لْ | بًا", "أَ | سَ | دًا", "طَ | رِي | قًا", "طَ | بِي | بًا", "عَ | صِي | رًا", "صُ | نْ | دُو | قًا", "قَ | مَ | رًا", "نَ | جْ | مًا", "ثَ | وْ | بًا", "خُ | بْ | زًا", "زَ | هْ | رًا", "مَ | دْ | رَ | سَ | ةً", "شَ | جَ | رَ | ةً", "سَا | عَ | ةً", "حَ | قِي | بَ | ةً", "وَ | رَ | قًا", "بَ | صَ | لًا", "مَا | ءً", "سَ | مَا | ءً", "دَ | وَ | اءً", "هَ | وَا | ءً",
    ]);
    for (const w of TANWEEN_FATH_WORDS) {
      expect(w.units.join("")).toBe(w.ar);
      expect(syllablesOf(w.ar), w.ar).toEqual(w.units);
      expect(WORD_ILLUSTRATIONS[w.id]).toBeTruthy();
    }
    const ids = Object.values(LESSONS).flatMap(l => l.words.map(w => w.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(syllablesOf("تُفَّاحًا").at(-1)).toBe("حًا");
  });

  it("keeps progress, continuation and 70% results independent", () => {
    const p = { ...readProgress(), learnedTanweenFath: [701], learnedYaa: [601], units: {} };
    const failed = recordUnitResult(p, "tanween-fath", "quiz", 60);
    expect(unitState(failed, "tanween-fath")).toMatchObject({ learned: 1, total: 30, quizPassed: false });
    const passed = recordUnitResult(failed, "tanween-fath", "quiz", 70);
    expect(passed.units["tanween-fath"]?.quizPassed).toBe(true);
    expect(passed.units["yaa"]).toBeUndefined();
    expect(passed.learnedYaa).toEqual([601]);
    expect(learningSummary(passed.learnedTanweenFath, TANWEEN_FATH_WORDS).resumeIndex).toBe(1);
    const complete = recordUnitResult({ ...passed, learnedTanweenFath: TANWEEN_FATH_WORDS.map(w => w.id) }, "tanween-fath", "test", 70);
    expect(unitState(complete, "tanween-fath").complete).toBe(true);
    expect(LESSONS["tanween-fath"].key).toBe("learnedTanweenFath");
    expect(parseLesson("tanween-fath")).toBe("tanween-fath");
    expect(UNIT_ORDER[UNIT_ORDER.indexOf("tanween-fath") + 1]).toBe("tanween-damm");
    expect(PASS_PCT).toBe(70);
    expect(TANWEEN_LESSONS[0]).toMatchObject({ available: true, lesson: "tanween-fath" });
    expect(TANWEEN_LESSONS[1]).toMatchObject({ available: true, lesson: "tanween-damm" });
    expect(TANWEEN_LESSONS[2]).toMatchObject({ available: true, lesson: "tanween-kasr" });
  });

  it("migrates earlier saved progress without resetting completed words", () => {
    localStorage.setItem("qaf-progress-v1", JSON.stringify({ learned: [1, 2], learnedYaa: [601] }));
    expect(readProgress()).toMatchObject({ learned: [1, 2], learnedYaa: [601], learnedTanweenFath: [] });
    localStorage.removeItem("qaf-progress-v1");
  });

  it("has teacher recordings for every word and sound tile", () => {
    for (const w of TANWEEN_FATH_WORDS) {
      expect(hasRecording("w", w.ar), w.ar).toBe(true);
      for (const u of w.units) expect(hasRecording("u", u), u).toBe(true);
    }
  });
});