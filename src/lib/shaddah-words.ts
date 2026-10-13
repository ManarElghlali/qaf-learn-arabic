import type { Word } from "@/lib/words";

// Literal approved banks: a doubled consonant and its vowel form ONE sound tile.
const makeBank = (start: number, rows: [string, string, string, string][]): Word[] =>
  rows.map(([ar, units, tr, en], i) => ({ id: start + i, ar, units: units.split(" "), tr, en }));

export const SHADDAH_WORDS = makeBank(1001, [
  ["قِطَّةُ", "قِ طَّ ةُ", "qittatu", "Cat"],
  ["بَطَّةُ", "بَ طَّ ةُ", "battatu", "Duck"],
  ["دُبُّ", "دُ بُّ", "dubbu", "Bear"],
  ["طَبَّاخُ", "طَ بَّا خُ", "tabbaakhu", "Cook / Chef"],
  ["خَبَّازُ", "خَ بَّا زُ", "khabbaazu", "Baker"],
  ["رَسَّامُ", "رَ سَّا مُ", "rassaamu", "Artist / Painter"],
  ["سَلَّةُ", "سَ لَّ ةُ", "sallatu", "Basket"],
  ["مَجَلَّةُ", "مَ جَ لَّ ةُ", "majallatu", "Magazine"],
  ["جَدَّةُ", "جَ دَّ ةُ", "jaddatu", "Grandmother"],
  ["صَرَّافُ", "صَ رَّا فُ", "sarraafu", "Money exchanger"],
  ["فَلَّاحُ", "فَ لَّا حُ", "fallaahu", "Farmer"],
]);

export const SHADDAH_FATH_WORDS = makeBank(1101, [
  ["خَطًّا", "خَ طًّا", "khattan", "A line"],
  ["دُبًّا", "دُ بًّا", "dubban", "A bear"],
  ["رَفًّا", "رَ فًّا", "raffan", "A shelf"],
  ["سُمًّا", "سُ مًّا", "summan", "Poison"],
  ["ظِلًّا", "ظِ لًّا", "zillan", "A shadow"],
  ["فَكًّا", "فَ كًّا", "fakkan", "A jaw"],
]);

export const SHADDAH_DAMM_WORDS = makeBank(1201, [
  ["دُبٌّ", "دُ بٌّ", "dubbun", "A bear"],
  ["رَبٌّ", "رَ بٌّ", "rabbun", "Lord / Master"],
  ["خَطٌّ", "خَ طٌّ", "khattun", "A line"],
  ["رَفٌّ", "رَ فٌّ", "raffun", "A shelf"],
  ["خَدٌّ", "خَ دٌّ", "khaddun", "A cheek"],
  ["عُشٌّ", "عُ شٌّ", "'ushshun", "A nest"],
  ["طِبٌّ", "طِ بٌّ", "tibbun", "Medicine / Medical practice"],
  ["فَنٌّ", "فَ نٌّ", "fannun", "Art"],
]);

export const SHADDAH_KASR_WORDS = makeBank(1301, [
  ["خَطٍّ", "خَ طٍّ", "khattin", "A line"],
  ["رَفٍّ", "رَ فٍّ", "raffin", "A shelf"],
  ["دُبٍّ", "دُ بٍّ", "dubbin", "A bear"],
  ["قِطٍّ", "قِ طٍّ", "qittin", "A cat"],
  ["فَخٍّ", "فَ خٍّ", "fakhkhin", "A trap"],
  ["كَفٍّ", "كَ فٍّ", "kaffin", "A palm of the hand"],
  ["صَفٍّ", "صَ فٍّ", "saffin", "A row"],
]);

export const ALL_SHADDAH_WORDS = [...SHADDAH_WORDS, ...SHADDAH_FATH_WORDS, ...SHADDAH_DAMM_WORDS, ...SHADDAH_KASR_WORDS];