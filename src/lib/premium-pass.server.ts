// Signs the offline Premium pass. Valid until the paid period ends plus a 3-day grace period.
export const PASS_GRACE_MS = 3 * 864e5;
const b64u = (b: Uint8Array) => btoa(Array.from(b, (x) => String.fromCharCode(x)).join("")).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export async function signPass(deviceHash: string, periodEnd: Date | string, product?: string): Promise<string> {
  const raw = process.env["QAF_PASS_PRIVATE_KEY"];
  if (!raw) throw new Error("pass_not_configured");
  const key = await crypto.subtle.importKey("pkcs8", Uint8Array.from(atob(raw), (c) => c.charCodeAt(0)), { name: "Ed25519" }, false, ["sign"]);
  const payload = b64u(new TextEncoder().encode(JSON.stringify({ d: deviceHash, exp: new Date(periodEnd).getTime() + PASS_GRACE_MS, prod: product })));
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "Ed25519" }, key, new TextEncoder().encode(payload)));
  return `${payload}.${b64u(sig)}`;
}
