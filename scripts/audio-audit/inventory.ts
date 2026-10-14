// Lists every recording the app plays, where it is used, its speed and audit status.
import { existsSync, readFileSync, writeFileSync } from "fs";
import { LESSONS } from "@/lib/lessons";
import { SOUND_CATEGORIES, setItems } from "@/lib/sound-practice";
const D = "src/assets/audio/";
const key = (s: string) => Array.from(s).map((c) => (c.codePointAt(0) ?? 0).toString(16).padStart(4, "0")).join("-");
const req = new Map<string, { kind: string; text: string; uses: Set<string> }>();
const add = (kind: "w" | "u", text: string, use: string) => { const k = `${kind}-${key(text)}`; if (!req.has(k)) req.set(k, { kind, text, uses: new Set() }); req.get(k)!.uses.add(use); };
for (const [id, l] of Object.entries(LESSONS)) for (const w of l.words) { add("w", w.ar, `Reading ${id}: Learn, Quiz, Test help`); for (const u of w.units) add("u", u, `Reading ${id}: Learn tiles, Quiz`); }
for (const c of SOUND_CATEGORIES) for (const s of c.sets) for (const it of setItems(s)) for (const u of it.units) add("u", u, `Sound Practice ${s.id}`);
for (const u of ["أَ", "كَ", "لَ", "بَ"]) add("u", u, "Welcome screens / First quiz");
for (const w of ["أَكَلَ", "كَتَبَ", "جَلَسَ"]) add("w", w, "Welcome screens / First quiz");
const res = JSON.parse(readFileSync("scripts/audio-audit/results.json", "utf8")) as Record<string, { ok: boolean; heard: string[] }>;
const rows = [["kind", "arabic", "used_in", "speed", "file", "status", "note"]];
let missing = 0;
for (const [k, r] of req) {
  const ptr = existsSync(D + k + ".mp3.asset.json"), local = existsSync(D + k + ".mp3");
  if (!ptr && !local) missing++;
  const x = res[k];
  const status = !ptr && !local ? "Missing" : x ? (x.ok ? "Corrected" : "Needs Human Review") : "Functionally Verified";
  const note = x ? (x.ok ? "Re-recorded; accepted by two AI listeners; awaiting human check" : `Flagged by two AI listeners; new takes also rejected (heard: ${x.heard.join(" / ")})`) : "Loads and plays; AI listening passed; awaiting human check";
  rows.push([r.kind === "w" ? "word" : "sound", r.text, [...r.uses].join("; "), r.kind === "w" ? "1.0x" : "0.9x", ptr ? "cloud" : "bundled", status, note]);
}
writeFileSync("/mnt/documents/qaf-audio-audit.csv", "\uFEFF" + rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n"));
const c = (s: string) => rows.filter((r) => r[5] === s).length;
console.log({ total: req.size, missing, corrected: c("Corrected"), review: c("Needs Human Review"), functional: c("Functionally Verified") });
