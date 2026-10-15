import { describe, expect, it } from "vitest";
import { LESSONS } from "@/lib/lessons";
import { FREE_QUIZZES, FREE_QUIZ_LENGTH, FREE_WORD_IDS } from "@/lib/access";
import { quizWords } from "@/lib/quiz-session";

describe("unique quiz attempts", () => {
  it("samples 70% rounded up from every unit, without repeats or foreign words", () => {
    for (const lesson of Object.values(LESSONS)) {
      for (let attempt = 0; attempt < 10; attempt++) {
        const deck = quizWords(lesson.words);
        expect(deck).toHaveLength(Math.ceil(lesson.words.length * 0.7));
        expect(new Set(deck.map((word) => word.id)).size).toBe(deck.length);
        expect(deck.every((word) => lesson.words.includes(word))).toBe(true);
      }
    }
  });
  it("keeps all free formats to six unique approved words", () => {
    for (const quiz of FREE_QUIZZES) {
      const deck = quizWords(quiz.words, FREE_QUIZ_LENGTH);
      expect(deck).toHaveLength(6);
      expect(new Set(deck.map((word) => word.id)).size).toBe(6);
      expect(deck.every((word) => FREE_WORD_IDS.has(word.id))).toBe(true);
    }
  });
  it("bounds a requested length and removes repeated IDs", () => {
    const words = FREE_QUIZZES[0]?.words ?? [];
    expect(quizWords([...words, ...words], 100)).toHaveLength(words.length);
    expect(quizWords([], 10)).toEqual([]);
  });
});