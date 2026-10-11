import { createFileRoute } from "@tanstack/react-router";

// Transcribes a learner's short reading-test recording (one Arabic word).
// Public because the app has no accounts; it only accepts small audio files and returns text.
const MAX_BYTES = 2 * 1024 * 1024;

export const Route = createFileRoute("/api/public/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const len = Number(request.headers.get("content-length") ?? 0);
        if (len > MAX_BYTES + 64 * 1024) return Response.json({ error: "Recording is too long." }, { status: 413 });
        let file: File | null = null;
        try {
          const v = (await request.formData()).get("file");
          file = v instanceof File ? v : null;
        } catch { /* invalid body */ }
        if (!file || !file.size || file.size > MAX_BYTES) return Response.json({ error: "No usable recording." }, { status: 400 });
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return Response.json({ error: "Speech checking is not configured." }, { status: 500 });

        const form = new FormData();
        form.append("model", "openai/gpt-transcribe");
        form.append("file", new File([file], "reading.webm", { type: file.type.startsWith("audio/") ? file.type : "audio/webm" }));
        form.append("response_format", "json");
        form.append("languages", "ar");
        form.append("prompt", "A beginner reading one fully vocalised Arabic word aloud.");
        const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
          body: form,
        });
        const body = await res.text();
        if (!res.ok) {
          let message = "Speech checking failed. Please try again.";
          try { message = (JSON.parse(body) as { message?: string }).message ?? message; } catch { /* keep default */ }
          return Response.json({ error: message }, { status: res.status });
        }
        const text = (JSON.parse(body) as { text?: string }).text ?? "";
        return Response.json({ text });
      },
    },
  },
});
