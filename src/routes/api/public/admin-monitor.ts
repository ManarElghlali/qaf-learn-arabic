import { createFileRoute } from "@tanstack/react-router";
import { adminAuthorized, unauthorized } from "@/lib/admin-auth.server";

// Owner-only monitoring: AI spending against the budget, kill-switch state and recent receipt failures.
// Server-to-server only (no CORS); refused unless the Bearer token matches QAF_ADMIN_TOKEN.
export const Route = createFileRoute("/api/public/admin-monitor")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!(await adminAuthorized(request))) return unauthorized();
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const [spend, diag] = await Promise.all([
          supabaseAdmin.rpc("ai_spend_report"),
          supabaseAdmin.from("receipt_diagnostics").select("created_at, platform, stage, code, detail").order("created_at", { ascending: false }).limit(25),
        ]);
        if (spend.error || diag.error) return Response.json({ error: "Monitoring unavailable." }, { status: 500, headers: { "Cache-Control": "no-store" } });
        return Response.json({ spending: spend.data, receiptDiagnostics: diag.data }, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
