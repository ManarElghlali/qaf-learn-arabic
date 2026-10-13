import type { Word } from "@/lib/words";

// Approved Madd Waw bank: spelling and segmentation are literal curriculum data.
const raw: [string, string, string, string][] = [
  ["حُوتُ", "حُو تُ", "huutu", "Whale"],
  ["ثُومُ", "ثُو مُ", "thuumu", "Garlic"],
  ["سُورُ", "سُو رُ", "suuru", "Wall"],
  ["نُورُ", "نُو رُ", "nuuru", "Light"],
  ["سُوقُ", "سُو قُ", "suuqu", "Market"],
  ["كُوبُ", "كُو بُ", "kuubu", "Cup / Mug"],
  ["تُوتُ", "تُو تُ", "tuutu", "Mulberries"],
  ["عُودُ", "عُو دُ", "'uudu", "Oud / Wood"],
  ["صُوفُ", "صُو فُ", "suufu", "Wool"],
  ["فُولُ", "فُو لُ", "fuulu", "Fava beans"],
  ["زُهُورُ", "زُ هُو رُ", "zuhuuru", "Flowers"],
  ["طُيُورُ", "طُ يُو رُ", "tuyuuru", "Birds"],
  ["نُجُومُ", "نُ جُو مُ", "nujuumu", "Stars"],
  ["عُصْفُورُ", "عُ صْ فُو رُ", "'usfuuru", "Sparrow"],
  ["صُنْدُوقُ", "صُ نْ دُو قُ", "sunduuqu", "Box"],
  ["قُرُودُ", "قُ رُو دُ", "quruudu", "Monkeys"],
  ["قُبُورُ", "قُ بُو رُ", "qubuuru", "Graves"],
  ["عُلُومُ", "عُ لُو مُ", "'uluumu", "Sciences"],
  ["جُسُورُ", "جُ سُو رُ", "jusuuru", "Bridges"],
  ["شُمُوعُ", "شُ مُو عُ", "shumuu'u", "Candles"],
  ["صُوصُ", "صُو صُ", "suusu", "Chick / Baby bird"],
  ["خَرُوفُ", "خَ رُو فُ", "kharuufu", "Sheep / Lamb"],
  ["زَيْتُونُ", "زَيْ تُو نُ", "zaytuunu", "Olives"],
  ["صَابُونُ", "صَا بُو نُ", "saabuunu", "Soap"],
  ["لَيْمُونُ", "لَيْ مُو نُ", "laymuunu", "Lemon"],
  ["حَاسُوبُ", "حَا سُو بُ", "haasuubu", "Computer"],
];

export const WAW_WORDS: Word[] = raw.map(([ar, units, tr, en], i) => ({ id: 501 + i, ar, units: units.split(" "), tr, en }));