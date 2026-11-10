// Server-only store receipt verification (App Store Server API, Google Play Developer API).
// Secrets: APPLE_IAP_ISSUER_ID, APPLE_IAP_KEY_ID, APPLE_IAP_PRIVATE_KEY (.p8), GOOGLE_PLAY_SERVICE_ACCOUNT (JSON).
import * as nodeCrypto from "node:crypto";
import { Buffer } from "node:buffer";

export const BUNDLE_ID = "app.qaf.learnarabic";
export const PRODUCTS = { monthly: "qaf_premium_monthly", yearly: "qaf_premium_yearly" } as const;
const KNOWN = new Set<string>(Object.values(PRODUCTS));

export type Verified = { productId: string; original: string; start: Date; end: Date; account?: string | null };
/** Store says this subscription exists but is not active (expired, refunded, revoked). */
export type Inactive = { inactive: string };

// Apple's published root certificates (apple.com/certificateauthority), pinned by SHA-256 of the full certificate.
// StoreKit 2 currently chains to G3; G1 and G2 are recognized so a future Apple chain change can't silently lock out buyers.
export const APPLE_ROOTS: Readonly<Record<string, string>> = {
  b0b1730ecbc7ff4505142c49f1295e6eda6bcaed7e2c68c5be91b5a11001f024: "Apple Root CA (G1)",
  c2b9b042dd57830e7d117dac55ac8ae19407d38e41d88f3215bc3a890444a050: "Apple Root CA - G2",
  "63343abfb89a6a03ebb57e9b3f5fa7be7c4f5c756f3017b3a8c488c3653e9179": "Apple Root CA - G3",
};
// Apple's marker extensions: only App Store receipt-signing certificates carry these, so a certificate
// Apple issued for something else (e.g. a developer's Apple Pay key) can never sign a fake transaction.
const LEAF_OID = Buffer.from("060a2a864886f76364060b01", "hex"); // 1.2.840.113635.100.6.11.1
const INTERMEDIATE_OID = Buffer.from("060a2a864886f76364060201", "hex"); // 1.2.840.113635.100.6.2.1

type AppleTx = {
  transactionId: string; originalTransactionId: string; bundleId: string; productId: string;
  purchaseDate: number; expiresDate?: number; revocationDate?: number; appAccountToken?: string;
};

/** Verifies a StoreKit 2 signed transaction (x5c chain up to an Apple root CA, then the ES256 signature) and returns its subscription state. */
export function verifyAppleJws(jws: string): Promise<Verified | Inactive> {
  return verifyAppleJwsWithRoots(jws, APPLE_ROOTS);
}

/** Exported for tests only; production always pins Apple's roots via verifyAppleJws. */
export function verifyAppleJwsWithRoot(jws: string, rootSha256: string, now = new Date()): Promise<Verified | Inactive> {
  return verifyAppleJwsWithRoots(jws, { [rootSha256]: "test root" }, now);
}

const cn = (dn: string) => /CN=([^\n,]+)/.exec(dn)?.[1]?.trim() ?? dn.replace(/\n/g, ", ");
const POSITION = ["leaf", "intermediate", "root"] as const;

