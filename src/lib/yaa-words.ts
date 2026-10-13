import type { Word } from "@/lib/words";

// Literal approved Madd Yā curriculum; long ii is always one sound unit.
const raw: [string, string, string, string][] = [
  ["فِيلُ", "فِي لُ", "fiilu", "Elephant"],
  ["تِينُ", "تِي نُ", "tiinu", "Figs"],
  ["حَلِيبُ", "حَ لِي بُ", "haliibu", "Milk"],
  ["طَبِيبُ", "طَ بِي بُ", "tabiibu", "Doctor"],
  ["صَدِيقُ", "صَ دِي قُ", "sadiiqu", "Friend"],
  ["قَمِيصُ", "قَ مِي صُ", "qamiisu", "Shirt"],
  ["سَرِيرُ", "سَ رِي رُ", "sariiru", "Bed"],
  ["عَصِيرُ", "عَ صِي رُ", "'asiiru", "Juice"],
  ["أَمِيرُ", "أَ مِي رُ", "amiiru", "Prince"],
  ["رَغِيفُ", "رَ غِي فُ", "raghiifu", "Loaf of bread"],
  ["نَخِيلُ", "نَ خِي لُ", "nakhiilu", "Palm trees"],
  ["طَرِيقُ", "طَ رِي قُ", "tariiqu", "Road / Path"],
  ["حَدِيقَةُ", "حَ دِي قَ ةُ", "hadiiqatu", "Garden / Park"],
  ["سَفِينَةُ", "سَ فِي نَ ةُ", "safiinatu", "Ship"],
  ["قَرِيبُ", "قَ رِي بُ", "qariibu", "Relative / Near"],
  ["نَشِيدُ", "نَ شِي دُ", "nashiidu", "Anthem / Song"],
  ["بَرِيدُ", "بَ رِي دُ", "bariidu", "Mail / Post"],
  ["كَبِيرُ", "كَ بِي رُ", "kabiiru", "Big / Large"],
  ["صَغِيرُ", "صَ غِي رُ", "saghiiru", "Small / Young"],
  ["جَمِيلُ", "جَ مِي لُ", "jamiilu", "Beautiful"],
  ["قَصِيرُ", "قَ صِي رُ", "qasiiru", "Short"],
  ["طَوِيلُ", "طَ وِي لُ", "tawiilu", "Tall / Long"],
  ["لَطِيفُ", "لَ طِي فُ", "latiifu", "Kind / Gentle"],
  ["سَرِيعُ", "سَ رِي عُ", "sarii'u", "Fast / Quick"],
  ["نَظِيفُ", "نَ ظِي فُ", "naziifu", "Clean"],
];

export const YAA_WORDS: Word[] = raw.map(([ar, units, tr, en], i) => ({
  id: 601 + i, ar, units: units.split(" "), tr, en,
}));