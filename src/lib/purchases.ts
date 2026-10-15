// Apple In-App Purchase / Google Play Billing via the native plugin. Web has no checkout.
// Premium is never trusted locally: every purchase/restore is confirmed by /api/public/verify-receipt.
import { API_BASE, deviceId } from "@/lib/api";
import { update } from "@/lib/progress";

export const PRODUCTS = { monthly: "qaf_premium_monthly", yearly: "qaf_premium_yearly" } as const;
export type Plan = keyof typeof PRODUCTS;
export const FALLBACK_PRICE: Record<Plan, string> = { monthly: "$5.99 / month", yearly: "$39.99 / year" };
const ANDROID_BASE_PLAN: Record<Plan, string> = { monthly: "monthly", yearly: "yearly" };

export type QuotaStatus = { premium: boolean; used: number; limit: number; enforced: boolean; renews?: string };

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

type Tx = { transactionId: string; purchaseToken?: string; productIdentifier?: string };

async function verify(platform: "ios" | "android", t: Tx): Promise<boolean> {
  const body = platform === "ios" ? { platform, transactionId: t.transactionId } : { platform, purchaseToken: t.purchaseToken };
  const res = await fetch(`${API_BASE}/api/public/verify-receipt`, { method: "POST", headers: { "Content-Type": "application/json", "x-qaf-device": deviceId() }, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as { premium?: boolean; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Couldn't confirm your purchase.");
  return !!data.premium;
}

function setPremium(v: boolean) { update((p) => ({ ...p, premium: v })); }

export async function buy(plan: Plan): Promise<boolean> {
  const n = await native();
  if (!n) throw new Error("Subscriptions are available in the Qaf app for iPhone and Android.");
  const t = (await n.plugin.purchaseProduct({ productIdentifier: PRODUCTS[plan], planIdentifier: ANDROID_BASE_PLAN[plan], productType: n.SUBS })) as Tx;
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
  setPremium(ok);
  return ok;
}

/** Server's view of this device's checks; also syncs the cached Premium flag. */
export async function quotaStatus(): Promise<QuotaStatus | null> {
  try {
    const res = await fetch(`${API_BASE}/api/public/check-status`, { headers: { "x-qaf-device": deviceId() } });
    if (!res.ok) return null;
    const s = (await res.json()) as QuotaStatus;
    setPremium(s.premium);
    return s;
  } catch { return null; }
}
