import { describe, expect, it } from "vitest";
import { learningSummary, SHORT_LESSONS, MADD_LESSONS, TANWEEN_LESSONS } from "@/lib/learning-path";
import { WORDS } from "@/lib/words";

describe("Existing curriculum and saved continuation", () => {
  it("preserves all 42 approved spellings and tashkeel", () => {
    expect(WORDS.map(w => w.ar)).toEqual("كَتَبَ ذَهَبَ جَلَسَ أَكَلَ شَرَبَ لَعَبَ رَسَمَ قَرَأَ فَتَحَ دَخَلَ خَرَجَ حَمَلَ مَسَحَ غَسَلَ طَبَخَ ضَحَكَ صَعَدَ نَزَلَ نَظَرَ سَمَعَ بَحَثَ وَجَدَ وَقَفَ هَرَبَ زَرَعَ قَطَعَ جَمَعَ فَرَحَ مَنَعَ تَرَكَ رَكَبَ نَفَخَ نَشَرَ سَحَبَ دَفَعَ رَفَعَ وَقَعَ بَدَأَ خَلَعَ طَلَبَ ثَبَتَ يَبَسَ".split(" "));
  });
  it("starts at the first word without fabricated progress", () => {
    expect(learningSummary([])).toEqual({ completed: 0, percent: 0, resumeIndex: 0, status: "Available" });
  });
  it("resumes at the first unlearned word using saved IDs", () => {
    expect(learningSummary([1, 2, 3])).toEqual({ completed: 3, percent: 7, resumeIndex: 3, status: "In progress" });
  });
  it("offers review when all 42 words are complete", () => {
    expect(learningSummary(WORDS.map(w => w.id))).toEqual({ completed: 42, percent: 100, resumeIndex: 0, status: "Completed" });
  });
  it("opens Fatha and Fatha & Kasra within the four short lessons, in order", () => {
    expect(SHORT_LESSONS.map(l => l.ar)).toEqual(["الفتحة", "الفتحة والكسرة", "الفتحة والضمة والكسرة", "السكون"]);
    expect(SHORT_LESSONS.filter(l => l.available).map(l => l.en)).toEqual(["Fatha", "Fatha & Kasra"]);
  });
  it("limits Long Sounds to the three madd lessons", () => {
    expect(MADD_LESSONS.map(l => l.en)).toEqual(["Madd Alif", "Madd Waw", "Madd Yaa"]);
  });
  it("limits Tanween to the three requested lessons", () => {
    expect(TANWEEN_LESSONS.map(l => l.en)).toEqual(["Tanween Fath", "Tanween Damm", "Tanween Kasr"]);
  });
});