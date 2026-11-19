ALTER TABLE public.check_limits
  ADD COLUMN ai_monthly_budget_usd numeric(10,2) NOT NULL DEFAULT 50,
  ADD COLUMN ai_daily_budget_usd numeric(10,2) NOT NULL DEFAULT 10,
  ADD COLUMN usd_per_credit numeric(8,4) NOT NULL DEFAULT 0.25,
  ADD COLUMN credits_per_input_token numeric(14,10) NOT NULL DEFAULT 0.000002,
  ADD COLUMN credits_per_output_token numeric(14,10) NOT NULL DEFAULT 0.000006,
  ADD COLUMN reserve_credits_per_check numeric(10,6) NOT NULL DEFAULT 0.01,
  ADD COLUMN ai_kill_switch boolean NOT NULL DEFAULT false,
  ADD COLUMN free_ip_daily integer NOT NULL DEFAULT 20,
  ADD COLUMN max_attempts_per_request integer NOT NULL DEFAULT 3,
  ADD COLUMN active_timeout_seconds integer NOT NULL DEFAULT 45;

COMMENT ON COLUMN public.check_limits.usd_per_credit IS 'Assumed USD value of one Lovable credit (monthly plan rate). Edit to match the plan that funds AI usage.';
COMMENT ON COLUMN public.check_limits.credits_per_input_token IS 'Credits per prompt token. Set to the model audio-input rate (highest input rate), so estimates are conservative.';
COMMENT ON COLUMN public.check_limits.ai_kill_switch IS 'Emergency stop: true blocks every new paid AI check immediately.';

