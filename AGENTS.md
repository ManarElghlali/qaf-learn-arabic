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

- Keep word artwork keyed by the stable curriculum word ID in a shared illustration registry and render it through WordIllustration, so Learn and Quiz always show the same image without coupling artwork to pronunciation data.
- Derive Home progress and Learn continuation through the shared learning-summary module using existing saved completion IDs, so both screens agree without changing the progress schema.
- Apply learning surfaces, sound-control sizes, navigation safe areas and color roles through shared styles and the existing Button component, so the five screens remain visually coherent without altering their engines.
- Render Home curriculum destinations through a shared disclosure component; only implemented lessons link to Learn, keeping progression discoverable without exposing unfinished content as actions.
- Define every lesson with a stable word bank and saved-progress key in the shared lessons registry, selecting it through the lesson search parameter, so Short and Long Sounds reuse isolated activities.
- Keep Madd, Tanween and Shaddah word banks in dedicated browser-safe modules with non-overlapping stable IDs and a separate saved-progress key per unit, so additions cannot rewrite earlier curriculum or saved progress.
- Use the shared reading-sounds parser with literal Tanween and Shaddah curriculum boundaries and grouped Madd/diphthongs, so assessment feedback matches approved tiles including gemination and exceptional hamza spellings.
- Gate each Short Sounds unit through unitState in the lessons registry (all words learned → quiz pass → reading-test pass → next unit unlocks), storing quiz/test results per unit in progress.units, so units stay independent and sequential.
- Judge reading-test answers syllable by syllable (consonant + exact short vowel) in the server route /api/public/check-reading with an audio-capable model, so harakat errors are caught rather than only the word's letters.
- Keep unit selection on Home and completion-gated next-unit actions; in-unit Learn/Quiz/Test navigation preserves the selected lesson so activities never switch word banks.
- Keep quiz question controls in a shared presentation module with explicit answer-gated advancement, so selection feedback stays visible without changing scoring or word selection.
- Use the opt-in viewport-height AppShell layout for Learn and Quiz with in-flow navigation and shared height-aware activity styles, so content and answer feedback fit without scrolling or changing other screens.
- Keep Sound Practice in its own module with its own saved-progress key and sound-keyed recordings shared with Reading, so the two paths never change each other's progress or content.
- Keep first-run state in its own onboarding module and storage key, auto-completing it for learners with existing progress, so onboarding can never reset or loop over learning data.
- Register the offline service worker only through the guarded offline module (never in dev or preview), with NetworkFirst pages and all built screens precached, so unvisited lessons still open offline without serving stale updates.
- Keep public/manifest.webmanifest as the single installability manifest and reference real public icons from the root head; Vite manifest generation stays disabled to avoid duplicate metadata.
- Re-record or audit teacher audio only through scripts/audio-audit (two independent AI listeners must accept a take; results.json records status), so corrections stay traceable and never silently replace approved Arabic text.
- Gate /api/public/check-reading through the service-role-only consume_check database function (anonymous hashed device + IP, daily/global caps, free quota flag in check_limits), so AI cost limits are enforced server-side and adjustable without an app update.
- Schedule daily reminders only through src/lib/reminders.ts (Capacitor LocalNotifications on native, permission asked after an in-app explanation), so no push server or recurring cost is needed.
- Native shells (capacitor.config.ts) load dist/client and call the checker via VITE_API_BASE; the checker's CORS allow-list covers capacitor://localhost and https://localhost.
- Native builds run `bun run build:native` (CAPACITOR=1 build, scripts/native-shell.ts renders a static index.html, then cap sync), so the web build stays server-rendered while ios/ and android/ get a static shell.
- Premium check limits come only from server-side premium_entitlements rows (per billing period, counted in check_premium_usage by consume_check); rows must be written only after store receipt verification, never from the client.
- Premium is granted only by /api/public/verify-receipt (src/lib/store-verify.server.ts) after App Store Server API / Play Developer API confirm an active subscription; the client premium flag is a display cache synced from /api/public/check-status, so it can never unlock checks.
- Free vs Premium access is decided only in src/lib/access.ts (FREE_WORDS = first 10 Fatha words, 5 free quizzes, Fatha sound set; canOpenUnit/canOpenSoundSet), and check-reading re-checks free words server-side, so no screen or tampered client can open Premium content or checks.
- Content unlocks come only from an Ed25519 Premium pass signed by the server (QAF_PASS_PRIVATE_KEY; public key in access.ts) bound to the device hash and expiring at period end + 3 days, so Premium works offline without trusting editable settings.
- iOS purchases are verified from StoreKit's signed JWS (x5c chain to Apple Root CA G3) then the App Store Server API; bare transaction numbers are rejected; grant_entitlement keeps one phone per subscription with limited moves, so copied receipts can't share Premium.
- The offline service worker is registered only for Premium (setupOffline(premium)); free learners get caches cleared and an OfflineGate message, so offline learning stays a Premium feature.
- check_limits.billing_live (plus VITE_STORE_TESTING=1 for sandbox builds) gates the Subscribe UI; until then the paywall shows "Premium is coming soon", so the production paywall is never shown before purchases are tested.
