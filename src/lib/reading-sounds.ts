import { TANWEEN_FATH_WORDS } from "@/lib/tanween-fath-words";
import { TANWEEN_DAMM_WORDS } from "@/lib/tanween-damm-words";

const TANWEEN_WORDS = [...TANWEEN_FATH_WORDS, ...TANWEEN_DAMM_WORDS];

/** Preserve approved Tanween boundaries, including the exceptional اءً and آ tiles. */
export const syllablesOf = (word: string): string[] =>
  TANWEEN_WORDS.find(w => w.ar === word)?.units.slice() ??
  word.match(/[^\u064B-\u0652](?:\u064E(?:ا|يْ)?|\u064Fو?|\u0650ي?|\u064Bا?|[\u064C-\u0652])/g) ?? [word];