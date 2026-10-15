import { createFileRoute } from "@tanstack/react-router";
import { cors, deviceHeader, originAllowed, sha } from "@/lib/public-api.server";

// Read-only: how many pronunciation checks this anonymous device has used.
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
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data, error } = await supabaseAdmin.rpc("check_status", { _device: await sha(device) });
          if (error) throw error;
          return json(data);
        } catch (e) {
          console.error("check-status failed", e);
          return json({ error: "Unavailable" }, 503);
        }
      },
    },
  },
});
