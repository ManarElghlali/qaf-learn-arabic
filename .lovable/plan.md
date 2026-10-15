# Qaf — Production Readiness Audit and Plan

Nothing in the app was changed during this audit. This plan waits for your approval.

## 1. What the app is today (checked in the code)

- Built with TanStack Start (React 19, Vite 7). There are no accounts, no database and no Lovable Cloud.
- Learner progress, onboarding answers and the "premium" flag are saved only on the phone (localStorage).
- One online service: the pronunciation checker (`/api/public/check-reading`). It sends each recording to an AI model (Gemini 3.1 Flash Lite) through the Lovable AI Gateway. The private key stays on the server.
- 677 teacher recordings are hosted online. Offline mode is on for published builds only.
- Already done: manifest, icons, safe areas, Privacy page and the Profile link.

## 2. Subscription and paywall (checked)

- The paywall is a **demo**. "Subscribe" turns premium on for free, and "Restore purchase" always says nothing was found.
- It shows **$4.99/month and $29.99/year**. Your brief proposes **$5.99/month and $39.99/year (about $3.33/month, billed yearly)**. The prices won't change until you approve.
- Premium doesn't unlock anything, and nothing limits how many AI checks a learner can use.
- Apple and Google will reject the app if the demo paywall stays in. They also require their own store billing for digital subscriptions.

## 3. Pronunciation checker security (checked)

Already in place:
- Recordings are limited to 2 MB.
- Only a short, fully vowelled Arabic word is accepted.
- The key stays on the server.
- Failed calls are retried at most once.
- Audio is not stored by the app.

Gaps:
- The checker is open to anyone on the internet. There's no per-device or per-IP limit, no daily cap and no limit on simultaneous checks. Someone could run up AI costs by calling it directly.
- Free and premium limits can't be enforced, because the only "premium" signal is a phone setting anyone can change.
- Progress, scores and the premium flag can be edited on the device. That's acceptable for learning progress, but not for paid access.
- Recording length isn't checked. Only file size is.
- Any website can call the checker (no CORS restriction).

## 4. AI cost (estimates, not actual bills)

Each check sends about 2,500 words of instructions, roughly 2–4 seconds of audio and a short answer back. At current published Flash Lite rates, that's **roughly $0.0005–$0.001 per check**. I haven't confirmed this against real billing yet, so the first step is to measure actual usage on the gateway.

Monthly AI cost, at about $0.001 per check:

| Learners | 10 checks | 30 checks | 100 checks |
|---|---|---|---|
| 100 | $1 | $3 | $10 |
| 1,000 | $10 | $30 | $100 |
| 10,000 | $100 | $300 | $1,000 |
| 50,000 | $500 | $1,500 | $5,000 |

## 5. Break-even (estimate)

Assumptions:
- Monthly $5.99, store fee 15% (small-business rate), so about **$5.09** per payer, before tax and refunds.
- Yearly $39.99 at 15%, so about **$2.83/month** per payer.
- Fixed yearly costs: Apple $99/yr and Google $25 once (about $10/month together).
- One premium user using all 100 checks costs about $0.10/month. Free users get 5 lifetime trials, about $0.005 each.

| Monthly payers | 10 | 25 | 50 | 100 | 500 | 1,000 |
|---|---|---|---|---|---|---|
| Net revenue | $51 | $127 | $255 | $509 | $2,545 | $5,090 |

About **3 monthly payers** cover the fixed costs. AI cost stays well under 5% of revenue as long as the checker is capped. Hosting is listed separately as an unknown.

## 6. Proposed stages (each one needs your approval)

1. **Measure:** check real AI usage and prompt size, and build a test set of recordings covering every reading rule. Nothing changes for learners.
2. **Protect the checker:** limit requests per IP and device, cap simultaneous checks, reject recordings over 6 seconds, restrict which apps and sites can call it, and add a daily cost safety cap. **This needs Lovable Cloud** (a small database to count usage). No learner sign-up.
3. **Enforce limits:** 5 free AI checks, then 100 per month for Premium, counted on the server.
4. **Real store billing:** Apple and Google subscriptions inside the app, with Restore. The options are RevenueCat (free up to $2.5k/month revenue, then 1%) or building it directly, which is more work. The server will verify each purchase before unlocking Premium. Remove the demo paywall.
5. **Native app:** a Capacitor build plus microphone permission text. The reminder toggle will either become a real notification or be hidden.
6. **Optional:** a shorter checker prompt. I'll only adopt it if it matches the current answers on the test set.

All quizzes stay local and use no AI.

## 7. Decisions needed from you

- Approve the prices ($5.99 / $39.99).
- Use Lovable Cloud for the checker limits? (Required for stages 2–4.)
- RevenueCat or direct billing?
- Make the daily reminder real, or hide it?

## Testing and rollback

- Each stage ships separately and must pass the existing 48 tests plus new tests for that stage.
- Limits can be raised or switched off without an app update.
- Your earlier versions stay in history, so any stage can be undone.
