import { createFileRoute } from "@tanstack/react-router";
import { syllablesOf } from "@/lib/reading-sounds";
import { readingResult } from "@/lib/reading-result";
import { cors as sharedCors, originAllowed, sha } from "@/lib/public-api.server";
import { LIMIT_MSG, LIMIT_STATUS, gatewayFailureOutcome, shouldRetryGateway, usageOf } from "@/lib/check-guard";
export { syllablesOf } from "@/lib/reading-sounds";

// Checks a learner's reading of ONE fully vocalised word, syllable by syllable
// (consonant + its exact short vowel), using an audio-capable model.
// Public because the app has no accounts. CORS/Origin only stop casual browser misuse; the real
// protection is server-side: begin_check (budget, kill switch, one active check per phone, quotas,
// idempotency on the exact recording) before the paid call and finish_check after it.
const MAX_BYTES = 512 * 1024;
const MAX_MS = 6500;
/** Abort the AI call after this long; the database treats a check as stuck after 45 s. */
const AI_TIMEOUT_MS = 20_000;
const cors = (request: Request) => sharedCors(request, "POST, OPTIONS");
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
type Admin = (typeof import("@/integrations/supabase/client.server"))["supabaseAdmin"];

async function settle(admin: Admin, requestId: string, outcome: "ok" | "failed" | "unknown", usage: { input: number; output: number } | null, result: unknown, failure: string | null) {
  // Nulls mean "usage not reported" (charge the reserved estimate) / "no saved answer".
  const args = { _request: requestId, _outcome: outcome, _input_tokens: usage?.input ?? null, _output_tokens: usage?.output ?? null, _result: result ?? null, _failure: failure };
  const { error } = await admin.rpc("finish_check_tokens", args as never);
  if (error) console.error("finish_check failed", error.message);
}

export const Route = createFileRoute("/api/public/check-reading")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => new Response(null, { status: 204, headers: cors(request) }),
      POST: async ({ request }) => {
        const h = { ...cors(request), "Cache-Control": "no-store" };
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

        const bytes = new Uint8Array(await file.arrayBuffer());
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const dev = await sha(device);
        // The exact recording identifies the request: a resend (double tap, network retry) replays the
        // saved answer instead of paying for a second evaluation.
        const audioHash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (x) => x.toString(16).padStart(2, "0")).join("");
        const requestId = await sha(`${dev}:${expected}:${audioHash}`);
        try {
          const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
          // Free devices may only check the 10 free Fatha words, even if the app is tampered with.
          const { FREE_WORD_TEXTS } = await import("@/lib/access");
          if (!FREE_WORD_TEXTS.includes(expected)) {
            const { data: st, error: sErr } = await supabaseAdmin.rpc("check_status", { _device: dev });
            if (sErr) throw sErr;
            if (!(st as { premium?: boolean }).premium) return json({ error: "This word is part of Qaf Premium.", limit: "premium_content" }, 403);
          }
          const { data: gate, error: gErr } = await supabaseAdmin.rpc("begin_check", { _request: requestId, _device: dev, _ip: await sha(ip), _word: expected });
          if (gErr) throw gErr;
          const g = gate as { allowed: boolean; reason?: string; result?: unknown };
          if (!g.allowed) {
            if (g.reason === "replay" && g.result) return json({ ...(g.result as object), replayed: true });
            const reason = g.reason ?? "daily";
            return json({ error: LIMIT_MSG[reason] ?? LIMIT_MSG["daily"], limit: reason }, LIMIT_STATUS[reason] ?? 429);
          }
        } catch (err) {
          console.error("check limit failed", err);
          return json({ error: "Reading check is unavailable right now. Please try again." }, 503);
        }

        const target = syllablesOf(expected);
        const data = btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""));
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

        // At most one replay, and only for a pre-execution rate limit (429). Ambiguous 5xx or timeouts are
        // never resent automatically because the first call may already have been billed.
        let res: Response | null = null;
        let text = "";
        const deadline = Date.now() + AI_TIMEOUT_MS;
        try {
          for (let attempt = 0; attempt < 2; attempt++) {
            const ctl = new AbortController();
            const timer = setTimeout(() => ctl.abort(), Math.max(1000, deadline - Date.now()));
            try {
              res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                method: "POST",
                headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
                body, signal: ctl.signal,
              });
              text = await res.text();
            } finally { clearTimeout(timer); }
            if (!shouldRetryGateway(res.status, attempt)) break;
            const ra = Number(res.headers.get("retry-after"));
            const wait = Math.min(Number.isFinite(ra) && ra > 0 ? ra * 1000 : 1500, 4000);
            if (Date.now() + wait > deadline - 3000) break;
            await sleep(wait);
          }
        } catch (err) {
          const timedOut = err instanceof Error && err.name === "AbortError";
          await settle(supabaseAdmin, requestId, "unknown", null, null, timedOut ? "timeout" : "network");
          return json({ error: timedOut ? "The reading checker took too long. Please try again." : "Reading check failed. Please try again." }, timedOut ? 504 : 502);
        }
        if (!res) {
          await settle(supabaseAdmin, requestId, "unknown", null, null, "no_response");
          return json({ error: "Reading check failed. Please try again." }, 502);
        }
        if (!res.ok) {
          const busy = res.status === 429;
          await settle(supabaseAdmin, requestId, gatewayFailureOutcome(res.status), null, null, `gateway_${res.status}`);
          console.error("AI gateway error", res.status, text.slice(0, 300));
          return json({ error: busy ? "The reading checker is busy. Wait a moment, then try again." : "Reading check failed. Please try again." }, busy ? 429 : 502);
        }
        let parsed: unknown = null;
        try { parsed = JSON.parse(text); } catch { /* handled below */ }
        const usage = usageOf(parsed);
        try {
          const content = (parsed as { choices: { message: { content: string } }[] }).choices[0]?.message.content;
          if (!content) throw new Error("empty");
          const j = JSON.parse(content) as { heard: string; syllables: { heard: string; correct: boolean }[] };
          const result = readingResult(target, j);
          await settle(supabaseAdmin, requestId, "ok", usage, result, null);
          return json(result);
        } catch {
          await settle(supabaseAdmin, requestId, "unknown", usage, null, "bad_output");
          return json({ error: "Reading check returned no feedback. Please try again." }, 502);
        }
      },
    },
  },
});
