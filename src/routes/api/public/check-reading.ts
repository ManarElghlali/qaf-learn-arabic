import { createFileRoute } from "@tanstack/react-router";

// Checks a learner's reading of ONE fully vocalised word, syllable by syllable
// (consonant + its exact short vowel), using an audio-capable model.
// Public because the app has no accounts; it only accepts a short recording and a short Arabic word.
const MAX_BYTES = 2 * 1024 * 1024;
const MODEL = "google/gemini-3.1-flash-lite";

const SYSTEM = `You are a strict Arabic reading teacher checking a beginner's pronunciation of ONE fully vocalised word.
Listen to the recording only. Do not assume the learner said the target word.
Step 1: write exactly what you hear, letter by letter, with the short vowel you actually heard on each letter (fatha a, kasra i, damma u, sukoon none).
Step 2: compare with the target, syllable by syllable. A syllable is correct only if BOTH the consonant and its short vowel match. Fatha (a), kasra (i) and damma (u) are different; any swap is wrong. A clearly lengthened vowel (aa, ii, uu) is wrong. Adding nunation (an, in, un) to the last syllable is wrong. Dropping the final vowel is wrong. An added or missing syllable is wrong.
Ignore accent, speed, voice and recording quality. If you hear no clear speech, set heard to "" and every syllable incorrect.`;

const SCHEMA = {
  type: "object", additionalProperties: false, required: ["heard", "syllables"],
  properties: {
    heard: { type: "string", description: "What was actually said, in Arabic letters with full tashkeel" },
    syllables: {
      type: "array",
      items: {
        type: "object", additionalProperties: false, required: ["target", "heard", "correct"],
        properties: { target: { type: "string" }, heard: { type: "string" }, correct: { type: "boolean" } },
      },
    },
  },
};

export const syllablesOf = (w: string) => w.match(/[^\u064B-\u0652]+[\u064B-\u0652]+/g) ?? [w];

function formatOf(mime: string): string {
  const m = mime.toLowerCase();
  if (m.includes("mp4") || m.includes("m4a") || m.includes("aac")) return "m4a";
  if (m.includes("ogg")) return "ogg";
  if (m.includes("wav")) return "wav";
  if (m.includes("mpeg") || m.includes("mp3")) return "mp3";
  return "webm";
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const Route = createFileRoute("/api/public/check-reading")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const len = Number(request.headers.get("content-length") ?? 0);
        if (len > MAX_BYTES + 64 * 1024) return Response.json({ error: "Recording is too long." }, { status: 413 });
        let file: File | null = null;
        let expected = "";
        try {
          const fd = await request.formData();
          const v = fd.get("file");
          const e = fd.get("expected");
          file = v instanceof File ? v : null;
          if (typeof e === "string") expected = e.trim();
        } catch { /* invalid body */ }
        if (!file || !file.size || file.size > MAX_BYTES) return Response.json({ error: "No usable recording." }, { status: 400 });
        if (!/^[\u0621-\u0652]{2,20}$/.test(expected)) return Response.json({ error: "Unknown word." }, { status: 400 });
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return Response.json({ error: "Reading check is not configured." }, { status: 500 });

        const target = syllablesOf(expected);
        const data = btoa(Array.from(new Uint8Array(await file.arrayBuffer()), (b) => String.fromCharCode(b)).join(""));
        const body = JSON.stringify({
          model: MODEL,
          reasoning_effort: "minimal",
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: [
              { type: "text", text: `Target word: ${expected}\nTarget syllables in order: ${target.join(" | ")}` },
              { type: "input_audio", input_audio: { data, format: formatOf(file.type) } },
            ] },
          ],
          response_format: { type: "json_schema", json_schema: { name: "reading_check", strict: true, schema: SCHEMA } },
        });

        // One bounded, delayed retry for busy (429) or transient (5xx) responses.
        let res: Response | null = null;
        for (let attempt = 0; attempt < 2; attempt++) {
          res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
            body,
          });
          if (res.ok || attempt === 1 || !(res.status === 429 || res.status >= 500)) break;
          const ra = Number(res.headers.get("retry-after"));
          await sleep(Math.min(Number.isFinite(ra) && ra > 0 ? ra * 1000 : 1500, 4000));
        }
        const text = await res!.text();
        if (!res!.ok) {
          const busy = res!.status === 429;
          let message = busy ? "The reading checker is busy. Wait a moment, then try again." : "Reading check failed. Please try again.";
          if (!busy) try { message = (JSON.parse(text) as { message?: string }).message ?? message; } catch { /* keep default */ }
          return Response.json({ error: message }, { status: res!.status });
        }
        try {
          const content = (JSON.parse(text) as { choices: { message: { content: string } }[] }).choices[0]!.message.content;
          const j = JSON.parse(content) as { heard: string; syllables: { heard: string; correct: boolean }[] };
          const syllables = target.map((t, i) => ({ target: t, heard: j.syllables[i]?.heard ?? "", correct: !!j.syllables[i]?.correct }));
          const correct = j.syllables.length === target.length && syllables.every((s) => s.correct);
          return Response.json({ correct, heard: j.heard, syllables });
        } catch {
          return Response.json({ error: "Reading check failed. Please try again." }, { status: 502 });
        }
      },
    },
  },
});
