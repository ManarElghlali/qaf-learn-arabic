import { TANWEEN_FATH_WORDS } from "@/lib/tanween-fath-words";

/** Preserve approved Tanween boundaries, including the exceptional اءً tile. */
export const syllablesOf = (word: string): string[] =>
  TANWEEN_FATH_WORDS.find(w => w.ar === word)?.units.slice() ??
  word.match(/[^\u064B-\u0652](?:\u064E(?:ا|يْ)?|\u064Fو?|\u0650ي?|\u064Bا?|[\u064C-\u0652])/g) ?? [word];