type HeardTile = { heard?: string; correct?: boolean };

/** Missing/empty speech must never become a successful reading result. */
export function readingResult(target: string[], result: { heard?: string; syllables?: HeardTile[] }) {
  const spoken = typeof result.heard === "string" && /[\u0621-\u064A]/.test(result.heard);
  const tiles = Array.isArray(result.syllables) ? result.syllables : [];
  const syllables = target.map((t, i) => ({
    target: t,
    heard: typeof tiles[i]?.heard === "string" ? tiles[i].heard : "",
    correct: spoken && tiles[i]?.correct === true && /[\u0621-\u064A]/.test(tiles[i]?.heard ?? ""),
  }));
  return { correct: target.length > 0 && tiles.length === target.length && syllables.every((s) => s.correct), heard: result.heard ?? "", syllables };
}