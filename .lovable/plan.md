# Qaf — Free vs Premium: Audit and Plan

Nothing has been changed yet. This plan follows your "Final Free vs Premium Requirements" and waits for your approval.

## 1. Audit: what exists today

| Requirement | Status |
|---|---|
| Prices $5.99/month, $39.99/year | Done |
| Subscribe and Restore through Apple / Google | Built, not yet tested with real store accounts |
| Premium granted only after the server checks with the store | Done |
| 100 AI checks per billing month for Premium | Done and tested |
| Daily safety limits | Done, kept as an extra protection |
| 5 AI checks total for free learners | Built, **off** (stays off) |
| No account needed | Done |
| Free plan = 10 Fatha words + 5 quizzes | **Missing.** Everything is open |
| Sound Practice: only Fatha free | **Missing.** All sets are open |
| Premium unlocks everything | **Missing.** Premium only raises the AI limit |
| Offline only for Premium | **Missing.** Offline mode is on for everyone |
| Paywall wording | **Wrong.** It says lessons stay free |
| A copied receipt can't unlock Premium | **Missing.** Apple purchases are checked by number only |

## 2. Free plan, exactly

- **Words:** the first 10 words of the existing approved Fatha list, in their current order, with their recordings and Learn screens. No words are changed or added.
- **Quizzes:** 5 quizzes built only from those 10 words, using the existing quiz screens.
- **Reading test:** a test on those 10 words. It uses the 5 free AI checks.
- **Sound Practice:** only the Fatha (فَتْحَة) set is open.
- **Everything else is locked:**
  - the other Fatha words
  - every other unit, quiz and test
  - every other sound set

  Locked items show a lock and open the Premium screen. Saved progress is kept but stays locked.

## 3. How the free limits are enforced

- **One shared list decides what's free:** 10 word IDs plus the Fatha sound set. Home, Learn, Quiz, Test, Sound Practice and the links between them all read from it, so no screen can open locked content.
- **The AI checker on the server also uses this list:** a free device can only have the 10 free words checked. This holds even if someone tampers with the app.
- **Premium status comes only from a pass signed by the server.** A setting changed on the phone can't unlock anything.

## 4. How offline is restricted to Premium

- **Free learners:**
  - Offline storage is switched off for them, and anything saved earlier is cleared.
  - Free lessons only open when the phone can reach Qaf. Without internet, they see "Connect to the internet to continue, or go Premium to learn offline."
- **Premium learners:**
  - Lessons, audio and screens are saved for offline use.
  - The signed Premium pass is checked on the phone, with no internet needed, until the billing period ends, plus a 3-day grace period.
  - When the pass runs out, offline access stops until the app reconnects and the subscription is confirmed again. Saved files are then cleared if Premium has ended.
- **Honest limit:** in the phone apps, the app's screens and Arabic text are installed with the app. A determined person could tamper with their own copy to read locked text offline. Recordings and AI checks stay protected by the server. This is normal for learning apps and doesn't put paid features at risk.

## 5. Purchase security without accounts

- **Apple:**
  - Each purchase carries a private code tied to the learner's device.
  - The app sends Apple's signed purchase record, and the server checks Apple's signature.
  - A copied transaction number is rejected.
- **Google:**
  - Each purchase carries the same private device code.
  - The purchase token is checked with Google and acknowledged.
- **Restore:**
  - Apple and Google only return purchases made by the account signed in on that phone. The server checks them, then moves Premium to that phone.
  - Only one phone has Premium at a time, which stops sharing.
- **No Qaf account is needed.** One would only be needed to share a subscription between iPhone and Android.

## 6. Changes

1. Free-access list and the locks across all screens and links.
2. Free quiz mode with 5 quizzes and a free test on the 10 words.
3. Sound Practice locks, except Fatha.
4. Server-side free-word check in the AI checker.
5. Signed Premium pass, and offline mode only for Premium.
6. Secure Apple and Google verification, plus one phone at a time.
7. New paywall wording, and the paywall opens when a learner taps locked content or finishes the free session.
8. Tests for:
   - locks
   - copied receipt rejected
   - Restore on a new phone
   - offline pass expiry
   - free learners offline

   All existing tests must still pass.
