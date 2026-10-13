import { describe, expect, it } from "vitest";
import { ALL_SHADDAH_WORDS, SHADDAH_WORDS, SHADDAH_FATH_WORDS, SHADDAH_DAMM_WORDS, SHADDAH_KASR_WORDS } from "@/lib/shaddah-words";
import { LESSONS, UNIT_ORDER, PASS_PCT, parseLesson, recordUnitResult, unitState, type LessonId } from "@/lib/lessons";
import { SHADDAH_LESSONS, learningSummary } from "@/lib/learning-path";
import { readProgress } from "@/lib/progress";
import { syllablesOf } from "@/lib/reading-sounds";
import { WORD_ILLUSTRATIONS } from "@/lib/illustrations";
import { hasRecording } from "@/lib/audio";

const ids: LessonId[] = ["shaddah", "shaddah-fath", "shaddah-damm", "shaddah-kasr"];
describe("Shaddah curriculum", () => {
  it("preserves all four exact ordered word banks", () => {
    expect(SHADDAH_WORDS.map(w => w.ar)).toEqual("قِطَّةُ بَطَّةُ دُبُّ طَبَّاخُ خَبَّازُ رَسَّامُ سَلَّةُ مَجَلَّةُ جَدَّةُ صَرَّافُ فَلَّاحُ".split(" "));
    expect(SHADDAH_FATH_WORDS.map(w => w.ar)).toEqual("خَطًّا دُبًّا رَفًّا سُمًّا ظِلًّا فَكًّا".split(" "));
    expect(SHADDAH_DAMM_WORDS.map(w => w.ar)).toEqual("دُبٌّ رَبٌّ خَطٌّ رَفٌّ خَدٌّ عُشٌّ طِبٌّ فَنٌّ".split(" "));
    expect(SHADDAH_KASR_WORDS.map(w => w.ar)).toEqual("خَطٍّ رَفٍّ دُبٍّ قِطٍّ فَخٍّ كَفٍّ صَفٍّ".split(" "));
    expect(SHADDAH_WORDS.map(w => w.units.join(" | "))).toEqual(["قِ | طَّ | ةُ", "بَ | طَّ | ةُ", "دُ | بُّ", "طَ | بَّا | خُ", "خَ | بَّا | زُ", "رَ | سَّا | مُ", "سَ | لَّ | ةُ", "مَ | جَ | لَّ | ةُ", "جَ | دَّ | ةُ", "صَ | رَّا | فُ", "فَ | لَّا | حُ"]);
    expect(ALL_SHADDAH_WORDS.map(w => w.en)).toEqual(["Cat", "Duck", "Bear", "Cook / Chef", "Baker", "Artist / Painter", "Basket", "Magazine", "Grandmother", "Money exchanger", "Farmer", "A line", "A bear", "A shelf", "Poison", "A shadow", "A jaw", "A bear", "Lord / Master", "A line", "A shelf", "A cheek", "A nest", "Medicine / Medical practice", "Art", "A line", "A shelf", "A bear", "A cat", "A trap", "A palm of the hand", "A row"]);
    for (const w of ALL_SHADDAH_WORDS) {
      expect(w.units.join("")).toBe(w.ar);
      expect(syllablesOf(w.ar)).toEqual(w.units);
      expect(w.units.filter(u => u.includes("ّ"))).toHaveLength(1);
      expect(WORD_ILLUSTRATIONS[w.id]).toBeTruthy();
    }
    const allIds = Object.values(LESSONS).flatMap(l => l.words.map(w => w.id));
    expect(new Set(allIds).size).toBe(allIds.length);
    expect(SHADDAH_LESSONS.map(l => l.lesson)).toEqual(ids);
    expect(UNIT_ORDER.slice(-4)).toEqual(ids);
  });

  it("isolates each unit’s saved learning and results with the existing pass mark", () => {
    const original = { ...readProgress(), learned: [1], learnedTanweenKasr: [901], units: {} };
    for (const id of ids) {
      const L = LESSONS[id];
      expect(parseLesson(id)).toBe(id);
      const p = { ...original, [L.key]: L.words.map(w => w.id) };
      const failed = recordUnitResult(p, id, "quiz", 60);
      expect(unitState(failed, id).quizPassed).toBe(false);
      const passed = recordUnitResult(failed, id, "quiz", 70);
      const complete = recordUnitResult(passed, id, "test", 70);
      expect(unitState(complete, id).complete).toBe(true);
      expect(complete.learned).toEqual([1]);
      expect(complete.learnedTanweenKasr).toEqual([901]);
      for (const other of ids.filter(x => x !== id)) {
        expect(complete[LESSONS[other].key]).toEqual([]);
        expect(complete.units[other]).toBeUndefined();
      }
      expect(learningSummary([L.words[0]?.id ?? 0], L.words).resumeIndex).toBe(1);
      expect(recordUnitResult(complete, id, "quiz", 40).units[id]).toMatchObject({ quizBest: 70, quizPassed: true, testPassed: true });
    }
    expect(PASS_PCT).toBe(70);
  });

  it("loads old progress without removing any saved completions", () => {
    localStorage.setItem("qaf-progress-v1", JSON.stringify({ learned: [1], learnedTanweenKasr: [901] }));
    expect(readProgress()).toMatchObject({ learned: [1], learnedTanweenKasr: [901], learnedShaddah: [], learnedShaddahFath: [], learnedShaddahDamm: [], learnedShaddahKasr: [] });
    localStorage.removeItem("qaf-progress-v1");
  });

  it("has teacher recordings for every exact word and sound tile", () => {
    for (const w of ALL_SHADDAH_WORDS) {
      expect(hasRecording("w", w.ar), w.ar).toBe(true);
      for (const u of w.units) expect(hasRecording("u", u), u).toBe(true);
    }
  });
});