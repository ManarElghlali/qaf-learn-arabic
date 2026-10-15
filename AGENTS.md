<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Word artwork is keyed by stable word ID in the illustration registry and rendered via WordIllustration, so Learn and Quiz match.
- Home progress and Learn continuation come from the shared learning-summary module over saved completion IDs.
- Shared styles and the Button component carry surfaces, sizes, safe areas and colors so screens stay coherent.
- Home destinations use a shared disclosure component; only implemented lessons link to activities.
- Every lesson has a stable word bank (own browser-safe module, non-overlapping IDs) and its own progress key in the lessons registry, selected by the lesson search param; in-unit navigation keeps that param.
- unitState gates units (learn → quiz pass → test pass) with results in progress.units, so units stay independent.
- Reading checks use the shared reading-sounds parser and are judged syllable by syllable in /api/public/check-reading.
- Quiz controls live in a shared presentation module with answer-gated advancement; Learn/Quiz use the opt-in one-screen AppShell layout.
- Sound Practice and onboarding each keep their own module and storage key, so they never alter learning progress.
- public/manifest.webmanifest is the only manifest; Vite manifest generation stays disabled.
- Teacher audio is re-recorded/audited only via scripts/audio-audit (two AI listeners; results.json tracks status).
- AI check limits are enforced only by service-role DB functions (consume_check, check_limits flags) so they change without app updates.
- Reminders are scheduled only through src/lib/reminders.ts (local notifications, permission after explanation).
- Native: `bun run build:native` makes a static shell from dist/client; shells call the checker via VITE_API_BASE with CORS for capacitor/https localhost.
- Free vs Premium is decided only in src/lib/access.ts and re-checked server-side in check-reading.
- Premium unlocks come only from a server-signed Ed25519 pass (QAF_PASS_PRIVATE_KEY) bound to the device hash; entitlements are written only by verify-receipt after store verification (iOS signed JWS chained to Apple Root G3, never bare transaction IDs; one phone per subscription).
- The offline service worker is registered only for Premium via the guarded offline module (never dev/preview); free learners get caches cleared and OfflineGate.
- check_limits.billing_live (or VITE_STORE_TESTING=1) gates Subscribe; otherwise the paywall shows "coming soon".
