// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { existsSync } from "node:fs";
import { cp, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";
import type { Plugin } from "vite";

// Phone-app builds (CAPACITOR=1) always finish in dist/client, so move the finished site into
// the folder capacitor.config.ts points at (.output/public) once pages are prerendered.
function capacitorWebAssets(): Plugin {
  return {
    name: "qaf-capacitor-web-assets",
    // Sorted after every other plugin, so the copy runs once the start page is prerendered.
    enforce: "post",
    apply: "build",
    buildApp: {
      order: "post",
      async handler() {
        const from = resolve("dist/client");
        const to = resolve(".output/public");
        if (!existsSync(join(from, "index.html"))) {
          throw new Error(`qaf-capacitor-web-assets: ${from} has no index.html to publish for Capacitor`);
        }
        await rm(to, { recursive: true, force: true });
        await cp(from, to, { recursive: true });
        console.log(`[qaf] copied ${from} -> ${to}`);
      },
    },
  };
}

const native = process.env["CAPACITOR"] === "1";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    // Native builds (CAPACITOR=1) prerender the home page to static HTML for Capacitor; the web build stays server-rendered.
    ...(native ? { pages: [{ path: "/" }], prerender: { enabled: true, autoStaticPathsDiscovery: false } } : {}),
  },
  vite: {
    plugins: [...(native ? [capacitorWebAssets()] : []), VitePWA({
      strategies: "generateSW",
      registerType: "autoUpdate",
      injectRegister: null,
      devOptions: { enabled: false },
      manifest: false,
      filename: "sw.js",
      outDir: "dist/client",
      workbox: {
        globDirectory: "dist/client",
        globPatterns: ["**/*.{js,css,jpg,png,svg,ico,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: null,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: ({ request, url }) => request.mode === "navigate" && !url.pathname.startsWith("/~oauth") && !url.pathname.startsWith("/api/"),
            handler: "NetworkFirst",
            options: { cacheName: "qaf-pages", networkTimeoutSeconds: 4, matchOptions: { ignoreSearch: true }, expiration: { maxEntries: 60 } },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/__l5e/assets-v1/") || /^\/assets\/.+\.mp3$/.test(url.pathname),
            handler: "CacheFirst",
            options: { cacheName: "qaf-media", expiration: { maxEntries: 2000 }, cacheableResponse: { statuses: [0, 200] } },
          },
        ],
      },
    })],
  },
});