/** Every failure throws a stable code followed by details, e.g. "bad_root:untrusted:<sha256>:<CN>". */
export async function verifyAppleJwsWithRoots(jws: string, roots: Readonly<Record<string, string>>, now = new Date()): Promise<Verified | Inactive> {
  const parts = jws.trim().split(".");
  if (parts.length !== 3 || parts.some((x) => !x)) throw new Error(`bad_jws:format:${parts.length}_parts`);
  const [h, p, sig] = parts as [string, string, string];
  let header: { alg?: string; x5c?: unknown };
  try { header = JSON.parse(Buffer.from(h, "base64url").toString("utf8")); } catch { throw new Error("bad_jws:header_json"); }
  if (header.alg !== "ES256") throw new Error(`bad_jws:alg:${String(header.alg)}`);
  if (!Array.isArray(header.x5c)) throw new Error("bad_jws:x5c_missing");
  if (header.x5c.length !== 3) throw new Error(`bad_jws:x5c_length:${header.x5c.length}`);
  if (!header.x5c.every((c) => typeof c === "string")) throw new Error("bad_jws:x5c_not_strings");
  const certs = (header.x5c as string[]).map((certB64, i) => {
    try { return new nodeCrypto.X509Certificate(Buffer.from(certB64, "base64")); }
    catch (e) { throw new Error(`bad_cert:parse:${POSITION[i]}:${e instanceof Error ? e.message : e}`); }
  });
  const [leaf, intermediate, root] = certs as [nodeCrypto.X509Certificate, nodeCrypto.X509Certificate, nodeCrypto.X509Certificate];
  const fingerprint = root.fingerprint256.replace(/:/g, "").toLowerCase();
  if (!roots[fingerprint]) throw new Error(`bad_root:untrusted:${fingerprint}:${cn(root.subject)}`);
  if (!root.verify(root.publicKey)) throw new Error(`bad_root:not_self_signed:${roots[fingerprint]}`);
  if (!leaf.raw.includes(LEAF_OID)) throw new Error(`bad_cert:leaf_not_app_store:${cn(leaf.subject)}`);
  if (!intermediate.raw.includes(INTERMEDIATE_OID)) throw new Error(`bad_cert:intermediate_not_apple_wwdr:${cn(intermediate.subject)}`);
  if (leaf.publicKey.asymmetricKeyType !== "ec") throw new Error(`bad_cert:leaf_key_type:${leaf.publicKey.asymmetricKeyType}`);
  for (let i = 0; i < certs.length; i++) {
    const c = certs[i]!, issuer = certs[i + 1] ?? root, pos = POSITION[i];
    if (new Date(c.validFrom) > now) throw new Error(`bad_cert:not_yet_valid:${pos}:${c.validFrom}`);
    if (new Date(c.validTo) < now) throw new Error(`bad_cert:expired:${pos}:${c.validTo}`);
    if (c !== root && typeof c.checkIssued === "function" && !c.checkIssued(issuer)) throw new Error(`bad_cert:issuer_mismatch:${pos}:${cn(c.issuer)}!=${cn(issuer.subject)}`);
    if (!c.verify(issuer.publicKey)) throw new Error(`bad_cert:chain_signature:${pos}`);
  }
  const sigBuf = Buffer.from(sig, "base64url");
  const signedData = Buffer.from(`${h}.${p}`);
  if (!nodeCrypto.verify("SHA256", signedData, { key: leaf.publicKey, dsaEncoding: "ieee-p1363" }, sigBuf)) throw new Error(`bad_signature:${sigBuf.length}_bytes`);
  let x: AppleTx;
  try { x = JSON.parse(Buffer.from(p, "base64url").toString("utf8")); } catch { throw new Error("bad_jws:payload_json"); }
  if (x.bundleId !== BUNDLE_ID) throw new Error(`bad_bundle:${String(x.bundleId)}`);
  if (!KNOWN.has(x.productId)) throw new Error(`bad_product:${String(x.productId)}`);
  const missing = (["originalTransactionId", "purchaseDate", "expiresDate"] as const).filter((k) => k === "originalTransactionId" ? !x[k] : !Number.isFinite(x[k]));
  if (missing.length) throw new Error(`bad_jws:payload_fields:${missing.join(",")}`);
  const expiry = new Date(x.expiresDate!);
  if (x.revocationDate || expiry <= now) return { inactive: `ios:${x.originalTransactionId}` };
  return { productId: x.productId, original: `ios:${x.originalTransactionId}`, account: x.appAccountToken ?? null, ...billingMonth(new Date(x.purchaseDate), expiry, now) };
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
const decodeJws = <T>(jws: string): T => JSON.parse(Buffer.from(jws.split(".")[1]!, "base64url").toString("utf8")) as T;

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
  if (!iss || !kid || !pk) return null; // App Store Server API keys not set: callers rely on the verified JWS.
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
