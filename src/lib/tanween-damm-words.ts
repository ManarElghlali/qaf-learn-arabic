import type { Word } from "@/lib/words";

// Literal approved bank; preserve the standalone آ tile and all vowel marks.
const raw: [string, string, string, string][] = [
  ["قِرْدٌ", "قِ رْ دٌ", "qirdun", "A monkey"],
  ["ذِئْبٌ", "ذِ ئْ بٌ", "dhi'bun", "A wolf"],
  ["ثَعْلَبٌ", "ثَ عْ لَ بٌ", "tha'labun", "A fox"],
  ["أَرْنَبٌ", "أَ رْ نَ بٌ", "arnabun", "A rabbit"],
  ["مِفْتَاحٌ", "مِ فْ تَا حٌ", "miftaahun", "A key"],
  ["مِكْنَسَةٌ", "مِ كْ نَ سَ ةٌ", "miknasatun", "A broom"],
  ["وِسَادَةٌ", "وِ سَا دَ ةٌ", "wisaadatun", "A pillow"],
  ["مِرْآةٌ", "مِ رْ آ ةٌ", "mir'aatun", "A mirror"],
  ["مِنْشَفَةٌ", "مِ نْ شَ فَ ةٌ", "minshafatun", "A towel"],
  ["دَلْوٌ", "دَ لْ وٌ", "dalwun", "A bucket"],
  ["غُرْفَةٌ", "غُ رْ فَ ةٌ", "ghurfatun", "A room"],
  ["نَافِذَةٌ", "نَا فِ ذَ ةٌ", "naafidhatun", "A window"],
  ["تِلْفَازٌ", "تِ لْ فَا زٌ", "tilfaazun", "A television"],
  ["طَاوِلَةٌ", "طَا وِ لَ ةٌ", "taawilatun", "A table"],
  ["كَأْسٌ", "كَ أْ سٌ", "ka'sun", "A cup / glass"],
  ["مِصْبَاحٌ", "مِ صْ بَا حٌ", "misbaahun", "A lamp"],
  ["مَكْتَبَةٌ", "مَ كْ تَ بَ ةٌ", "maktabatun", "A library / bookcase"],
  ["صُورَةٌ", "صُو رَ ةٌ", "suuratun", "A picture / photo"],
];

export const TANWEEN_DAMM_WORDS: Word[] = raw.map(([ar, units, tr, en], i) => ({
  id: 801 + i, ar, units: units.split(" "), tr, en,
}));