import type { Word } from "@/lib/words";

// Literal approved bank. Sound boundaries are curriculum data, not inferred spelling.
const raw: [string, string, string, string][] = [
  ["قَلَمًا", "قَ لَ مًا", "qalaman", "A pen"],
  ["كِتَابًا", "كِ تَا بًا", "kitaaban", "A book"],
  ["بَابًا", "بَا بًا", "baaban", "A door"],
  ["وَلَدًا", "وَ لَ دًا", "waladan", "A boy"],
  ["رَجُلًا", "رَ جُ لًا", "rajulan", "A man"],
  ["جَبَلًا", "جَ بَ لًا", "jabalan", "A mountain"],
  ["بَيْتًا", "بَيْ تًا", "baytan", "A house"],
  ["نَهْرًا", "نَ هْ رًا", "nahran", "A river"],
  ["بَحْرًا", "بَ حْ رًا", "bahran", "A sea"],
  ["كَلْبًا", "كَ لْ بًا", "kalban", "A dog"],
  ["أَسَدًا", "أَ سَ دًا", "asadan", "A lion"],
  ["طَرِيقًا", "طَ رِي قًا", "tariiqan", "A road / path"],
  ["طَبِيبًا", "طَ بِي بًا", "tabiiban", "A doctor"],
  ["عَصِيرًا", "عَ صِي رًا", "'asiiran", "Juice"],
  ["صُنْدُوقًا", "صُ نْ دُو قًا", "sunduuqan", "A box"],
  ["قَمَرًا", "قَ مَ رًا", "qamaran", "A moon"],
  ["نَجْمًا", "نَ جْ مًا", "najman", "A star"],
  ["ثَوْبًا", "ثَ وْ بًا", "thawban", "A garment"],
  ["خُبْزًا", "خُ بْ زًا", "khubzan", "Bread"],
  ["زَهْرًا", "زَ هْ رًا", "zahran", "A flower"],
  ["مَدْرَسَةً", "مَ دْ رَ سَ ةً", "madrasatan", "A school"],
  ["شَجَرَةً", "شَ جَ رَ ةً", "shajaratan", "A tree"],
  ["سَاعَةً", "سَا عَ ةً", "saa'atan", "A clock / watch"],
  ["حَقِيبَةً", "حَ قِي بَ ةً", "haqiibatan", "A bag"],
  ["وَرَقًا", "وَ رَ قًا", "waraqan", "Paper"],
  ["بَصَلًا", "بَ صَ لًا", "basalan", "An onion"],
  ["مَاءً", "مَا ءً", "maa'an", "Water"],
  ["سَمَاءً", "سَ مَا ءً", "samaa'an", "Sky"],
  ["دَوَاءً", "دَ وَ اءً", "dawaa'an", "Medicine"],
  ["هَوَاءً", "هَ وَا ءً", "hawaa'an", "Air"],
];

export const TANWEEN_FATH_WORDS: Word[] = raw.map(([ar, units, tr, en], i) => ({
  id: 701 + i, ar, units: units.split(" "), tr, en,
}));