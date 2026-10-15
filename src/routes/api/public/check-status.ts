import { createFileRoute } from "@tanstack/react-router";
import { cors, deviceHeader, originAllowed, sha } from "@/lib/public-api.server";

// Read-only: this anonymous device's checks, plus a fresh signed Premium pass when Premium is active.
export const Route = createFileRoute("/api/public/check-status")({
  server: {
    handlers: {
      OPTIONS: ({ request }) => new Response(null, { status: 204, headers: cors(request) }),
      GET: async ({ request }) => {
        const json = (b: unknown, status = 200) => Response.json(b, { status, headers: { ...cors(request), "Cache-Control": "no-store" } });
        if (!originAllowed(request)) return json({ error: "Not allowed." }, 403);
        const device = deviceHeader(request);
        if (!device) return json({ error: "Missing device." }, 400);
        try {
          const dev = await sha(device);
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data, error } = await supabaseAdmin.rpc("check_status", { _device: dev });
          if (error) throw error;
          const s = data as { premium: boolean; renews?: string };
          if (s.premium && s.renews) {
            const { signPass } = await import("@/lib/premium-pass.server");
            return json({ ...s, pass: await signPass(dev, s.renews) });
          }
          return json(s);
        } catch (e) {
          console.error("check-status failed", e);
          return json({ error: "Unavailable" }, 503);
        }
      },
    },
  },
});
