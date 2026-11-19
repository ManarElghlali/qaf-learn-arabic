# Qaf security and cost controls

All settings live in the single `check_limits` row (Lovable Cloud → Database). Only the server can read or change them; changes apply immediately to the published app — no app update needed.

| Setting | Default | Meaning |
| --- | --- | --- |
| `enabled` / `ai_kill_switch` | true / false | Emergency stop: `enabled=false` or `ai_kill_switch=true` blocks every new paid check. |
| `ai_monthly_budget_usd` | 50 | New checks stop when this calendar month's (UTC) spent + in-progress estimate would pass it. |
| `ai_daily_budget_usd` | 10 | Same, per UTC day, so one bad day can't use the whole month. |
| `usd_per_credit` | 0.25 | Assumed dollar value of one Lovable credit (monthly-plan rate). Adjust to your plan. |
| `credits_per_input_token` / `credits_per_output_token` | 0.000002 / 0.000006 | Gateway catalog prices for google/gemini-3.1-flash-lite (audio-input rate used for all prompt tokens, so estimates run high). |
| `reserve_credits_per_check` | 0.01 | Held while a check runs; also charged when the outcome is unknown (timeout/5xx). |
| `free_lifetime` / `enforce_free_quota` | 5 / true | Free checks per device ID. |
| `premium_monthly` | 100 | Premium checks per billing month. |
| `free_ip_daily` | 20 | Free checks per hashed network per UTC day (limits device-ID reset abuse). |
| `device_daily` / `ip_daily` / `global_daily` | 150 / 400 / 20000 | Abuse caps (kept charged even when a check fails). |
| `max_attempts_per_request` | 3 | Paid attempts allowed for the same recording. |
| `active_timeout_seconds` | 45 | A check with no result after this is settled as unknown (budget charged, quota refunded). |

## Monitoring
- Database view `ai_spend_overview`: spend per day.
- `GET /api/public/admin-monitor` and `GET /api/public/verify-receipt` with `Authorization: Bearer <QAF_ADMIN_TOKEN>` return the spend report and recent purchase failures. Without that secret configured both always answer 401.

## Cost basis
Credits per token come from the AI Gateway model catalog (`/v1/models`). The gateway response reports total prompt/completion tokens but not the audio/text split, so the server prices all prompt tokens at the audio rate (≈0.004 credits per check estimated vs ≈0.0024 billed in gateway logs). Exact billed credits are visible in the project's AI request logs; dollars depend on how the workspace buys credits.
