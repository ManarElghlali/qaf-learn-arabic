// Shared guards for public endpoints called by the web app and native shells.
const ORIGINS = new Set(["capacitor://localhost", "https://localhost", "http://localhost"]);
export function cors(request: Request, methods = "GET, POST, OPTIONS"): Record<string, string> {
  const o = request.headers.get("origin") ?? "";
  return ORIGINS.has(o) ? { "Access-Control-Allow-Origin": o, "Access-Control-Allow-Methods": methods, "Access-Control-Allow-Headers": "content-type, x-qaf-device", Vary: "Origin" } : {};
}
export function originAllowed(request: Request): boolean {
  const o = request.headers.get("origin");
  if (!o || ORIGINS.has(o)) return true;
  try { return new URL(o).host === new URL(request.url).host; } catch { return false; }
}
export async function sha(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, "0")).join("");
}
export function deviceHeader(request: Request): string | null {
  const d = request.headers.get("x-qaf-device") ?? "";
  return /^[a-f0-9-]{16,64}$/i.test(d) ? d : null;
}
