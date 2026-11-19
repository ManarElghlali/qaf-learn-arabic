// Admin/monitoring access for otherwise-public endpoints. Requires `Authorization: Bearer <QAF_ADMIN_TOKEN>`.
// With no token configured (or a short one) every request is refused, so monitoring is closed by default.
export async function adminAuthorized(request: Request): Promise<boolean> {
  const expected = process.env["QAF_ADMIN_TOKEN"] ?? "";
  if (expected.length < 24) return false;
  const given = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!given) return false;
  const enc = new TextEncoder();
  // Compare fixed-length digests in constant time so the token can't be guessed byte by byte.
  const [a, b] = await Promise.all([crypto.subtle.digest("SHA-256", enc.encode(given)), crypto.subtle.digest("SHA-256", enc.encode(expected))]);
  const x = new Uint8Array(a), y = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i]! ^ y[i]!;
  return diff === 0;
}

export function unauthorized(): Response {
  return Response.json({ error: "Not authorized." }, { status: 401, headers: { "Cache-Control": "no-store", "WWW-Authenticate": "Bearer" } });
}
