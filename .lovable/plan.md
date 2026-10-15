# Qaf — Paid App Model: Audit and Plan

Nothing has been changed. This plan waits for your approval.

## 1. Audit: what exists today

| Requirement | Status |
|---|---|
| Prices $5.99/month, $39.99/year | Done (store price shown when available) |
| Subscribe and Restore through Apple / Google | Built, not yet tested with real store accounts |
| Premium granted only by the server after store check | Done |
| 100 AI checks per billing month for Premium | Done and tested on the live database |
| Daily safety limits (device, network, global) | Done, separate from the monthly allowance |
| 5 AI checks total for free learners | Built, **switched off** (stays off as you asked) |
| No account needed | Done (anonymous device ID) |
| Free plan limited to a few intro lessons | **Missing.** Every unit, lesson, quiz, test and Sound Practice set is open to everyone |
| Premium unlocks all content | **Missing.** Premium currently only raises the AI check allowance |
| Paywall text matches the model | **Wrong.** It says "All lessons, recordings and quizzes stay free" |
| Paywall shown when free content ends | **Missing.** It only appears when AI checks run out |
| Safe against claiming someone else's subscription | **Missing.** Apple purchases are checked by transaction number only, which can be copied |
| Premium works offline | Partly: a saved Premium flag exists, but nothing uses it to lock or unlock content yet |

## 2. Accounts: not needed

Premium can be managed safely without sign-up:

- **Apple:** each purchase gets a private code linked to the learner's device. The app sends Apple's signed purchase record, and the server checks Apple's signature. A copied transaction number on its own will be rejected.
- **Google:** the purchase carries the same private device code. Google only gives the purchase token to the Google account that paid for it.
- **Restore:** on a new or reset phone, Restore asks Apple or Google directly. They only return purchases made by the Apple ID or Google account signed in on that phone. The server checks the record and moves Premium to that phone.
- **Limits:** one active phone per subscription at a time. When it moves, the previous phone loses Premium the next time it connects. This stops sharing without needing accounts.

Learners do need to stay signed in to their own Apple ID or Google account on the phone. Accounts would only matter if you later want one subscription shared between iPhone, Android and the web.

## 3. Proposed changes

1. **Free plan:** an "intro" set marked in the lessons list, with its lessons, recordings, quiz and reading test all included so learners get one complete session. Everything else shows a lock that opens the Premium screen. Existing progress is kept, never reset.
2. **Premium unlock:** every unit, lesson, quiz, test and Sound Practice set opens. Locking is applied in one shared place so each screen behaves the same way.
3. **Paywall wording and timing:** remove the "everything stays free" line and list what Premium unlocks. Show the Premium screen when a learner taps locked content or finishes the free session.
4. **Secure purchase check:**
   - Apple: verify Apple's signed purchase record, not just the number.
   - Google: verify the token.
   - Both: check the device code and allow one active phone per subscription.
5. **Offline:** the server signs a Premium pass that the app can check without internet, valid until the billing period ends plus a short grace period. Content you have already downloaded stays available offline.
6. **5-free-check limit:** stays switched off. It will only be turned on after the full free-to-Premium journey and real store purchases have been tested.
7. **Tests:**
   - Unlocking and locking content
   - Rejecting a copied receipt
   - Moving Premium to another phone with Restore
   - Offline pass expiry
   - Existing checks still pass

Lessons, Arabic text, recordings, quizzes, progress, the reminder and offline mode all stay the same.

## 4. Honest limits

- The lessons are stored inside the app so they work offline. Someone determined enough could tamper with their own copy to unlock lessons. This is normal for offline learning apps. AI checks and Premium itself can't be faked, because they're checked on the server.
- Purchases can only be tested once your Apple and Google developer accounts and products exist.

## 5. Decisions needed

1. **What is free?** Option A: the first 5 Fatha words, plus their quiz and reading test. Option B: the whole Fatha unit.
2. **Sound Practice:** should one free sound set be open, or should it all be Premium?
3. **Learners who already have progress in later units:** should they keep access, or be locked like everyone else?

## Technical notes

- Apple: set `appAccountToken` (a device-derived UUID) when buying, send StoreKit 2 `jwsRepresentation`, and verify the x5c chain up to the Apple Root CA G3 using WebCrypto.
- Google: set `obfuscatedAccountId` and acknowledge the purchase.
- `premium_entitlements` gets a unique `original` subscription key, linked to one device hash at a time.
- The offline pass is signed with Ed25519: the private key stays on the server, the public key is in the app.
- The gate lives in the lessons registry (`isLocked(unit, item, premium)`).
