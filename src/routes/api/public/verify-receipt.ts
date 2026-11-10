import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { cors, deviceHeader, originAllowed, sha } from "@/lib/public-api.server";

// Premium is granted ONLY here, after Apple or Google confirms an active subscription.
// A bare transaction number is never accepted: iOS must send Apple's signed transaction (JWS),
// Android the Play purchase token. Both are only delivered to the store account that paid.
const Body = z.discriminatedUnion("platform", [
  // The JWS is cryptographically verified below, so only its size is limited here.
  z.object({ platform: z.literal("ios"), jws: z.string().trim().min(100).max(50000) }),
  z.object({ platform: z.literal("android"), purchaseToken: z.string().min(10).max(2000).regex(/^[A-Za-z0-9._\-:]+$/) }),
]);

type Admin = (typeof import("@/integrations/supabase/client.server"))["supabaseAdmin"];
// Diagnostics hold only failure codes (certificate names, product/bundle IDs, store/server errors) —
// never the device ID, purchase data or transaction numbers — so they can be listed publicly for tracing.
async function record(admin: Admin, platform: string, stage: string, detail: string) {
  const code = detail.split(":").slice(0, 2).join(":").slice(0, 80);
  const { error } = await admin.from("receipt_diagnostics").insert({ platform: platform.slice(0, 16), stage, code, detail: detail.slice(0, 600) });
  if (error) console.error("[verify-receipt] diagnostic insert failed:", error.message);
}

export const Route = createFileRoute("/api/public/verify-receipt")({
  server: {
    handlers: {
      OPTIONS: ({ request }) => new Response(null, { status: 204, headers: cors(request) }),
      GET: async ({ request }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.from("receipt_diagnostics")
          .select("created_at, platform, stage, code, detail").order("created_at", { ascending: false }).limit(25);
        if (error) return Response.json({ error: `Diagnostics unavailable: ${error.message}` }, { status: 500, headers: cors(request) });
        return Response.json({ recent: data }, { headers: { ...cors(request), "Cache-Control": "no-store" } });
      },
      POST: async ({ request }) => {
        const json = (b: unknown, status = 200) => Response.json(b, { status, headers: cors(request) });
        if (!originAllowed(request)) return json({ error: "Not allowed." }, 403);
        const device = deviceHeader(request);
        if (!device) return json({ error: "Please update the app and try again." }, 400);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          console.error("[verify-receipt] request rejected by schema", JSON.stringify(parsed.error.issues.map((i) => ({ path: i.path.join("."), code: i.code, message: i.message }))));
          const detail = `bad_request:schema:${parsed.error.issues.map((i) => `${i.path.join(".") || "body"}_${i.code}`).join(";")}`;
          await record(supabaseAdmin, "unknown", "schema", detail);
          return json({ error: `Invalid purchase: ${detail}`, code: "bad_request:schema", detail }, 400);
        }
        const { verifyApple, verifyAppleJws, verifyGoogle } = await import("@/lib/store-verify.server");
        const { signPass } = await import("@/lib/premium-pass.server");
        const dev = await sha(device);
        try {
          const b = parsed.data;
          let v;
          if (b.platform === "ios") {
            let signed;
            try {
              signed = await verifyAppleJws(b.jws);
            } catch (e) {
              const detail = e instanceof Error ? e.message : String(e);
              console.error("[verify-receipt] Apple JWS rejected:", detail, `(length ${b.jws.length})`);
              // The code only describes Apple's public certificates and the submitted transaction, so it is safe to return.
              await record(supabaseAdmin, "ios", "apple_jws", detail);
              return json({ error: `Invalid purchase: ${detail}`, code: detail.split(":").slice(0, 2).join(":"), detail }, 400);
            }
            // Apple's server is authoritative when its keys are configured (catches refunds and renewals);
            // otherwise, or if it is unreachable, use the transaction Apple signed.
            const txId = ("inactive" in signed ? signed.inactive : signed.original).slice("ios:".length);
            const live = await verifyApple(txId).catch((e) => {
              const detail = e instanceof Error ? e.message : String(e);
              console.error("[verify-receipt] App Store Server API lookup failed, using signed transaction:", detail);
              void record(supabaseAdmin, "ios", "apple_server_api", `apple_api:${detail}`);
              return null;
            });
            v = live ?? signed;
          } else v = await verifyGoogle(b.purchaseToken);
          if (!v) return json({ premium: false });
          if ("inactive" in v) {
            const { error: revokeError } = await supabaseAdmin.rpc("revoke_entitlement", { _original: v.inactive });
            if (revokeError) console.error("[verify-receipt] revoke_entitlement failed:", revokeError.code, revokeError.message, revokeError.details);
            await record(supabaseAdmin, b.platform, "inactive", "subscription:inactive:expired_or_refunded");
            return json({ premium: false, code: "subscription:inactive" });
          }
          const { error } = await supabaseAdmin.rpc("grant_entitlement", {
            _device: dev, _platform: b.platform, _product: v.productId, _original: v.original,
            _start: v.start.toISOString(), _end: v.end.toISOString(),
          });
          if (error) {
            console.error("[verify-receipt] grant_entitlement failed:", error.code, error.message, error.details, error.hint);
            await record(supabaseAdmin, b.platform, "grant_entitlement", `entitlement:grant_failed:${error.code}:${error.message}`);
            if (/too_many_moves/.test(error.message)) return json({ error: "This subscription was moved to another phone too many times this month. Please contact support.", code: "entitlement:too_many_moves" }, 409);
            throw error;
          }
          return json({ premium: true, productId: v.productId, periodEnd: v.end.toISOString(), pass: await signPass(dev, v.end, v.productId) });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "";
          console.error("[verify-receipt] failed:", msg, e instanceof Error ? e.stack : String(e));
          await record(supabaseAdmin, parsed.data.platform, "server", `server:${msg || String(e)}`);
          if (msg === "not_configured") return json({ error: "Store purchases aren't set up yet.", code: "store:not_configured" }, 503);
          return json({ error: `Couldn't confirm your purchase right now: ${msg || "unknown error"}`, code: "server:verification_failed", detail: msg }, 502);
        }
      },
    },
  },
});
