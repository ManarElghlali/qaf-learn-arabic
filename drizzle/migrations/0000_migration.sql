CREATE TABLE public.check_limits (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  enforce_free_quota boolean NOT NULL DEFAULT false,
  free_lifetime int NOT NULL DEFAULT 5,
  premium_monthly int NOT NULL DEFAULT 100,
  device_daily int NOT NULL DEFAULT 150,
  ip_daily int NOT NULL DEFAULT 400,
  global_daily int NOT NULL DEFAULT 20000,
  enabled boolean NOT NULL DEFAULT true
);
INSERT INTO public.check_limits DEFAULT VALUES;

CREATE TABLE public.check_device_usage (
  device_id text PRIMARY KEY,
  lifetime int NOT NULL DEFAULT 0,
  day date NOT NULL DEFAULT current_date,
  day_count int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.check_ip_usage (
  ip_hash text NOT NULL, day date NOT NULL DEFAULT current_date, count int NOT NULL DEFAULT 0,
  PRIMARY KEY (ip_hash, day)
);
CREATE TABLE public.check_daily_total (
  day date PRIMARY KEY DEFAULT current_date, count int NOT NULL DEFAULT 0
);

GRANT ALL ON public.check_limits, public.check_device_usage, public.check_ip_usage, public.check_daily_total TO service_role;
ALTER TABLE public.check_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_device_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ip_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_daily_total ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.consume_check(_device text, _ip text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE l public.check_limits; d public.check_device_usage; ipc int; g int;
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
  IF l.enforce_free_quota AND d.lifetime >= l.free_lifetime THEN RETURN jsonb_build_object('allowed', false, 'reason', 'quota'); END IF;
  UPDATE public.check_device_usage SET lifetime = d.lifetime + 1, day = current_date, day_count = d.day_count + 1, updated_at = now() WHERE device_id = _device;
  INSERT INTO public.check_ip_usage(ip_hash) VALUES (_ip) ON CONFLICT (ip_hash, day) DO UPDATE SET count = check_ip_usage.count + 1;
  UPDATE public.check_ip_usage SET count = 1 WHERE ip_hash = _ip AND day = current_date AND count = 0;
  INSERT INTO public.check_daily_total(day, count) VALUES (current_date, 1) ON CONFLICT (day) DO UPDATE SET count = check_daily_total.count + 1;
  RETURN jsonb_build_object('allowed', true, 'used', d.lifetime + 1);
END $$;
REVOKE ALL ON FUNCTION public.consume_check(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_check(text, text) TO service_role;