/** Vocalized sounds, with written long vowels and ay diphthongs kept together. */
export const syllablesOf = (word: string): string[] =>
  word.match(/[^\u064B-\u0652](?:\u064E(?:ا|يْ)?|\u064Fو?|\u0650ي?|[\u064B-\u0652])/g) ?? [word];