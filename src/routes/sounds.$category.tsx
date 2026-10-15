import { useLanguage } from "@/lib/i18n";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell, Ar } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { LETTERS, SOUND_CATEGORIES, setComplete, setDone, useSoundProgress } from "@/lib/sound-practice";
import { ChevronLeft, LockKeyhole } from "lucide-react";
import { useAccess, canOpenSoundSet } from "@/lib/access";
import { useState } from "react";
import { Paywall } from "@/components/Paywall";

export const Route = createFileRoute("/sounds/$category")({
  loader: ({ params }) => { const c = SOUND_CATEGORIES.find((x) => x.id === params.category); if (!c) throw notFound(); return { id: c.id }; },
  head: ({ loaderData }) => {
    const c = SOUND_CATEGORIES.find((x) => x.id === loaderData?.id);
    const t = c ? `${t(c.en)} Sound Practice — Qaf ق` : "Sound Practice — Qaf ق";
    return { meta: [{ title: t }, { name: "description", content: `Practise ${c?.en ?? "Arabic"} sounds with all 28 letters.` }, { property: "og:title", content: t }, { property: "og:description", content: "Hear and repeat Arabic letter sounds." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] };
  },
  component: Category,
});

function Category() {
  const { t } = useLanguage();
  const { id } = Route.useLoaderData();
  const c = SOUND_CATEGORIES.find((x) => x.id === id)!;
  const sp = useSoundProgress();
  const access = useAccess();
  const [pay, setPay] = useState(false);
  const done = c.sets.filter((s) => setComplete(sp, s)).length;
  return (
    <AppShell title={t(c.en)}>
      <div className="mb-3 flex items-center justify-between"><Link to="/sounds" className="flex items-center gap-1 text-xs font-semibold text-primary"><ChevronLeft className="h-4 w-4" />{t("Sound Practice")}</Link><Ar className="text-2xl font-bold text-primary">{c.ar}</Ar></div>
      <div className="mb-4 flex items-center gap-2"><progress value={done} max={c.sets.length} aria-label={`${t(c.en)} progress`} className="qaf-progress h-1.5 flex-1" /><span className="text-xs text-muted-foreground">{done}/{c.sets.length}</span></div>
      <div className="grid grid-cols-2 gap-3">{c.sets.map((s) => {
        const n = setDone(sp, s);
        const status = n >= LETTERS.length ? t("Completed") : n > 0 ? `${n}/${LETTERS.length}` : t("Not started");
        return (
          <div key={s.id} className={`flex flex-col items-center gap-1 rounded-3xl border border-border p-3 text-center ${c.accent}`}>
            <Ar className="text-3xl font-bold text-primary">{s.sample}</Ar>
            <Ar className="text-sm font-bold">{s.ar}</Ar>
            <p className="text-[11px] font-semibold">{t(s.en)}</p>
            <p className="text-[10px] text-muted-foreground">{t(status)}</p>
            {canOpenSoundSet(s.id, access.premium)
              ? <Button asChild size="sm" variant="secondary" className="mt-1 w-full rounded-full"><Link to="/sounds/practice/$set" params={{ set: s.id }}>{n > 0 && n < LETTERS.length ? t("Continue") : n >= LETTERS.length ? t("Review") : t("Start")}</Link></Button>
              : <Button size="sm" variant="secondary" className="mt-1 w-full rounded-full" onClick={() => setPay(true)}><LockKeyhole className="h-3 w-3" />{t("Premium")}</Button>}
          </div>
        );
      })}</div>
      <Paywall open={pay} onClose={() => setPay(false)} reason="Free learners can practise the Fatha sounds. Every other sound set is part of Premium." />
    </AppShell>
  );
}
