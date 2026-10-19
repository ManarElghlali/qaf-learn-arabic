// Apple In-App Purchase / Google Play Billing via the native plugin. Web has no checkout.
// Premium is never trusted locally: every purchase/restore is confirmed by /api/public/verify-receipt.
import { API_BASE, deviceId } from "@/lib/api";
import { update } from "@/lib/progress";
import { savePass, refreshAccess } from "@/lib/access";

export const PRODUCTS = { monthly: "qaf_premium_monthly", yearly: "qaf_premium_yearly" } as const;
export type Plan = keyof typeof PRODUCTS;
export const FALLBACK_PRICE: Record<Plan, string> = { monthly: "$5.99 / month", yearly: "$45.99 / year" };
const ANDROID_BASE_PLAN: Record<Plan, string> = { monthly: "monthly", yearly: "yearly" };

export type QuotaStatus = { premium: boolean; used: number; limit: number; enforced: boolean; renews?: string; billingLive?: boolean; pass?: string };

async function shaHex(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, "0")).join("");
}
/** Same UUID the server derives: ties each purchase to this phone (appAccountToken / obfuscatedAccountId). */
export async function accountToken(): Promise<string> {
  const d = (await shaHex(deviceId())).slice(0, 32);
  return `${d.slice(0, 8)}-${d.slice(8, 12)}-4${d.slice(13, 16)}-a${d.slice(17, 20)}-${d.slice(20, 32)}`;
}

async function native() {
  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform()) return null;
  const m = await import("@capgo/native-purchases");
  return { plugin: m.NativePurchases, SUBS: m.PURCHASE_TYPE.SUBS, platform: Capacitor.getPlatform() as "ios" | "android" };
}

export async function storeAvailable(): Promise<boolean> {
  try { const n = await native(); if (!n) return false; return (await n.plugin.isBillingSupported()).isBillingSupported; } catch { return false; }
}

export async function storePrices(): Promise<Partial<Record<Plan, string>>> {
  try {
    const n = await native(); if (!n) return {};
    const { products } = await n.plugin.getProducts({ productIdentifiers: Object.values(PRODUCTS), productType: n.SUBS });
    const out: Partial<Record<Plan, string>> = {};
    for (const p of products) {
      if (p.identifier === PRODUCTS.monthly) out.monthly = `${p.priceString} / month`;
      if (p.identifier === PRODUCTS.yearly) out.yearly = `${p.priceString} / year`;
    }
    return out;
  } catch { return {}; }
}

type Tx = { transactionId: string; purchaseToken?: string; productIdentifier?: string; jwsRepresentation?: string };

async function verify(platform: "ios" | "android", t: Tx): Promise<boolean> {
  if (platform === "ios" && !t.jwsRepresentation) return false;
  const body = platform === "ios" ? { platform, jws: t.jwsRepresentation } : { platform, purchaseToken: t.purchaseToken };
  const res = await fetch(`${API_BASE}/api/public/verify-receipt`, { method: "POST", headers: { "Content-Type": "application/json", "x-qaf-device": deviceId() }, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as { premium?: boolean; error?: string; pass?: string };
  if (!res.ok) throw new Error(data.error ?? "Couldn't confirm your purchase.");
  if (data.premium && data.pass) await savePass(data.pass);
  return !!data.premium;
}

// Display cache only; content unlocks come from the signed pass in access.ts.
function setPremium(v: boolean) { update((p) => (p.premium === v ? p : { ...p, premium: v })); }

export async function buy(plan: Plan): Promise<boolean> {
  const n = await native();
  if (!n) throw new Error("Subscriptions are available in the Qaf app for iPhone and Android.");
  const t = (await n.plugin.purchaseProduct({ productIdentifier: PRODUCTS[plan], planIdentifier: ANDROID_BASE_PLAN[plan], productType: n.SUBS, appAccountToken: await accountToken() })) as Tx;
  const ok = await verify(n.platform, t);
  setPremium(ok);
  return ok;
}

/** Re-checks every store purchase with the server. Returns true if Premium is active. */
export async function restore(): Promise<boolean> {
  const n = await native();
  if (!n) throw new Error("Restore works in the Qaf app for iPhone and Android.");
  await n.plugin.restorePurchases().catch(() => {});
  const { purchases } = await n.plugin.getPurchases({ productType: n.SUBS, onlyCurrentEntitlements: true });
  let ok = false;
  for (const t of purchases as Tx[]) {
    if (t.productIdentifier && !Object.values(PRODUCTS).includes(t.productIdentifier as never)) continue;
    if (await verify(n.platform, t).catch(() => false)) { ok = true; break; }
  }
  if (!ok) await savePass(null);
  setPremium(ok);
  return ok;
}

/** Server's view of this device's checks; also syncs the cached Premium flag. */
export async function quotaStatus(): Promise<QuotaStatus | null> {
  try {
    const res = await fetch(`${API_BASE}/api/public/check-status`, { headers: { "x-qaf-device": deviceId() } });
    if (!res.ok) return null;
    const s = (await res.json()) as QuotaStatus;
    const had = (await refreshAccess()).premium;
    if (s.premium && s.pass) await savePass(s.pass, s.billingLive);
    else if (!s.premium && had) {
      // Period ended on the server: ask the store (renewal) before turning Premium off.
      const renewed = await restore().catch(() => false);
      if (!renewed) await savePass(null, s.billingLive);
    } else await savePass(null, s.billingLive);
    setPremium(s.premium);
    return s;
  } catch { return null; }
}
