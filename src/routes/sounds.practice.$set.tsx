import { createFileRoute, Link, notFound, useHydrated } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell, Ar } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { findSet, markPracticed, resetSet, setItems, useSoundProgress } from "@/lib/sound-practice";
import { playUnits, preloadAudio, stopAudio } from "@/lib/audio";
import { useAccess, canOpenSoundSet } from "@/lib/access";
import { useLanguage } from "@/lib/i18n";
import { PremiumLocked } from "@/components/PremiumLock";
import { CheckCircle2, ChevronLeft, ChevronRight, RotateCcw, Volume2 } from "lucide-react";

export const Route = createFileRoute("/sounds/practice/$set")({
  loader: ({ params }) => { if (!findSet(params.set)) throw notFound(); return { id: params.set }; },
  head: ({ loaderData }) => {
    const f = loaderData ? findSet(loaderData.id) : null;
    const t = f ? `${f.set.en} — Sound Practice — Qaf ق` : "Sound Practice — Qaf ق";
    return { meta: [{ title: t }, { name: "description", content: `Hear and repeat ${f?.set.en ?? "Arabic"} with every letter.` }, { property: "og:title", content: t }, { property: "og:description", content: "Listen, repeat, and move to the next letter." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] };
  },
  component: Practice,
});
function Practice() {
  const { id } = Route.useLoaderData();
  const access = useAccess();
  const hydrated = useHydrated();
  if (!hydrated || !access.loaded) return <AppShell title="Sound Practice"><div className="h-96" aria-busy="true" /></AppShell>;
  if (!canOpenSoundSet(id, access.premium)) return <AppShell title="Sound Practice"><PremiumLocked what="This sound set" /></AppShell>;
  return <PracticeSet id={id} />;
}
function PracticeSet({ id }: { id: string }) {
  const { t } = useLanguage();
  const found = findSet(id);
  const items = useMemo(() => found ? setItems(found.set) : [], [id]);
  const sp = useSoundProgress();
  const [i, setI] = useState(0);
  const [finished, setFinished] = useState(false);
  const started = useRef(false);
  useEffect(() => { const saved = sp[id]; if (!started.current && saved) { started.current = true; const next = items.findIndex((_, k) => !saved.includes(k)); setI(next < 0 ? 0 : next); } }, [sp, id, items]);
  useEffect(() => () => stopAudio(), []);
  const pageStart = Math.floor(i / 9) * 9;
  useEffect(() => { preloadAudio("u", items.slice(pageStart, pageStart + 9).flatMap((x) => x.units)); }, [pageStart, items]);
  if (!found || !items[i]) return null;
  const { category, set } = found;
  const hear = (k: number) => { const item = items[k]; if (!item) return; stopAudio(); setI(k); playUnits(item.units); markPracticed(id, k); };
  const go = (n: number) => { stopAudio(); markPracticed(id, i); if (n >= items.length) { setFinished(true); return; } setI(Math.max(0, n)); };
  const done = Math.min((sp[id] ?? []).length, items.length);
  return (
    <AppShell title="Sound Practice" singleScreen>
      <div className="sound-practice flex min-h-0 flex-1 flex-col gap-3">
        <p className="text-sm text-muted-foreground">{t("Practise individual letter sounds")}</p>
        <div className="flex items-center justify-between gap-2">
          <Button asChild variant="link" className="h-9 px-0 text-xs"><Link to="/sounds/$category" params={{ category: category.id }}><ChevronLeft />{t(set.en)}</Link></Button>
          <span className="text-xs text-muted-foreground">{done}/{items.length}</span>
        </div>
        <progress value={done} max={items.length} aria-label={t("Lesson progress")} className="qaf-progress h-1.5 w-full shrink-0" />
        {finished ? <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <CheckCircle2 className="h-14 w-14 text-success" /><h2 className="text-xl font-bold">{t("Lesson Complete!")}</h2>
          <p className="text-sm text-muted-foreground">{t("Great job! You practised all {total} letters.", { total: items.length })}</p>
          <Button variant="outline" className="w-full" onClick={() => { resetSet(id); setI(0); setFinished(false); }}><RotateCcw />{t("Practice Again")}</Button>
          <Button asChild className="w-full"><Link to="/sounds/$category" params={{ category: category.id }}>{t("Continue")}<ChevronRight /></Link></Button>
        </div> : <>
          <div dir="ltr" className="sound-letter-grid grid min-h-0 flex-1 grid-cols-3 grid-rows-3 gap-3" aria-label={t("Sound choices")}>
            {Array.from({ length: 9 }, (_, offset) => { const k = pageStart + offset; const item = items[k]; if (!item) return <div key={k} />;
              return <Button key={k} variant="outline" aria-label={t("Hear {sound}", { sound: item.units.join(" ") })} aria-pressed={k === i} onClick={() => hear(k)} className={`sound-letter-tile relative flex h-full min-h-0 w-full flex-col gap-2 rounded-2xl p-2 text-primary ${k === i ? "border-primary bg-accent" : "border-border bg-card"}`}>
                <Ar className={`font-bold ${item.units.length > 1 ? "text-xl" : "text-4xl"}`}>{item.units.join(" ")}</Ar>
                <Volume2 className="h-4 w-4" />
                {(sp[id] ?? []).includes(k) && <CheckCircle2 className="absolute end-2 top-2 h-3 w-3 text-success" />}
              </Button>;
            })}
          </div>
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground"><span>{t("Letter {current} of {total}", { current: i + 1, total: items.length })}</span><Button variant="ghost" size="sm" onClick={() => hear(i)}><Volume2 />{t("Hear Sound")}</Button></div>
          <div className="grid shrink-0 grid-cols-2 gap-3"><Button variant="outline" className="h-12" disabled={i === 0} onClick={() => go(i - 1)}><ChevronLeft />{t("Previous")}</Button><Button className="h-12" onClick={() => go(i + 1)}>{t(i === items.length - 1 ? "Finish" : "Next")}<ChevronRight /></Button></div>
        </>}
      </div>
    </AppShell>
  );
}
