export type Word = { id: number; ar: string; units: string[]; tr: string; en: string; icon: string };

const raw: [string, string, string, string, string][] = [
  ["كَتَبَ", "كَ تَ بَ", "kataba", "He wrote", "✍️"],
  ["ذَهَبَ", "ذَ هَ بَ", "dhahaba", "He went", "🚶"],
  ["جَلَسَ", "جَ لَ سَ", "jalasa", "He sat", "🪑"],
  ["أَكَلَ", "أَ كَ لَ", "akala", "He ate", "🍽️"],
  ["شَرَبَ", "شَ رَ بَ", "sharaba", "He drank", "🥤"],
  ["لَعَبَ", "لَ عَ بَ", "la'aba", "He played", "⚽"],
  ["رَسَمَ", "رَ سَ مَ", "rasama", "He drew", "🎨"],
  ["قَرَأَ", "قَ رَ أَ", "qara'a", "He read", "📖"],
  ["فَتَحَ", "فَ تَ حَ", "fataha", "He opened", "🚪"],
  ["دَخَلَ", "دَ خَ لَ", "dakhala", "He entered", "🏠"],
  ["خَرَجَ", "خَ رَ جَ", "kharaja", "He went out", "🌳"],
  ["حَمَلَ", "حَ مَ لَ", "hamala", "He carried", "📦"],
  ["مَسَحَ", "مَ سَ حَ", "masaha", "He wiped", "🧽"],
  ["غَسَلَ", "غَ سَ لَ", "ghasala", "He washed", "🧼"],
  ["طَبَخَ", "طَ بَ خَ", "tabakha", "He cooked", "🍳"],
  ["ضَحَكَ", "ضَ حَ كَ", "dahaka", "He laughed", "😄"],
  ["صَعَدَ", "صَ عَ دَ", "sa'ada", "He climbed", "🧗"],
  ["نَزَلَ", "نَ زَ لَ", "nazala", "He went down", "⬇️"],
  ["نَظَرَ", "نَ ظَ رَ", "nazara", "He looked", "👀"],
  ["سَمَعَ", "سَ مَ عَ", "sama'a", "He heard", "👂"],
  ["بَحَثَ", "بَ حَ ثَ", "bahatha", "He searched", "🔍"],
  ["وَجَدَ", "وَ جَ دَ", "wajada", "He found", "💎"],
  ["وَقَفَ", "وَ قَ فَ", "waqafa", "He stood", "🧍"],
  ["هَرَبَ", "هَ رَ بَ", "haraba", "He ran away", "🏃"],
  ["زَرَعَ", "زَ رَ عَ", "zara'a", "He planted", "🌱"],
  ["قَطَعَ", "قَ طَ عَ", "qata'a", "He cut", "✂️"],
  ["جَمَعَ", "جَ مَ عَ", "jama'a", "He collected", "🧺"],
  ["فَرَحَ", "فَ رَ حَ", "faraha", "He was happy", "🥳"],
  ["مَنَعَ", "مَ نَ عَ", "mana'a", "He prevented", "🛑"],
  ["تَرَكَ", "تَ رَ كَ", "taraka", "He left", "👋"],
  ["رَكَبَ", "رَ كَ بَ", "rakaba", "He rode", "🚲"],
  ["نَفَخَ", "نَ فَ خَ", "nafakha", "He blew", "🎈"],
  ["نَشَرَ", "نَ شَ رَ", "nashara", "He spread", "🧺"],
  ["سَحَبَ", "سَ حَ بَ", "sahaba", "He pulled", "🪢"],
  ["دَفَعَ", "دَ فَ عَ", "dafa'a", "He pushed", "🛒"],
  ["رَفَعَ", "رَ فَ عَ", "rafa'a", "He lifted", "🏋️"],
  ["وَقَعَ", "وَ قَ عَ", "waqa'a", "He fell", "🍂"],
  ["بَدَأَ", "بَ دَ أَ", "bada'a", "He started", "🏁"],
  ["خَلَعَ", "خَ لَ عَ", "khala'a", "He took off", "👟"],
  ["طَلَبَ", "طَ لَ بَ", "talaba", "He asked", "🙋"],
  ["ثَبَتَ", "ثَ بَ تَ", "thabata", "He stood firm", "🗿"],
  ["يَبَسَ", "يَ بَ سَ", "yabasa", "He dried up", "🌵"],
];

export const WORDS: Word[] = raw.map(([ar, u, tr, en, icon], i) => ({
  id: i + 1, ar, units: u.split(" "), tr, en, icon,
}));

export const stripTashkeel = (s: string) =>
  s.replace(/[\u064B-\u0652\u0670\u0640]/g, "").replace(/[أإآ]/g, "ا").replace(/\s+/g, "").trim();

export const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);
