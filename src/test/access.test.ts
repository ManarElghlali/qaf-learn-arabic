import { describe, expect, it } from "vitest";
import { FREE_WORDS, FREE_QUIZZES, canOpenUnit, canOpenSoundSet, checkPass, freeQuizOpen } from "@/lib/access";
import { WORDS } from "@/lib/words";
import { UNIT_ORDER } from "@/lib/lessons";
import { verifyAppleJws, accountToken } from "@/lib/store-verify.server";

describe("free plan", () => {
  it("is exactly the first 10 approved Fatha words", () => {
    expect(FREE_WORDS.map((w) => w.ar)).toEqual(WORDS.slice(0, 10).map((w) => w.ar));
  });
  it("has 5 quizzes using only the free words, opened in order", () => {
    expect(FREE_QUIZZES).toHaveLength(5);
    const ids = new Set(FREE_WORDS.map((w) => w.id));
    for (const q of FREE_QUIZZES) expect(q.words.every((w) => ids.has(w.id))).toBe(true);
    expect(freeQuizOpen(1, [])).toBe(true);
    expect(freeQuizOpen(2, [])).toBe(false);
    expect(freeQuizOpen(3, [1, 2])).toBe(true);
  });
  it("locks every other unit and sound set unless Premium", () => {
    for (const id of UNIT_ORDER) expect(canOpenUnit(id, false)).toBe(id === "fatha");
    for (const id of UNIT_ORDER) expect(canOpenUnit(id, true)).toBe(true);
    expect(canOpenSoundSet("fatha", false)).toBe(true);
    expect(canOpenSoundSet("damma", false)).toBe(false);
    expect(canOpenSoundSet("damma", true)).toBe(true);
  });
});

describe("Premium pass", () => {
  it("rejects a pass not signed by Qaf, or edited", async () => {
    const kp = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
    const b64u = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const p = b64u(new TextEncoder().encode(JSON.stringify({ d: "x", exp: Date.now() + 1e9 })));
    const sig = new Uint8Array(await crypto.subtle.sign({ name: "Ed25519" }, kp.privateKey, new TextEncoder().encode(p)));
    expect(await checkPass(`${p}.${b64u(sig)}`, "device-123456789012")).toBeNull();
    expect(await checkPass("garbage", "device-123456789012")).toBeNull();
    expect(await checkPass(null, "device-123456789012")).toBeNull();
  });
});

describe("store verification", () => {
  it("rejects an unsigned or self-signed Apple transaction", async () => {
    const fake = `${btoa(JSON.stringify({ alg: "ES256", x5c: ["AA", "BB", "CC"] }))}.${btoa("{}")}.sig`;
    await expect(verifyAppleJws(fake)).rejects.toThrow();
  });
  it("derives a stable UUID per device", () => {
    const t = accountToken("a".repeat(64));
    expect(t).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-a[0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(accountToken("a".repeat(64))).toBe(t);
  });
});
