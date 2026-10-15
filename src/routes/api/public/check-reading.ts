import { createFileRoute } from "@tanstack/react-router";
import { syllablesOf } from "@/lib/reading-sounds";
export { syllablesOf } from "@/lib/reading-sounds";

// Checks a learner's reading of ONE fully vocalised word, syllable by syllable
// (consonant + its exact short vowel), using an audio-capable model.
// Public because the app has no accounts; it only accepts a short recording and a short Arabic word.
const MAX_BYTES = 512 * 1024;
const MAX_MS = 6500;
// Web app (same origin) plus the native app shells.
const ORIGINS = new Set(["capacitor://localhost", "https://localhost", "http://localhost"]);
function cors(request: Request): Record<string, string> {
  const o = request.headers.get("origin") ?? "";
  return ORIGINS.has(o) ? { "Access-Control-Allow-Origin": o, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "content-type, x-qaf-device", Vary: "Origin" } : {};
}
function originAllowed(request: Request): boolean {
  const o = request.headers.get("origin");
  if (!o) return true; // native HTTP clients
  if (ORIGINS.has(o)) return true;
  try { return new URL(o).host === new URL(request.url).host; } catch { return false; }
}
async function sha(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, "0")).join("");
}
const LIMIT_MSG: Record<string, string> = {
  quota: "You've used your free pronunciation checks. Lessons and quizzes stay open.",
  daily: "You've reached today's pronunciation-check limit. Please try again tomorrow.",
  global: "The reading checker is resting for today. Please try again tomorrow.",
  paused: "The reading checker is paused. Lessons and quizzes stay open.",
};
const MODEL = "google/gemini-3.1-flash-lite";

