import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { cors, deviceHeader, originAllowed, sha } from "@/lib/public-api.server";

// Premium is granted ONLY here, after Apple or Google confirms an active subscription.
// A bare transaction number is never accepted: iOS must send Apple's signed transaction (JWS),
// Android the Play purchase token. Both are only delivered to the store account that paid.
const Body = z.discriminatedUnion("platform", [
  z.object({ platform: z.literal("ios"), jws: z.string().min(100).max(20000).regex(/^[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+$/) }),
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
        if (!parsed.success) return json({ error: "Invalid purchase." }, 400);
        const { verifyApple, verifyAppleJws, verifyGoogle } = await import("@/lib/store-verify.server");
        const { signPass } = await import("@/lib/premium-pass.server");
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const dev = await sha(device);
        try {
          const b = parsed.data;
          let v;
          if (b.platform === "ios") {
            const tx = await verifyAppleJws(b.jws).catch(() => null);
            if (!tx) return json({ error: "Invalid purchase." }, 400);
            v = await verifyApple(tx.transactionId);
          } else v = await verifyGoogle(b.purchaseToken);
          if (!v) return json({ premium: false });
          if ("inactive" in v) {
            await supabaseAdmin.rpc("revoke_entitlement", { _original: v.inactive });
            return json({ premium: false });
          }
          const { error } = await supabaseAdmin.rpc("grant_entitlement", {
            _device: dev, _platform: b.platform, _product: v.productId, _original: v.original,
            _start: v.start.toISOString(), _end: v.end.toISOString(),
          });
          if (error) {
            if (/too_many_moves/.test(error.message)) return json({ error: "This subscription was moved to another phone too many times this month. Please contact support." }, 409);
            throw error;
          }
          return json({ premium: true, productId: v.productId, periodEnd: v.end.toISOString(), pass: await signPass(dev, v.end, v.productId) });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "";
          console.error("verify-receipt failed", msg);
          if (msg === "not_configured") return json({ error: "Store purchases aren't set up yet." }, 503);
          return json({ error: "Couldn't confirm your purchase right now. Please try Restore later." }, 502);
        }
      },
    },
  },
});