CREATE TABLE public.ai_spend_daily (
  day date PRIMARY KEY,
  reserved_credits numeric(14,6) NOT NULL DEFAULT 0,
  spent_credits numeric(14,6) NOT NULL DEFAULT 0,
  requests integer NOT NULL DEFAULT 0,
  succeeded integer NOT NULL DEFAULT 0,
  failed integer NOT NULL DEFAULT 0,
  blocked_budget integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.check_requests (
  request_id text PRIMARY KEY,
  device_id text NOT NULL,
  ip_hash text NOT NULL,
  word text NOT NULL,
  status text NOT NULL CHECK (status IN ('active','done','failed','unknown')),
  attempts integer NOT NULL DEFAULT 1,
  premium boolean NOT NULL DEFAULT false,
  period_start timestamptz,
  spend_day date NOT NULL DEFAULT current_date,
  reserved_credits numeric(14,6) NOT NULL DEFAULT 0,
  spent_credits numeric(14,6) NOT NULL DEFAULT 0,
  result jsonb,
  failure text,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE INDEX check_requests_active_device_idx ON public.check_requests (device_id) WHERE status = 'active';
CREATE INDEX check_requests_active_started_idx ON public.check_requests (started_at) WHERE status = 'active';
CREATE INDEX check_requests_created_idx ON public.check_requests (created_at);

CREATE TABLE public.check_ip_free (
  ip_hash text NOT NULL,
  day date NOT NULL DEFAULT current_date,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (ip_hash, day)
);

GRANT ALL ON public.ai_spend_daily TO service_role;
GRANT ALL ON public.check_requests TO service_role;
GRANT ALL ON public.check_ip_free TO service_role;
ALTER TABLE public.ai_spend_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ip_free ENABLE ROW LEVEL SECURITY;

-- Gives back the learner-facing quota (free lifetime / Premium month) for a check that produced no result.
-- Daily abuse counters (device, IP, global) stay charged so failures cannot be used to loop paid calls.
CREATE OR REPLACE FUNCTION public.refund_check_quota(_device text, _premium boolean, _period timestamptz)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.check_device_usage SET lifetime = greatest(lifetime - 1, 0), updated_at = now() WHERE device_id = _device;
  IF _premium AND _period IS NOT NULL THEN
    UPDATE public.check_premium_usage SET count = greatest(count - 1, 0) WHERE device_id = _device AND period_start = _period;
  END IF;
END $$;

-- Settles checks whose worker never reported back: treated as possibly billed, quota given back.
CREATE OR REPLACE FUNCTION public.settle_stale_checks()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE l public.check_limits; r public.check_requests; n int := 0;
BEGIN
  SELECT * INTO l FROM public.check_limits WHERE id;
  FOR r IN SELECT * FROM public.check_requests
    WHERE status = 'active' AND started_at < now() - make_interval(secs => l.active_timeout_seconds)
    ORDER BY started_at FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE public.ai_spend_daily SET reserved_credits = greatest(reserved_credits - r.reserved_credits, 0),
      spent_credits = spent_credits + r.reserved_credits, failed = failed + 1, updated_at = now() WHERE day = r.spend_day;
    UPDATE public.check_requests SET status = 'unknown', spent_credits = spent_credits + r.reserved_credits,
      failure = 'stale', finished_at = now() WHERE request_id = r.request_id;
    PERFORM public.refund_check_quota(r.device_id, r.premium, r.period_start);
    n := n + 1;
  END LOOP;
  RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.prune_check_data()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  UPDATE public.check_requests SET result = NULL WHERE result IS NOT NULL AND finished_at < now() - interval '1 hour';
  DELETE FROM public.check_requests WHERE created_at < now() - interval '35 days' AND status <> 'active';
  DELETE FROM public.check_ip_free WHERE day < current_date - 7;
  DELETE FROM public.check_ip_usage WHERE day < current_date - 7;
  DELETE FROM public.receipt_diagnostics WHERE created_at < now() - interval '30 days';
$$;

-- Core admission decision. _enforce_free is passed by begin_check from check_limits.enforce_free_quota.
-- Every decision is serialised on today's spending row, so budget, per-device concurrency and quotas
-- are evaluated atomically even under simultaneous requests.
CREATE OR REPLACE FUNCTION public.begin_check_core(_request text, _device text, _ip text, _word text, _enforce_free boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE l public.check_limits; sp public.ai_spend_daily; r public.check_requests; d public.check_device_usage;
  e public.premium_entitlements; month_total numeric; est numeric; ipc int; g int; pc int := 0; ipf int; act int;
BEGIN
  SELECT * INTO l FROM public.check_limits WHERE id;
  IF NOT l.enabled OR l.ai_kill_switch THEN RETURN jsonb_build_object('allowed', false, 'reason', 'paused'); END IF;

  INSERT INTO public.ai_spend_daily(day) VALUES (current_date) ON CONFLICT DO NOTHING;
  SELECT * INTO sp FROM public.ai_spend_daily WHERE day = current_date FOR UPDATE;
  PERFORM public.settle_stale_checks();
  IF random() < 0.02 THEN PERFORM public.prune_check_data(); END IF;
  SELECT * INTO sp FROM public.ai_spend_daily WHERE day = current_date;

  -- Idempotency: the same recording is never evaluated twice.
  SELECT * INTO r FROM public.check_requests WHERE request_id = _request FOR UPDATE;
  IF FOUND THEN
    IF r.device_id <> _device THEN RETURN jsonb_build_object('allowed', false, 'reason', 'conflict'); END IF;
    IF r.status = 'done' THEN
      IF r.result IS NOT NULL THEN RETURN jsonb_build_object('allowed', false, 'reason', 'replay', 'result', r.result); END IF;
      RETURN jsonb_build_object('allowed', false, 'reason', 'duplicate');
    END IF;
    IF r.status = 'active' THEN RETURN jsonb_build_object('allowed', false, 'reason', 'in_progress'); END IF;
    IF r.attempts >= l.max_attempts_per_request THEN RETURN jsonb_build_object('allowed', false, 'reason', 'too_many_attempts'); END IF;
  END IF;

  SELECT count(*) INTO act FROM public.check_requests WHERE device_id = _device AND status = 'active';
  IF act > 0 THEN RETURN jsonb_build_object('allowed', false, 'reason', 'busy'); END IF;

  -- Spending protection (credits are converted from the USD budget).
  est := l.reserve_credits_per_check;
  SELECT coalesce(sum(spent_credits + reserved_credits), 0) INTO month_total
    FROM public.ai_spend_daily WHERE day >= date_trunc('month', current_date)::date;
  IF l.usd_per_credit <= 0
     OR (month_total + est) * l.usd_per_credit > l.ai_monthly_budget_usd
     OR (sp.spent_credits + sp.reserved_credits + est) * l.usd_per_credit > l.ai_daily_budget_usd THEN
    UPDATE public.ai_spend_daily SET blocked_budget = blocked_budget + 1, updated_at = now() WHERE day = current_date;
    RETURN jsonb_build_object('allowed', false, 'reason', 'budget');
  END IF;

  -- Quotas (same rules as consume_check, plus a free-tier cap per network).
  INSERT INTO public.check_device_usage(device_id) VALUES (_device) ON CONFLICT DO NOTHING;
  SELECT * INTO d FROM public.check_device_usage WHERE device_id = _device FOR UPDATE;
  IF d.day <> current_date THEN d.day_count := 0; END IF;
  SELECT coalesce(count, 0) INTO ipc FROM public.check_ip_usage WHERE ip_hash = _ip AND day = current_date;
  SELECT coalesce(count, 0) INTO g FROM public.check_daily_total WHERE day = current_date;
  IF coalesce(g, 0) >= l.global_daily THEN RETURN jsonb_build_object('allowed', false, 'reason', 'global'); END IF;
  IF coalesce(ipc, 0) >= l.ip_daily OR d.day_count >= l.device_daily THEN RETURN jsonb_build_object('allowed', false, 'reason', 'daily'); END IF;
  SELECT * INTO e FROM public.premium_entitlements WHERE device_id = _device AND period_end > now();
  IF e.device_id IS NOT NULL THEN
    INSERT INTO public.check_premium_usage(device_id, period_start) VALUES (_device, e.period_start) ON CONFLICT DO NOTHING;
    SELECT count INTO pc FROM public.check_premium_usage WHERE device_id = _device AND period_start = e.period_start FOR UPDATE;
    IF pc >= l.premium_monthly THEN RETURN jsonb_build_object('allowed', false, 'reason', 'premium_monthly'); END IF;
    UPDATE public.check_premium_usage SET count = pc + 1 WHERE device_id = _device AND period_start = e.period_start;
  ELSE
    IF _enforce_free AND d.lifetime >= l.free_lifetime THEN RETURN jsonb_build_object('allowed', false, 'reason', 'quota'); END IF;
    SELECT coalesce(count, 0) INTO ipf FROM public.check_ip_free WHERE ip_hash = _ip AND day = current_date;
    IF coalesce(ipf, 0) >= l.free_ip_daily THEN RETURN jsonb_build_object('allowed', false, 'reason', 'network'); END IF;
    INSERT INTO public.check_ip_free(ip_hash, count) VALUES (_ip, 1)
      ON CONFLICT (ip_hash, day) DO UPDATE SET count = check_ip_free.count + 1;
  END IF;

  UPDATE public.check_device_usage SET lifetime = d.lifetime + 1, day = current_date, day_count = d.day_count + 1, updated_at = now() WHERE device_id = _device;
  INSERT INTO public.check_ip_usage(ip_hash, count) VALUES (_ip, 1) ON CONFLICT (ip_hash, day) DO UPDATE SET count = check_ip_usage.count + 1;
  INSERT INTO public.check_daily_total(day, count) VALUES (current_date, 1) ON CONFLICT (day) DO UPDATE SET count = check_daily_total.count + 1;

  INSERT INTO public.check_requests(request_id, device_id, ip_hash, word, status, premium, period_start, spend_day, reserved_credits)
  VALUES (_request, _device, _ip, left(_word, 40), 'active', e.device_id IS NOT NULL, e.period_start, current_date, est)
  ON CONFLICT (request_id) DO UPDATE SET status = 'active', attempts = check_requests.attempts + 1, started_at = now(),
    ip_hash = EXCLUDED.ip_hash, premium = EXCLUDED.premium, period_start = EXCLUDED.period_start, spend_day = current_date,
    reserved_credits = EXCLUDED.reserved_credits, failure = NULL, finished_at = NULL, result = NULL;
  UPDATE public.ai_spend_daily SET reserved_credits = reserved_credits + est, requests = requests + 1, updated_at = now() WHERE day = current_date;

  RETURN jsonb_build_object('allowed', true, 'premium', e.device_id IS NOT NULL,
    'used', CASE WHEN e.device_id IS NOT NULL THEN pc + 1 ELSE d.lifetime + 1 END);
END $$;

CREATE OR REPLACE FUNCTION public.begin_check(_request text, _device text, _ip text, _word text)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT public.begin_check_core(_request, _device, _ip, _word, (SELECT enforce_free_quota FROM public.check_limits WHERE id));
$$;

-- Settles one check exactly once. _outcome: 'ok' (result delivered), 'failed' (provider refused before
-- generating; not billed) or 'unknown' (timeout/5xx/bad output; may be billed). Only 'ok' keeps the quota charge.
CREATE OR REPLACE FUNCTION public.finish_check(_request text, _outcome text, _credits numeric, _result jsonb, _failure text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE dday date; r public.check_requests; cost numeric;
BEGIN
  IF _outcome NOT IN ('ok','failed','unknown') THEN RAISE EXCEPTION 'bad_outcome'; END IF;
  SELECT spend_day INTO dday FROM public.check_requests WHERE request_id = _request;
  IF NOT FOUND THEN RETURN jsonb_build_object('settled', false, 'reason', 'missing'); END IF;
  INSERT INTO public.ai_spend_daily(day) VALUES (dday) ON CONFLICT DO NOTHING;
  PERFORM 1 FROM public.ai_spend_daily WHERE day = dday FOR UPDATE;
  SELECT * INTO r FROM public.check_requests WHERE request_id = _request FOR UPDATE;
  IF r.status <> 'active' THEN RETURN jsonb_build_object('settled', false, 'reason', 'not_active'); END IF;
  cost := CASE WHEN _outcome = 'failed' THEN 0 ELSE greatest(coalesce(_credits, r.reserved_credits), 0) END;
  UPDATE public.ai_spend_daily SET reserved_credits = greatest(reserved_credits - r.reserved_credits, 0),
    spent_credits = spent_credits + cost,
    succeeded = succeeded + CASE WHEN _outcome = 'ok' THEN 1 ELSE 0 END,
    failed = failed + CASE WHEN _outcome = 'ok' THEN 0 ELSE 1 END, updated_at = now()
  WHERE day = dday;
  UPDATE public.check_requests SET status = CASE _outcome WHEN 'ok' THEN 'done' WHEN 'failed' THEN 'failed' ELSE 'unknown' END,
    spent_credits = spent_credits + cost, result = CASE WHEN _outcome = 'ok' THEN _result END,
    failure = left(_failure, 200), finished_at = now()
  WHERE request_id = _request;
  IF _outcome <> 'ok' THEN PERFORM public.refund_check_quota(r.device_id, r.premium, r.period_start); END IF;
  RETURN jsonb_build_object('settled', true, 'credits', cost);
END $$;

CREATE OR REPLACE FUNCTION public.record_receipt_diagnostic(_platform text, _stage text, _code text, _detail text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  -- Caps growth from repeated invalid requests: at most 120 entries per hour are kept.
  IF (SELECT count(*) FROM public.receipt_diagnostics WHERE created_at > now() - interval '1 hour') >= 120 THEN RETURN; END IF;
  INSERT INTO public.receipt_diagnostics(platform, stage, code, detail)
  VALUES (left(_platform, 16), left(_stage, 40), left(_code, 80), left(_detail, 600));
END $$;

CREATE OR REPLACE FUNCTION public.ai_spend_report()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  WITH l AS (SELECT * FROM public.check_limits WHERE id),
  m AS (SELECT coalesce(sum(spent_credits),0) spent, coalesce(sum(reserved_credits),0) reserved,
          coalesce(sum(requests),0) requests, coalesce(sum(succeeded),0) succeeded, coalesce(sum(failed),0) failed,
          coalesce(sum(blocked_budget),0) blocked
        FROM public.ai_spend_daily WHERE day >= date_trunc('month', current_date)::date),
  t AS (SELECT * FROM public.ai_spend_daily WHERE day = current_date)
  SELECT jsonb_build_object(
    'killSwitch', l.ai_kill_switch, 'enabled', l.enabled, 'freeQuotaEnforced', l.enforce_free_quota,
    'usdPerCredit', l.usd_per_credit,
    'month', jsonb_build_object('budgetUsd', l.ai_monthly_budget_usd, 'spentCredits', m.spent, 'reservedCredits', m.reserved,
       'spentUsd', round(m.spent * l.usd_per_credit, 4), 'remainingUsd', round(l.ai_monthly_budget_usd - (m.spent + m.reserved) * l.usd_per_credit, 4),
       'requests', m.requests, 'succeeded', m.succeeded, 'failed', m.failed, 'blockedByBudget', m.blocked),
    'today', jsonb_build_object('budgetUsd', l.ai_daily_budget_usd, 'spentCredits', coalesce(t.spent_credits,0),
       'spentUsd', round(coalesce(t.spent_credits,0) * l.usd_per_credit, 4), 'requests', coalesce(t.requests,0),
       'failed', coalesce(t.failed,0), 'blockedByBudget', coalesce(t.blocked_budget,0)),
    'activeChecks', (SELECT count(*) FROM public.check_requests WHERE status = 'active'))
  FROM l, m LEFT JOIN t ON true;
$$;

CREATE VIEW public.ai_spend_overview WITH (security_invoker = true) AS
  SELECT d.day, d.requests, d.succeeded, d.failed, d.blocked_budget, d.spent_credits, d.reserved_credits,
    round(d.spent_credits * l.usd_per_credit, 4) AS spent_usd
  FROM public.ai_spend_daily d CROSS JOIN public.check_limits l WHERE l.id;
GRANT SELECT ON public.ai_spend_overview TO service_role;

REVOKE ALL ON FUNCTION public.refund_check_quota(text, boolean, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.settle_stale_checks() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prune_check_data() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.begin_check_core(text, text, text, text, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.begin_check(text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.finish_check(text, text, numeric, jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_receipt_diagnostic(text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ai_spend_report() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.begin_check(text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.begin_check_core(text, text, text, text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.finish_check(text, text, numeric, jsonb, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_receipt_diagnostic(text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.ai_spend_report() TO service_role;
GRANT EXECUTE ON FUNCTION public.settle_stale_checks() TO service_role;