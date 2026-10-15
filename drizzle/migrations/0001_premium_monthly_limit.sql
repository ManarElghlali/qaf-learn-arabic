CREATE TABLE public.premium_entitlements (
  device_id text PRIMARY KEY,
  platform text NOT NULL CHECK (platform IN ('ios','android')),
  product_id text NOT NULL,
  original_transaction_id text NOT NULL UNIQUE,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  verified_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.check_premium_usage (
  device_id text NOT NULL,
  period_start timestamptz NOT NULL,
  count int NOT NULL DEFAULT 0,
  PRIMARY KEY (device_id, period_start)
);
GRANT ALL ON public.premium_entitlements, public.check_premium_usage TO service_role;
ALTER TABLE public.premium_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_premium_usage ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.consume_check(_device text, _ip text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE l public.check_limits; d public.check_device_usage; e public.premium_entitlements; ipc int; g int; pc int;
BEGIN
  SELECT * INTO l FROM public.check_limits WHERE id;
  IF NOT l.enabled THEN RETURN jsonb_build_object('allowed', false, 'reason', 'paused'); END IF;
  INSERT INTO public.check_device_usage(device_id) VALUES (_device) ON CONFLICT DO NOTHING;
  SELECT * INTO d FROM public.check_device_usage WHERE device_id = _device FOR UPDATE;
  IF d.day <> current_date THEN d.day_count := 0; END IF;
  SELECT coalesce(count,0) INTO ipc FROM public.check_ip_usage WHERE ip_hash = _ip AND day = current_date;
  SELECT coalesce(count,0) INTO g FROM public.check_daily_total WHERE day = current_date;
  IF coalesce(g,0) >= l.global_daily THEN RETURN jsonb_build_object('allowed', false, 'reason', 'global'); END IF;
  IF coalesce(ipc,0) >= l.ip_daily OR d.day_count >= l.device_daily THEN RETURN jsonb_build_object('allowed', false, 'reason', 'daily'); END IF;
  SELECT * INTO e FROM public.premium_entitlements WHERE device_id = _device AND period_end > now();
  IF e.device_id IS NOT NULL THEN
    INSERT INTO public.check_premium_usage(device_id, period_start) VALUES (_device, e.period_start) ON CONFLICT DO NOTHING;
    SELECT count INTO pc FROM public.check_premium_usage WHERE device_id = _device AND period_start = e.period_start FOR UPDATE;
    IF pc >= l.premium_monthly THEN RETURN jsonb_build_object('allowed', false, 'reason', 'premium_monthly'); END IF;
    UPDATE public.check_premium_usage SET count = pc + 1 WHERE device_id = _device AND period_start = e.period_start;
  ELSIF l.enforce_free_quota AND d.lifetime >= l.free_lifetime THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'quota');
  END IF;
  UPDATE public.check_device_usage SET lifetime = d.lifetime + 1, day = current_date, day_count = d.day_count + 1, updated_at = now() WHERE device_id = _device;
  INSERT INTO public.check_ip_usage(ip_hash, count) VALUES (_ip, 1) ON CONFLICT (ip_hash, day) DO UPDATE SET count = check_ip_usage.count + 1;
  INSERT INTO public.check_daily_total(day, count) VALUES (current_date, 1) ON CONFLICT (day) DO UPDATE SET count = check_daily_total.count + 1;
  RETURN jsonb_build_object('allowed', true, 'premium', e.device_id IS NOT NULL, 'used', CASE WHEN e.device_id IS NOT NULL THEN pc + 1 ELSE d.lifetime + 1 END);
END $$;
REVOKE ALL ON FUNCTION public.consume_check(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_check(text, text) TO service_role;