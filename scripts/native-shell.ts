// Renders the Home screen once from the built server and saves it as dist/client/index.html,
// giving Capacitor a static entry page. Run after `vite build` (see build:native).
import { writeFileSync } from "node:fs";

const mod = (await import(new URL("../dist/server/index.mjs", import.meta.url).href)) as {
  default: { fetch: (r: Request, env: unknown, ctx: unknown) => Promise<Response> };
};
const ctx = { waitUntil() {}, passThroughOnException() {} };
const res = await mod.default.fetch(new Request("https://localhost/"), {}, ctx);
const html = await res.text();
if (!res.ok || !html.includes("<html")) throw new Error(`Shell render failed: ${res.status}`);
writeFileSync(new URL("../dist/client/index.html", import.meta.url), html);
console.log("Wrote dist/client/index.html", html.length, "bytes");
