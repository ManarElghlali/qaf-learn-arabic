// The only place the offline service worker is registered. It never runs in development,
// inside the Lovable preview/editor, or in an iframe; there it removes any stale copy instead.
import { allRecordingUrls } from "@/lib/audio";
import { SOUND_CATEGORIES } from "@/lib/sound-practice";

const SW = "/sw.js";

function refused() {
  if (!import.meta.env.PROD) return true;
  try { if (window.self !== window.top) return true; } catch { return true; }
  const h = window.location.hostname;
  if (h.startsWith("id-preview--") || h.startsWith("preview--")) return true;
  if (/(^|\.)lovableproject(-dev)?\.com$/.test(h) || /(^|\.)beta\.lovable\.dev$/.test(h)) return true;
  return new URLSearchParams(window.location.search).get("sw") === "off";
}

async function unregisterStale() {
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(regs.filter((r) => r.active?.scriptURL.endsWith(SW) || r.installing?.scriptURL.endsWith(SW) || r.waiting?.scriptURL.endsWith(SW)).map((r) => r.unregister()));
}

/** Store every screen and every teacher recording once, quietly, so lessons open offline. */
async function warm() {
  const pages = ["/", "/reading", "/sounds", "/learn", "/quiz", "/test", "/profile", "/welcome",
    ...SOUND_CATEGORIES.map((c) => `/sounds/${c.id}`), ...SOUND_CATEGORIES.flatMap((c) => c.sets.map((s) => `/sounds/practice/${s.id}`))];
  const pageCache = await caches.open("qaf-pages");
  for (const p of pages) { if (!(await pageCache.match(p))) await pageCache.add(p).catch(() => {}); }
  const media = await caches.open("qaf-media");
  const urls = allRecordingUrls();
  for (let i = 0; i < urls.length; i += 6) {
    await Promise.allSettled(urls.slice(i, i + 6).map(async (u) => { if (!(await media.match(u))) await media.add(u); }));
  }
}

export async function setupOffline() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    if (refused()) { await unregisterStale(); return; }
    await navigator.serviceWorker.register(SW, { scope: "/" });
    await navigator.serviceWorker.ready;
    if (navigator.onLine) setTimeout(() => { void warm(); }, 3000);
  } catch { /* offline support is optional; the app works without it */ }
}
