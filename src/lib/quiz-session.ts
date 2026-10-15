import { shuffle, type Word } from "@/lib/words";

/** A fixed, unique target deck for one attempt; retries create a fresh deck. */
export function quizWords(words: Word[], length = Math.ceil(words.length * 0.7)): Word[] {
  const unique = [...new Map(words.map((word) => [word.id, word])).values()];
  return shuffle(unique).slice(0, Math.min(unique.length, Math.max(0, length)));
}