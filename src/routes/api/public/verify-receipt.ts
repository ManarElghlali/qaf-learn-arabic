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

export const Route = createFileRoute("/api/public/verify-receipt")({
  server: {
    handlers: {
      OPTIONS: ({ request }) => new Response(null, { status: 204, headers: cors(request) }),
      POST: async ({ request }) => {
        const json = (b: unknown, status = 200) => Response.json(b, { status, headers: cors(request) });
        if (!originAllowed(request)) return json({ error: "Not allowed." }, 403);
        const device = deviceHeader(request);
        if (!device) return json({ error: "Please update the app and try again." }, 400);
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          console.error("[verify-receipt] request rejected by schema", JSON.stringify(parsed.error.issues.map((i) => ({ path: i.path.join("."), code: i.code, message: i.message }))));
          return json({ error: "Invalid purchase.", code: "bad_request:schema", detail: parsed.error.issues.map((i) => `${i.path.join(".") || "body"}:${i.code}`).join(";") }, 400);
        }
        const { verifyApple, verifyAppleJws, verifyGoogle } = await import("@/lib/store-verify.server");
        const { signPass } = await import("@/lib/premium-pass.server");
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
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
              return json({ error: "Invalid purchase.", code: detail.split(":")[0] + ":" + (detail.split(":")[1] ?? ""), detail }, 400);
            }
            // Apple's server is authoritative when its keys are configured (catches refunds and renewals);
            // otherwise, or if it is unreachable, use the transaction Apple signed.
            const txId = ("inactive" in signed ? signed.inactive : signed.original).slice("ios:".length);
            const live = await verifyApple(txId).catch((e) => {
              console.error("[verify-receipt] App Store Server API lookup failed, using signed transaction:", e instanceof Error ? e.message : String(e));
              return null;
            });
            v = live ?? signed;
          } else v = await verifyGoogle(b.purchaseToken);
          if (!v) return json({ premium: false });
          if ("inactive" in v) {
            const { error: revokeError } = await supabaseAdmin.rpc("revoke_entitlement", { _original: v.inactive });
            if (revokeError) console.error("[verify-receipt] revoke_entitlement failed:", revokeError.code, revokeError.message, revokeError.details);
            return json({ premium: false });
          }
          const { error } = await supabaseAdmin.rpc("grant_entitlement", {
            _device: dev, _platform: b.platform, _product: v.productId, _original: v.original,
            _start: v.start.toISOString(), _end: v.end.toISOString(),
          });
          if (error) {
            console.error("[verify-receipt] grant_entitlement failed:", error.code, error.message, error.details, error.hint);
            if (/too_many_moves/.test(error.message)) return json({ error: "This subscription was moved to another phone too many times this month. Please contact support.", code: "entitlement:too_many_moves" }, 409);
            throw error;
          }
          return json({ premium: true, productId: v.productId, periodEnd: v.end.toISOString(), pass: await signPass(dev, v.end, v.productId) });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "";
          console.error("[verify-receipt] failed:", msg, e instanceof Error ? e.stack : String(e));
          if (msg === "not_configured") return json({ error: "Store purchases aren't set up yet.", code: "store:not_configured" }, 503);
          return json({ error: "Couldn't confirm your purchase right now. Please try Restore later.", code: "server:verification_failed" }, 502);
        }
      },
    },
  },
});
