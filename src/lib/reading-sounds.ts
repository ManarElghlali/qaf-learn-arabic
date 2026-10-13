import { TANWEEN_FATH_WORDS } from "@/lib/tanween-fath-words";
import { TANWEEN_DAMM_WORDS } from "@/lib/tanween-damm-words";
import { TANWEEN_KASR_WORDS } from "@/lib/tanween-kasr-words";
import { ALL_SHADDAH_WORDS } from "@/lib/shaddah-words";

const LITERAL_WORDS = [...TANWEEN_FATH_WORDS, ...TANWEEN_DAMM_WORDS, ...TANWEEN_KASR_WORDS, ...ALL_SHADDAH_WORDS];

/** Preserve approved boundaries; fallback also groups shaddah in either Unicode mark order. */
export const syllablesOf = (word: string): string[] =>
  LITERAL_WORDS.find(w => w.ar === word)?.units.slice() ??
  word.match(/[^\u064B-\u0652](?:\u0651?[\u064E](?:\u0651)?(?:ا|يْ)?|\u0651?\u064F\u0651?و?|\u0651?\u0650\u0651?ي?|\u0651?\u064B\u0651?ا?|\u0651?[\u064C\u064D]\u0651?|\u0652|\u0651)/g) ?? [word];