9. The 5-free-check limit stays off until real store purchases and the full free-to-Premium journey are tested on both iPhone and Android.

Unchanged: Arabic text, recordings, existing quizzes, progress and reminders.

## 7. Confirmed details

### The 5 free quizzes

All 5 quizzes use only the 10 free Fatha words. They use the existing quiz screens and scoring, and none of them use AI. Each quiz has 6 questions.

| Quiz | Words | Question type |
|---|---|---|
| 1 | Words 1–5 | Listen and pick the word |
| 2 | Words 6–10 | Listen and pick the word |
| 3 | All 10 | Match the picture to the word |
| 4 | All 10 | Build the word from letter blocks |
| 5 | All 10 | Mixed review of all three types |

Quizzes open in order: each one unlocks after the one before it is finished.

### Free reading test

- One reading test on the 10 free words.
- It shares the same 5 AI checks in total. Quizzes never add extra checks.
- When the checks run out, the test shows the Premium screen.
- On the server, the checker only accepts those 10 words from free devices.

### Rollout: locks now, Premium in testing only

- The free locks are switched on now, everywhere, and tested.
- Premium can only be unlocked with Apple/Google test (sandbox) purchases in TestFlight and Play internal-testing builds.
- The public app and website show locked items with "Premium is coming soon". There's no Subscribe button until the purchase flow has been tested on both iPhone and Android.
- The 5-check limit stays off until then.
- One switch on the server turns on the final paywall and the 5-check limit together, with no app update needed.

### Purchase scenarios that will be verified with sandbox accounts

| Case | Expected result |
|---|---|
| Buy monthly or yearly | Premium is active after the server checks it |
| Restore on the same phone, or a new or reset phone | Premium comes back if the store account has an active subscription |
| Copied receipt or transaction number on another phone | Rejected |
| Renewal | The next server check extends Premium, and 100 new checks start |
| Cancellation | Premium lasts until the paid period ends, then turns off |
| Expiry, refund or revoked purchase | Premium turns off at the next check, and offline files are cleared |
| Offline Premium | Works until the period ends, plus 3 days, without internet; after that it must reconnect |

Sandbox subscriptions renew every few minutes, so a whole year can be tested in an hour. Each case will be checked on both platforms, and I'll report the results.

### Limits of not having accounts

- **Tied to the phone and store account.** If the app is deleted, Restore is needed, and it only works when signed in to the same Apple ID or Google account.
- **No sharing between platforms.** An iPhone subscription can't unlock an Android phone, and the reverse. This would need accounts.
- **One phone at a time.** A family sharing one Apple ID can move Premium between phones with Restore, but only one phone has it at a time.
- **Unused AI checks belong to the phone.** If a learner restores on a new phone, the month's count carries over with the subscription. Free checks don't carry over.
- **Offline content is stored in the app.** A determined person could tamper with their own copy to read locked text. Recordings, AI checks and Premium status stay protected by the server.
- **Support** can't look anyone up by name or email. It can only help using store receipts.

## Technical notes

- **Free list:** `FREE_ACCESS` in the lessons registry, read through `canAccess(item, entitlement)`.
- **Server checks:**
  - `check-reading` rejects words that aren't free for non-premium device hashes.
  - The `premium_entitlements` table gets a unique original-transaction key, bound to one device hash.
- **Apple:** `appAccountToken` is a UUID derived from the device. Verify StoreKit 2's `jwsRepresentation` by checking its x5c chain against Apple Root CA G3 using WebCrypto.
- **Google:** send `obfuscatedAccountId` and call acknowledge.
- **Premium pass:** an Ed25519-signed token (device hash, period end). The public key is in the app.
- **Offline:** the offline module registers the service worker only when the pass is valid. Otherwise it unregisters it and clears the caches. Free routes check connectivity with a ping before loading.
