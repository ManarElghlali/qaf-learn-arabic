import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Ar } from "@/components/AppShell";
import { useProgress } from "@/lib/progress";
import { WORDS } from "@/lib/words";
import { Flame } from "lucide-react";
import castle from "@/assets/stages/castle.jpg";
import lighthouse from "@/assets/stages/lighthouse.jpg";
import garden from "@/assets/stages/garden.jpg";
import observatory from "@/assets/stages/observatory.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Qaf ق — Learn to read Arabic step by step" },
      { name: "description", content: "Learn Arabic reading starting with short sounds: 42 Fatha words with audio, quizzes and a reading test." },
      { property: "og:title", content: "Qaf ق — Learn to read Arabic" },
      { property: "og:description", content: "Step-by-step Arabic reading with audio, quizzes and pronunciation tests." },
    ],
  }),
  component: Home,
});

const stages = [
  { ar: "الحركات القصيرة", en: "Short Sounds", live: true, image: castle, landmark: "Castle", accent: "stage-sage" },
  { ar: "المدود", en: "Long Sounds", image: lighthouse, landmark: "Lighthouse", accent: "stage-sky" },
  { ar: "التنوين", en: "Tanween", image: garden, landmark: "Garden", accent: "stage-lavender" },
  { ar: "الشدة", en: "Shadda", image: observatory, landmark: "Observatory", accent: "stage-gold" },
];
const lessons = [
  { ar: "الفتحة", en: "Fatha", live: true },
  { ar: "الضمة", en: "Damma" },
  { ar: "الكسرة", en: "Kasra" },
  { ar: "السكون", en: "Sukun" },
];
const Soon = () => <span className="rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground"><Ar>قريبًا</Ar> · Coming Soon</span>;

function Home() {
  const p = useProgress();
  const pct = Math.round((p.learned.length / WORDS.length) * 100);
  return (
    <AppShell title="Qaf">
      <div className="mb-6 rounded-3xl bg-primary p-6 text-primary-foreground">
        <div className="flex items-start justify-between">
          <Ar className="text-6xl leading-none">ق</Ar>
          <span className="flex items-center gap-1 rounded-full bg-primary-foreground/15 px-3 py-1 text-sm"><Flame className="h-4 w-4" />{p.streak} day streak</span>
        </div>
        <p className="mt-4 text-sm opacity-80">Fatha progress</p>
        <div className="mt-2 h-2 rounded-full bg-primary-foreground/20"><div className="h-2 rounded-full bg-primary-foreground" style={{ width: `${pct}%` }} /></div>
        <p className="mt-2 text-sm">{p.learned.length} / {WORDS.length} words learned</p>
      </div>
      <h2 className="mb-3 font-semibold">Stages</h2>
      <div className="space-y-3">
        {stages.map((s) => (
          <div key={s.en} className={`rounded-2xl border border-border p-4 ${s.accent}`}>
            <div className="flex items-center gap-4">
              <img src={s.image} alt={`${s.landmark} illustration`} width={512} height={512} loading="lazy" className="h-24 w-24 shrink-0 rounded-xl object-cover sm:h-28 sm:w-28" />
              <div className="min-w-0"><Ar className="block text-xl">{s.ar}</Ar><span className="block text-sm text-muted-foreground">{s.en}</span>{!s.live && <div className="mt-2"><Soon /></div>}</div>
            </div>
            {s.live && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {lessons.map((l) => l.live ? (
                  <Link key={l.en} to="/learn" className="rounded-xl bg-accent p-3">
                    <Ar className="block text-lg">{l.ar} ـَ</Ar><span className="text-xs text-muted-foreground">{l.en} · 42 words</span>
                  </Link>
                ) : (
                  <div key={l.en} className="rounded-xl bg-muted/50 p-3 opacity-70">
                    <Ar className="block text-lg">{l.ar}</Ar><Soon />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
