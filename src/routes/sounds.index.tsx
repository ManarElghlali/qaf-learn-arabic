import { useLanguage } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Ar } from "@/components/AppShell";
import { LETTERS, SOUND_CATEGORIES, setComplete, setDone, useSoundProgress } from "@/lib/sound-practice";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/sounds/")({
  head: () => ({ meta: [
    { title: "Sound Practice — Qaf ق" },
    { name: "description", content: "Practise every Arabic letter with short vowels, long sounds, tanween and shaddah." },
    { property: "og:title", content: "Sound Practice — Qaf ق" },
    { property: "og:description", content: "Hear and repeat individual Arabic letter sounds." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Sounds,
});

function Sounds() {
  const { t } = useLanguage();
  const sp = useSoundProgress();
  const all = SOUND_CATEGORIES.flatMap((c) => c.sets);
  const pct = Math.round(all.reduce((n, s) => n + Math.min(setDone(sp, s), LETTERS.length), 0) / (all.length * LETTERS.length) * 100);
  return (
    <AppShell title={t("Sound Practice")}>
      <Ar className="mb-3 block text-center text-2xl font-bold text-primary">صَوْتِي</Ar>
      <div className="mb-4 rounded-2xl border border-border p-3"><div className="mb-1 flex justify-between text-xs font-semibold"><span>{t("Overall Progress")}</span><span>{pct}%</span></div><progress value={pct} max={100} aria-label={t("Overall progress")} className="qaf-progress h-1.5 w-full" /></div>
      <div className="space-y-3">{SOUND_CATEGORIES.map((c) => (
        <Link key={c.id} to="/sounds/$category" params={{ category: c.id }} className={`flex items-center gap-4 rounded-3xl border border-border p-4 ${c.accent}`}>
          <Ar className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-background text-3xl font-bold text-primary">{c.mark}</Ar>
          <span className="min-w-0 flex-1"><span className="block text-sm font-bold">{t(c.en)}</span><Ar className="block text-xl font-bold text-primary">{c.ar}</Ar><span className="block text-[11px] text-muted-foreground">{c.sets.length} lessons · {c.sets.filter((s) => setComplete(sp, s)).length}/{c.sets.length}</span></span>
          <ChevronRight className="h-5 w-5 text-primary" />
        </Link>
      ))}</div>
    </AppShell>
  );
}
