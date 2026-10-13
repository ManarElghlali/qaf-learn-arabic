import type { Word } from "@/lib/words";

// Literal approved curriculum: retain every vowel mark and grouped Madd tile.
const raw: [string, string, string, string][] = [
  ["تِمْسَاحٍ", "تِ مْ سَا حٍ", "timsaahin", "A crocodile"],
  ["غُرَابٍ", "غُ رَا بٍ", "ghuraabin", "A crow"],
  ["سُلَحْفَاةٍ", "سُ لَ حْ فَا ةٍ", "sulahfaatin", "A turtle"],
  ["نَحْلَةٍ", "نَ حْ لَ ةٍ", "nahlatin", "A bee"],
  ["نَمْلَةٍ", "نَ مْ لَ ةٍ", "namlatin", "An ant"],
  ["عَنْكَبُوتٍ", "عَ نْ كَ بُو تٍ", "'ankabuutin", "A spider"],
  ["شَاحِنَةٍ", "شَا حِ نَ ةٍ", "shaahinatin", "A truck"],
  ["حَافِلَةٍ", "حَا فِ لَ ةٍ", "haafilatin", "A bus"],
  ["مَطْبَخٍ", "مَ طْ بَ خٍ", "matbakhin", "A kitchen"],
  ["مَلْعَبٍ", "مَ لْ عَ بٍ", "mal'abin", "A playground / stadium"],
  ["حِذَاءٍ", "حِ ذَا ءٍ", "hidhaa'in", "A shoe"],
  ["جَوْرَبٍ", "جَ وْ رَ بٍ", "jawrabin", "A sock"],
  ["مِئْزَرٍ", "مِ ئْ زَ رٍ", "mi'zarin", "An apron"],
  ["مِرْسَمٍ", "مِ رْ سَ مٍ", "mirsamin", "An art studio"],
  ["مِبْرَاةٍ", "مِ بْ رَا ةٍ", "mibraatin", "A pencil sharpener"],
  ["مِرْوَحَةٍ", "مِ رْ وَ حَ ةٍ", "mirwahatin", "A fan"],
  ["صَحْنٍ", "صَ حْ نٍ", "sahnin", "A plate"],
  ["مِلْعَقَةٍ", "مِ لْ عَ قَ ةٍ", "mil'aqatin", "A spoon"],
  ["فِنْجَانٍ", "فِ نْ جَا نٍ", "finjaanin", "A cup"],
  ["مِصْعَدٍ", "مِ صْ عَ دٍ", "mis'adin", "An elevator"],
];

export const TANWEEN_KASR_WORDS: Word[] = raw.map(([ar, units, tr, en], i) => ({
  id: 901 + i, ar, units: units.split(" "), tr, en,
}));