const SYSTEM = `You are a strict Arabic reading teacher checking a beginner's pronunciation of ONE fully vocalised word.
Listen to the recording only. Do not assume the learner said the target word.
Step 1: write exactly what you hear, letter by letter, with the short vowel you actually heard on each letter (fatha a, kasra i, damma u, sukoon none).
Step 2: compare with the target, syllable by syllable. A syllable is correct only if BOTH the consonant and its short vowel match. Fatha (a), kasra (i) and damma (u) are different; any swap is wrong. A clearly lengthened vowel (aa, ii, uu) is wrong on a short-vowel syllable. A target syllable ending in alif (ا, e.g. بَا) is a long aa vowel: it is correct only if the aa is clearly held long, and a short a is wrong. Final ة with a vowel is read as t (ةُ = tu). Nunation is required ONLY when written: fathatan ً (مًا، بًا، ءً) must end in short an, NOT long aa, plain a, un or in. The supporting alif after fathatan is silent, not a separate sound. ةً is tan, not h, ta or tu. Adding nunation to a word without tanween is wrong. Dropping the final vowel or required n is wrong. An added or missing syllable is wrong.
Long-vowel rules: a consonant with damma followed by unvocalized و (حُو، تُو، فُو) is ONE long uu sound, not consonant + u + w. It is correct only when uu is held long; short u is wrong. A consonant with kasra followed by unvocalized ي is ONE long ii sound. Written صَا and حَا are long aa even inside a Madd Waw word. زَيْ and لَيْ are ONE ay diphthong, not a long ii or aa vowel; require the y glide. Sukoon sounds صْ and نْ have no added vowel and connect smoothly to the previous sound. Keep each target sound in the supplied order.
Tanween words retain internal Madd and sukoon. بَيْ is one ay glide. In ثَوْبًا the approved ثَ | وْ tiles connect as thaw, with no vowel after w. مَاءً and سَمَاءً end in a pronounced hamza plus an, after the long aa. دَوَاءً has the approved tiles دَ | وَ | اءً: the last tile carries the aa extension plus hamza-an (aa'an); judge it in context, never treat the initial alif as a new consonant. هَوَاءً is هَ | وَا | ءً. Return exactly one result per supplied tile in order.
Judge sounds, not transcription spelling: a heard phonetic رَنْ has exactly the same pronunciation as target رًا (ran), so mark it correct when the recording really contains short a plus n. Likewise مَنْ = مًا, تَنْ = ةً when t-an is actually heard. A transcription difference alone is not a pronunciation error. Still reject missing n, wrong vowels, or pausal aa.
Dammatan ٌ requires short u followed by n (un), never plain u, long uu, an, in or a pausal consonant. ةٌ is tun, not h, tu or tan. Phonetic دُنْ = دٌ, بُنْ = بٌ and تُنْ = ةٌ when those sounds are actually heard; spelling differences alone are not errors. In دَلْوٌ the final وٌ is wun with a consonant w, not a long uu extension. In مِرْآةٌ preserve مِ | رْ | آ | ةٌ: آ is a hamza onset plus long aa, followed by tun. ئْ and أْ are consonant-only hamza with no inserted vowel. Judge every supplied tile in context and retain internal Madd and sukoon.
Kasratan ٍ requires short i followed by n (in), never plain i, long ii, un, an or a pausal consonant. ةٍ is tin, not h, ti, tun or tan. Phonetic حِنْ = حٍ, بِنْ = بٍ and تِنْ = ةٍ when actually heard; spelling differences alone are not errors. In حِذَاءٍ retain حِ | ذَا | ءٍ, with long aa followed by consonant hamza plus in. In جَوْرَبٍ the supplied جَ | وْ tiles connect as jaw, with no inserted vowel after w. In مِئْزَرٍ retain consonant-only hamza ئْ. Keep internal long سَا، رَا، فَا، شَا، حَا، بُو، جَا as single held sounds, and judge each supplied tile in context. Never replace the approved word spelling with a more common alternative.
Shaddah ّ is a doubled consonant (gemination), not an extra vowel or separate syllable. Require audible held closure or friction, smoothly connected to the preceding sound, then the exact written vowel. A single consonant in place of a doubled one is wrong. Return ONE result for each supplied Shaddah tile: طَّ = tta, بُّ = bbu, لَّ = lla, دَّ = dda; بَّا، سَّا، رَّا، لَّا include gemination plus long aa, both required. Final طًّا = ttan, بًّا = bban, فًّا = ffan; final بٌّ = bbun, طٌّ = ttun; final طٍّ = ttin, فٍّ = ffin. Require both the doubled consonant AND exact short tanween ending an/un/in. A transcribed doubled consonant plus explicit نْ can be phonetically equivalent; do not reject only for spelling. Never accept missing gemination, missing n, wrong final vowel, or pausal pronunciation. In قِطَّةُ and بَطَّةُ preserve قِ/بَ | طَّ | ةُ and pronounce final tu; in مَجَلَّةُ preserve مَ | جَ | لَّ | ةُ. Judge every approved tile in context without splitting or replacing it.
Gemination comparison is bidirectional: a target WITHOUT shaddah requires a single consonant; adding a doubled held consonant is wrong even if its letter and vowel otherwise match. For example target بٌ (bun) is not equivalent to heard بٌّ (bbun). Check consonant duration for every tile, not just the letters and ending.
Ignore accent, speed and voice. If recording quality prevents hearing speech clearly, set heard to "" and every syllable incorrect.`;

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
      OPTIONS: async ({ request }) => new Response(null, { status: 204, headers: cors(request) }),
      POST: async ({ request }) => {
        const h = cors(request);
        const json = (b: unknown, status = 200) => Response.json(b, { status, headers: h });
        if (!originAllowed(request)) return json({ error: "Not allowed." }, 403);
        const device = request.headers.get("x-qaf-device") ?? "";
        if (!/^[a-f0-9-]{16,64}$/i.test(device)) return json({ error: "Please update the app and try again." }, 400);
        const len = Number(request.headers.get("content-length") ?? 0);
        if (len > MAX_BYTES + 64 * 1024) return json({ error: "Recording is too long." }, 413);
        let file: File | null = null;
        let expected = "";
        try {
          const fd = await request.formData();
          const v = fd.get("file");
          const e = fd.get("expected");
          const ms = Number(fd.get("durationMs"));
          if (!Number.isFinite(ms) || ms <= 0 || ms > MAX_MS) return json({ error: "Please keep each recording under 6 seconds." }, 413);
          file = v instanceof File ? v : null;
          if (typeof e === "string") expected = e.trim();
        } catch { /* invalid body */ }
        if (!file || !file.size || file.size > MAX_BYTES) return json({ error: "No usable recording." }, 400);
        if (!/^[\u0621-\u0652]{2,20}$/.test(expected)) return json({ error: "Unknown word." }, 400);
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return json({ error: "Reading check is not configured." }, 500);

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
          const { data: gate, error: gErr } = await supabaseAdmin.rpc("consume_check", { _device: await sha(device), _ip: await sha(ip) });
          if (gErr) throw gErr;
          const g = gate as { allowed: boolean; reason?: string };
          if (!g.allowed) return json({ error: LIMIT_MSG[g.reason ?? ""] ?? LIMIT_MSG["daily"], limit: g.reason }, 429);
        } catch (err) {
          console.error("check limit failed", err);
          return json({ error: "Reading check is unavailable right now. Please try again." }, 503);
        }

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
        if (!res) return json({ error: "Reading check failed. Please try again." }, 502);
        const text = await res.text();
        if (!res.ok) {
          const busy = res.status === 429;
          let message = busy ? "The reading checker is busy. Wait a moment, then try again." : "Reading check failed. Please try again.";
          if (!busy) try { message = (JSON.parse(text) as { message?: string }).message ?? message; } catch { /* keep default */ }
          return json({ error: message }, res.status);
        }
        try {
          const content = (JSON.parse(text) as { choices: { message: { content: string } }[] }).choices[0]?.message.content;
          if (!content) return json({ error: "Reading check returned no feedback. Please try again." }, 502);
          const j = JSON.parse(content) as { heard: string; syllables: { heard: string; correct: boolean }[] };
          const syllables = target.map((t, i) => ({ target: t, heard: j.syllables[i]?.heard ?? "", correct: !!j.syllables[i]?.correct }));
          const correct = j.syllables.length === target.length && syllables.every((s) => s.correct);
          return json({ correct, heard: j.heard, syllables });
        } catch {
          return json({ error: "Reading check failed. Please try again." }, 502);
        }
      },
    },
  },
});
