// Server-only store receipt verification (App Store Server API, Google Play Developer API).
// Secrets: APPLE_IAP_ISSUER_ID, APPLE_IAP_KEY_ID, APPLE_IAP_PRIVATE_KEY (.p8), GOOGLE_PLAY_SERVICE_ACCOUNT (JSON).
export const BUNDLE_ID = "app.qaf.learnarabic";
export const PRODUCTS = { monthly: "qaf_premium_monthly", yearly: "qaf_premium_yearly" } as const;
const KNOWN = new Set<string>(Object.values(PRODUCTS));

export type Verified = { productId: string; original: string; start: Date; end: Date; account?: string | null };
/** Store says this subscription exists but is not active (expired, refunded, revoked). */
export type Inactive = { inactive: string };

const APPLE_ROOT_G3_SHA256 = "63343abfb89a6a03ebb57e9b3f5fa7be7c4f5c756f3017b3a8c488c3653e9179";
const hex = (b: ArrayBuffer) => Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, "0")).join("");

/** Verifies a StoreKit 2 signed transaction (x5c chain up to Apple Root CA G3, then the ES256 signature). */
export async function verifyAppleJws(jws: string): Promise<{ transactionId: string; originalTransactionId: string; appAccountToken?: string; bundleId: string }> {
  const x509 = await import("@peculiar/x509");
  const [h, p, sig] = jws.split(".");
  if (!h || !p || !sig) throw new Error("bad_jws");
  const header = JSON.parse(atob(h.replace(/-/g, "+").replace(/_/g, "/"))) as { alg: string; x5c: string[] };
  if (header.alg !== "ES256" || !Array.isArray(header.x5c) || header.x5c.length < 3) throw new Error("bad_jws");
  const certs = header.x5c.map((c) => new x509.X509Certificate(c));
  const root = certs[certs.length - 1]!;
  if (hex(await crypto.subtle.digest("SHA-256", root.rawData)) !== APPLE_ROOT_G3_SHA256) throw new Error("bad_root");
  const now = new Date();
  for (let i = 0; i < certs.length; i++) {
    const c = certs[i]!, issuer = certs[i + 1] ?? root;
    if (c.notBefore > now || c.notAfter < now) throw new Error("cert_expired");
    if (!(await c.verify({ publicKey: issuer.publicKey, signatureOnly: true }))) throw new Error("bad_chain");
  }
  const leafKey = await certs[0]!.publicKey.export({ name: "ECDSA", namedCurve: "P-256" }, ["verify"]);
  const raw = Uint8Array.from(atob(sig.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
  if (!(await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, leafKey, raw, new TextEncoder().encode(`${h}.${p}`)))) throw new Error("bad_signature");
  const x = decodeJws<{ transactionId: string; originalTransactionId: string; appAccountToken?: string; bundleId: string }>(jws);
  if (x.bundleId !== BUNDLE_ID) throw new Error("bad_bundle");
  return x;
}

/** The UUID sent to the store as appAccountToken / obfuscatedAccountId, derived from the anonymous device hash. */
export function accountToken(deviceHash: string): string {
  const d = deviceHash.slice(0, 32);
  return `${d.slice(0, 8)}-${d.slice(8, 12)}-4${d.slice(13, 16)}-a${d.slice(17, 20)}-${d.slice(20, 32)}`;
}

const b64url = (b: ArrayBuffer | Uint8Array | string) => {
  const bytes = typeof b === "string" ? new TextEncoder().encode(b) : new Uint8Array(b);
  return btoa(Array.from(bytes, (x) => String.fromCharCode(x)).join("")).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const pem = (k: string) => Uint8Array.from(atob(k.replace(/\\n/g, "\n").replace(/-----[^-]+-----/g, "").replace(/\s/g, "")), (c) => c.charCodeAt(0));
const decodeJws = <T>(jws: string): T => JSON.parse(atob(jws.split(".")[1]!.replace(/-/g, "+").replace(/_/g, "/"))) as T;

async function signJwt(header: object, payload: object, key: CryptoKey, alg: AlgorithmIdentifier | EcdsaParams) {
  const data = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const sig = await crypto.subtle.sign(alg, key, new TextEncoder().encode(data));
  return `${data}.${b64url(sig)}`;
}

/** The current 100-check window: one calendar month from the subscription anchor, never past expiry. */
export function billingMonth(anchor: Date, expiry: Date, now = new Date()): { start: Date; end: Date } {
  let start = new Date(anchor);
  for (let k = 1; k < 13; k++) {
    const next = new Date(anchor); next.setUTCMonth(anchor.getUTCMonth() + k);
    if (next > now) break;
    start = next;
  }
  const end = new Date(start); end.setUTCMonth(start.getUTCMonth() + 1);
  return { start, end: end < expiry ? end : expiry };
}

export async function verifyApple(transactionId: string): Promise<Verified | Inactive | null> {
  const iss = process.env["APPLE_IAP_ISSUER_ID"], kid = process.env["APPLE_IAP_KEY_ID"], pk = process.env["APPLE_IAP_PRIVATE_KEY"];
  if (!iss || !kid || !pk) throw new Error("not_configured");
  const key = await crypto.subtle.importKey("pkcs8", pem(pk), { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const now = Math.floor(Date.now() / 1000);
  const jwt = await signJwt({ alg: "ES256", kid, typ: "JWT" }, { iss, iat: now, exp: now + 600, aud: "appstoreconnect-v1", bid: BUNDLE_ID }, key, { name: "ECDSA", hash: "SHA-256" });
  for (const host of ["api.storekit.itunes.apple.com", "api.storekit-sandbox.itunes.apple.com"]) {
    const r = await fetch(`https://${host}/inApps/v1/subscriptions/${encodeURIComponent(transactionId)}`, { headers: { Authorization: `Bearer ${jwt}` } });
    if (r.status === 404) continue;
    if (!r.ok) throw new Error(`apple_${r.status}`);
    const j = (await r.json()) as { data: { lastTransactions: { status: number; signedTransactionInfo: string }[] }[] };
    let inactive: string | null = null;
    for (const t of j.data.flatMap((g) => g.lastTransactions)) {
      const x = decodeJws<{ productId: string; originalTransactionId: string; purchaseDate: number; expiresDate: number; bundleId: string; revocationDate?: number; appAccountToken?: string }>(t.signedTransactionInfo);
      if (x.bundleId !== BUNDLE_ID || !KNOWN.has(x.productId)) continue;
      // 1 = active, 4 = billing grace period. Expired (2), retry (3) and revoked (5) end Premium.
      if ((t.status !== 1 && t.status !== 4) || x.revocationDate) { inactive = `ios:${x.originalTransactionId}`; continue; }
      const expiry = new Date(x.expiresDate);
      const m = billingMonth(new Date(x.purchaseDate), expiry);
      return { productId: x.productId, original: `ios:${x.originalTransactionId}`, account: x.appAccountToken ?? null, ...m };
    }
    return inactive ? { inactive } : null;
  }
  return null;
}

export async function verifyGoogle(purchaseToken: string): Promise<Verified | Inactive | null> {
  const raw = process.env["GOOGLE_PLAY_SERVICE_ACCOUNT"];
  if (!raw) throw new Error("not_configured");
  const sa = JSON.parse(raw) as { client_email: string; private_key: string };
  const key = await crypto.subtle.importKey("pkcs8", pem(sa.private_key), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const now = Math.floor(Date.now() / 1000);
  const assertion = await signJwt({ alg: "RS256", typ: "JWT" }, { iss: sa.client_email, scope: "https://www.googleapis.com/auth/androidpublisher", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 600 }, key, { name: "RSASSA-PKCS1-v1_5" });
  const tr = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }) });
  if (!tr.ok) throw new Error(`google_token_${tr.status}`);
  const { access_token } = (await tr.json()) as { access_token: string };
  const r = await fetch(`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${BUNDLE_ID}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`, { headers: { Authorization: `Bearer ${access_token}` } });
  if (r.status === 404 || r.status === 400 || r.status === 410) return null;
  if (!r.ok) throw new Error(`google_${r.status}`);
  const s = (await r.json()) as { subscriptionState: string; latestOrderId?: string; acknowledgementState?: string; lineItems: { productId: string; expiryTime: string }[]; externalAccountIdentifiers?: { obfuscatedExternalAccountId?: string } };
  const li = s.lineItems.find((l) => KNOWN.has(l.productId));
  if (!li) return null;
  const original = `android:${(s.latestOrderId ?? purchaseToken.slice(0, 64)).split("..")[0]}`;
  // Cancelled subscriptions stay ACTIVE (or CANCELED with a future expiry) until the paid period ends.
  const live = s.subscriptionState === "SUBSCRIPTION_STATE_ACTIVE" || s.subscriptionState === "SUBSCRIPTION_STATE_IN_GRACE_PERIOD"
    || (s.subscriptionState === "SUBSCRIPTION_STATE_CANCELED" && new Date(li.expiryTime) > new Date());
  if (!live) return { inactive: original };
  if (s.acknowledgementState === "ACKNOWLEDGEMENT_STATE_PENDING") {
    await fetch(`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${BUNDLE_ID}/purchases/subscriptions/${li.productId}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`, { method: "POST", headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" }, body: "{}" }).catch(() => {});
  }
  const expiry = new Date(li.expiryTime);
  const anchor = new Date(expiry); anchor.setUTCMonth(anchor.getUTCMonth() - (li.productId === PRODUCTS.yearly ? 12 : 1));
  return { productId: li.productId, original, account: s.externalAccountIdentifiers?.obfuscatedExternalAccountId ?? null, ...billingMonth(anchor, expiry) };
}
