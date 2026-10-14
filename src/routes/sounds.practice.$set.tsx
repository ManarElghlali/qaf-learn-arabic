import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell, Ar } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { findSet, markPracticed, resetSet, setItems, useSoundProgress } from "@/lib/sound-practice";
import { playUnits, preloadAudio, stopAudio } from "@/lib/audio";
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
  const { category, set } = findSet(id)!;
  const items = setItems(set);
  const sp = useSoundProgress();
  const [i, setI] = useState(0);
  const [finished, setFinished] = useState(false);
  const started = useRef(false);
  useEffect(() => { if (!started.current) { started.current = true; const n = (sp[id] ?? []).length; if (n > 0 && n < items.length) setI(n); } }, [sp, id, items.length]);
  useEffect(() => () => stopAudio(), []);
  const item = items[i]!;
  useEffect(() => { preloadAudio("u", items.slice(i, i + 3).flatMap((x) => x.units)); }, [i, items]);
  const hear = () => { playUnits(item.units); markPracticed(id, i); };
  const go = (n: number) => { stopAudio(); markPracticed(id, i); if (n >= items.length) { setFinished(true); return; } setI(Math.max(0, n)); };
  const strip = items.map((_, k) => k).filter((k) => Math.abs(k - i) <= 2 || (i < 2 && k < 5) || (i > items.length - 3 && k >= items.length - 5));
  return (
    <AppShell title={set.en} singleScreen>
      <div className="flex h-full flex-col gap-3">
        <div className="flex items-center justify-between"><Link to="/sounds/$category" params={{ category: category.id }} className="flex items-center gap-1 text-xs font-semibold text-primary"><ChevronLeft className="h-4 w-4" />{category.en}</Link><Ar className="text-xl font-bold text-primary">{set.ar}</Ar><span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-primary">{i + 1} of {items.length}</span></div>
        <progress value={finished ? items.length : i} max={items.length} aria-label="Lesson progress" className="qaf-progress h-1.5 w-full" />
        {finished ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <CheckCircle2 className="h-14 w-14 text-success" />
            <h2 className="text-lg font-bold text-primary">Lesson Complete!</h2><p className="text-sm text-muted-foreground">Great job! You practised all {items.length} letters.</p>
            <Button variant="outline" className="w-full rounded-full" onClick={() => { resetSet(id); setI(0); setFinished(false); }}><RotateCcw />Practice Again</Button>
            <Button asChild className="w-full rounded-full"><Link to="/sounds/$category" params={{ category: category.id }}>Continue<ChevronRight /></Link></Button>
          </div>
        ) : <>
          <button type="button" onClick={hear} aria-label={`Hear ${item.units.join(" ")}`} className={`grid flex-1 min-h-32 place-items-center rounded-3xl border border-border ${category.accent}`}>
            <Ar className="text-7xl font-bold leading-normal text-primary">{item.units.join(" ")}</Ar>
          </button>
          <div className="flex flex-col items-center gap-1"><Button size="icon" onClick={hear} aria-label="Hear sound" className="h-16 w-16 rounded-full"><Volume2 className="!h-7 !w-7" /></Button><span className="text-sm font-semibold text-primary">Hear Sound</span><p className="text-[11px] text-muted-foreground">Listen, then say it out loud.</p></div>
          <div className="grid grid-cols-2 gap-3"><Button variant="outline" className="h-12 rounded-full" disabled={i === 0} onClick={() => go(i - 1)}><ChevronLeft />Previous</Button><Button className="h-12 rounded-full" onClick={() => go(i + 1)}>{i === items.length - 1 ? "Finish" : "Next"}<ChevronRight /></Button></div>
          <div dir="rtl" className="flex justify-center gap-2">{strip.map((k) => (
            <button key={k} type="button" onClick={() => { stopAudio(); setI(k); }} aria-label={`Letter ${items[k]!.letter}`} aria-current={k === i}
              className={`grid h-10 w-10 place-items-center rounded-full border font-arabic text-lg ${k === i ? "border-primary bg-primary text-primary-foreground" : (sp[id] ?? []).includes(k) ? "border-success bg-success-soft" : "border-border"}`}>{items[k]!.letter}</button>
          ))}</div>
        </>}
      </div>
    </AppShell>
  );
}
