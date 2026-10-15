ALTER TABLE public.check_limits ADD COLUMN IF NOT EXISTS billing_live boolean NOT NULL DEFAULT false;
ALTER TABLE public.check_limits ADD COLUMN IF NOT EXISTS max_moves_30d int NOT NULL DEFAULT 3;

CREATE TABLE public.entitlement_moves (
  original_transaction_id text NOT NULL,
  device_id text NOT NULL,
  moved_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.entitlement_moves TO service_role;
ALTER TABLE public.entitlement_moves ENABLE ROW LEVEL SECURITY;
CREATE INDEX entitlement_moves_orig ON public.entitlement_moves(original_transaction_id, moved_at);

-- One phone per subscription. Moving to a new phone (Restore) is allowed a few times per 30 days.
CREATE OR REPLACE FUNCTION public.grant_entitlement(_device text, _platform text, _product text, _original text, _start timestamptz, _end timestamptz)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE l public.check_limits; cur text; n int;
BEGIN
  SELECT * INTO l FROM public.check_limits WHERE id;
  SELECT device_id INTO cur FROM public.premium_entitlements WHERE original_transaction_id = _original;
  IF cur IS NOT NULL AND cur <> _device THEN
    SELECT count(*) INTO n FROM public.entitlement_moves WHERE original_transaction_id = _original AND moved_at > now() - interval '30 days';
    IF n >= l.max_moves_30d THEN RAISE EXCEPTION 'too_many_moves'; END IF;
    INSERT INTO public.entitlement_moves(original_transaction_id, device_id) VALUES (_original, _device);
    DELETE FROM public.premium_entitlements WHERE original_transaction_id = _original;
  END IF;
  INSERT INTO public.premium_entitlements(device_id, platform, product_id, original_transaction_id, period_start, period_end, verified_at)
  VALUES (_device, _platform, _product, _original, _start, _end, now())
  ON CONFLICT (device_id) DO UPDATE SET platform = EXCLUDED.platform, product_id = EXCLUDED.product_id,
    original_transaction_id = EXCLUDED.original_transaction_id, period_start = EXCLUDED.period_start,
    period_end = EXCLUDED.period_end, verified_at = now();
END $$;
REVOKE ALL ON FUNCTION public.grant_entitlement(text, text, text, text, timestamptz, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_entitlement(text, text, text, text, timestamptz, timestamptz) TO service_role;

CREATE OR REPLACE FUNCTION public.revoke_entitlement(_original text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.premium_entitlements WHERE original_transaction_id = _original;
$$;
REVOKE ALL ON FUNCTION public.revoke_entitlement(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_entitlement(text) TO service_role;

CREATE OR REPLACE FUNCTION public.check_status(_device text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE l public.check_limits; e public.premium_entitlements; used int;
BEGIN
  SELECT * INTO l FROM public.check_limits WHERE id;
  SELECT * INTO e FROM public.premium_entitlements WHERE device_id = _device AND period_end > now();
  IF e.device_id IS NOT NULL THEN
    SELECT coalesce(count,0) INTO used FROM public.check_premium_usage WHERE device_id = _device AND period_start = e.period_start;
    RETURN jsonb_build_object('premium', true, 'used', coalesce(used,0), 'limit', l.premium_monthly, 'enforced', true, 'renews', e.period_end, 'billingLive', l.billing_live);
  END IF;
  SELECT lifetime INTO used FROM public.check_device_usage WHERE device_id = _device;
  RETURN jsonb_build_object('premium', false, 'used', coalesce(used,0), 'limit', l.free_lifetime, 'enforced', l.enforce_free_quota, 'billingLive', l.billing_live);
END $$;
REVOKE ALL ON FUNCTION public.check_status(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_status(text) TO service_role;