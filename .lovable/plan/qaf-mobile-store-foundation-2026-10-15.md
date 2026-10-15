# Qaf mobile-store foundation

## Verified starting point
- Qaf uses TanStack Start, React 19 and Vite; the current package specifies Vite 8. The production command is `bun run build` (`vite build`), with client assets configured for `dist/client` and a separate server build.
- The viewport already includes `viewport-fit=cover`. Shared headers and bottom navigation already apply safe-area insets, including one-screen Learn and Quiz layouts. Preserve these rather than adding duplicate padding.
- There is no public manifest or dedicated mobile icon set. Vite currently has `manifest: false`; the default favicon remains.
- There is no privacy page or Profile privacy link.
- Existing offline support uses a guarded production service worker. Pronunciation assessment sends audio to the Lovable AI Gateway; third-party retention and processing terms still require verification.
- The existing screen background is warm ivory, not white. Use the requested white manifest background without changing the app’s existing palette.

## Proposed changes after approval
1. **Home-screen identity:** Add one public manifest named “Qaf Learn Arabic”, short name “Qaf”, start URL `/`, standalone display, portrait orientation, white background and Qaf’s deep-green brand theme color. Link it from the shared head with mobile-app-capable tags.
2. **Matching icons:** Create a clean Qaf ق brand mark, export 192px and 512px PNG icons, a separately padded maskable icon, a 180px Apple touch icon and a matching favicon. Reference real public files; no placeholder icons.
3. **Screen edges:** Retain existing safe-area rules, check headers/navigation on representative phone sizes and fix only verified clipping. Preserve the one-screen Learn and Quiz experience.
4. **Privacy page:** Add `/privacy`, linked from Profile settings, with readable headings, page-specific share metadata and a return path. Explain microphone purpose, secure third-party speech assessment, localStorage progress/onboarding, offline caches, and local data removal. Use **Manarelghlalii@gmail.com** for public support. State that Qaf does not permanently save or sell assessment recordings only to the extent supported by verified handling; do not promise that AI providers retain nothing without confirming their terms. Flag unresolved processing/retention details before finalizing the policy.
5. **Offline preservation:** Include Privacy in the existing offline page list; keep service-worker registration guards and current lesson/audio caches intact.

## Validation
- Check manifest fields, exact icon dimensions, maskable safe zone and all icon URLs.
- Verify Profile → Privacy → return navigation and privacy metadata.
- Check phone-size layouts without duplicate safe-area spacing or activity scrolling.
- Run existing relevant navigation/learning tests; confirm Reading, Sound Practice and saved progress are unchanged.
- Check preview diagnostics. Actual install prompts, offline service-worker behavior, notch handling and native microphone permissions require published/real-device testing; do not claim these from preview tests.

## Technical scope
Use `public/manifest.webmanifest` as the single manifest source while keeping Vite manifest generation disabled. Update the root head, add the Privacy leaf route, use the existing Button and AppShell, and update only the existing offline warm list if appropriate. Record the manifest ownership rule in AGENTS.md. No new packages, backend, accounts, billing, pricing changes or deployment in this stage.

## What this does not complete
These changes establish the web/mobile foundation, not App Store or Play Store approval. Android TWA still needs signing, Digital Asset Links and store testing. iOS/Capacitor still needs a compatible static packaging configuration, native permissions, an online assessment URL, cloud signing and real-device checks.

The uploaded production-readiness brief remains a separate approval-gated workstream: server-side subscription verification and quotas, abuse protection, provider privacy verification, measured AI costs, profitability scenarios and store purchase lifecycle tests. Those require further evidence and decisions; this plan does not authorize implementation of them or certify store compliance.

## Approval requested
Approve only the manifest, icons, privacy page, Profile link and necessary safe-area/offline integration above. Leave all lessons, recordings, progress, quiz/test logic, prices and services unchanged.