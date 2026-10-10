import type { Word } from "@/lib/words";
import { WORD_ILLUSTRATIONS } from "@/lib/illustrations";
import { cn } from "@/lib/utils";

export function WordIllustration({ word, className }: { word: Word; className?: string }) {
  return (
    <img
      src={WORD_ILLUSTRATIONS[word.id]}
      alt={word.en}
      width={384}
      height={384}
      decoding="async"
      className={cn("mx-auto aspect-square w-48 max-w-full rounded-2xl border border-border object-cover", className)}
    />
  );
}