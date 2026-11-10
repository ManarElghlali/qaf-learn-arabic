import { describe, expect, it } from "vitest";
import * as nodeCrypto from "node:crypto";
import chain from "./fixtures-apple-chain.json";
import { BUNDLE_ID, PRODUCTS, verifyAppleJws, verifyAppleJwsWithRoot } from "@/lib/store-verify.server";

const key = nodeCrypto.createPrivateKey(chain.leafKey);
const b64u = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
const DAY = 86_400_000;
const now = new Date("2030-01-15T12:00:00Z");
const tx = (over: Record<string, unknown> = {}) => ({
  transactionId: "2000000111", originalTransactionId: "2000000100", bundleId: BUNDLE_ID, productId: PRODUCTS.monthly,
  purchaseDate: now.getTime() - 5 * DAY, expiresDate: now.getTime() + 25 * DAY, appAccountToken: "acc-1", ...over,
});
function sign(payload: object, x5c: string[] = chain.x5c) {
  const data = `${b64u({ alg: "ES256", x5c })}.${b64u(payload)}`;
  const sig = nodeCrypto.sign("SHA256", Buffer.from(data), { key, dsaEncoding: "ieee-p1363" }).toString("base64url");
  return `${data}.${sig}`;
}
const check = (jws: string) => verifyAppleJwsWithRoot(jws, chain.rootSha256, now);

describe("Apple signed transaction", () => {
  it("accepts a correctly signed active subscription, even with surrounding whitespace", async () => {
    const v = await check(`  ${sign(tx())}\n`);
    expect(v).toMatchObject({ productId: PRODUCTS.monthly, original: "ios:2000000100", account: "acc-1" });
  });
  it("reports expired or refunded subscriptions as inactive", async () => {
    expect(await check(sign(tx({ expiresDate: now.getTime() - 1 })))).toEqual({ inactive: "ios:2000000100" });
    expect(await check(sign(tx({ revocationDate: now.getTime() - DAY })))).toEqual({ inactive: "ios:2000000100" });
  });
  it("rejects an edited transaction", async () => {
    const [h, , s] = sign(tx()).split(".");
    await expect(check(`${h}.${b64u(tx({ expiresDate: now.getTime() + 999 * DAY }))}.${s}`)).rejects.toThrow("bad_signature");
  });
  it("rejects another app or an unknown product", async () => {
    await expect(check(sign(tx({ bundleId: "com.other.app" })))).rejects.toThrow("bad_bundle");
    await expect(check(sign(tx({ productId: "free_gems" })))).rejects.toThrow("bad_product");
  });
  it("rejects a chain that does not end at Apple Root CA G3", async () => {
    await expect(verifyAppleJws(sign(tx()))).rejects.toThrow("bad_root");
  });
  it("rejects a signing certificate that is not an App Store receipt certificate", async () => {
    await expect(check(sign(tx(), [chain.unmarkedLeaf, chain.x5c[1]!, chain.x5c[2]!]))).rejects.toThrow("leaf_not_app_store");
  });
  it("rejects a broken certificate chain", async () => {
    await expect(check(sign(tx(), [chain.x5c[0]!, chain.x5c[0]!, chain.x5c[2]!]))).rejects.toThrow();
  });
});
