CREATE OR REPLACE FUNCTION public.finish_check_tokens(_request text, _outcome text, _input_tokens integer, _output_tokens integer, _result jsonb, _failure text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE l public.check_limits; credits numeric;
BEGIN
  SELECT * INTO l FROM public.check_limits WHERE id;
  IF _input_tokens IS NULL OR _output_tokens IS NULL THEN credits := NULL; -- unknown usage: charge the reserved estimate
  ELSE credits := greatest(_input_tokens, 0) * l.credits_per_input_token + greatest(_output_tokens, 0) * l.credits_per_output_token;
  END IF;
  RETURN public.finish_check(_request, _outcome, credits, _result, _failure);
END $$;
REVOKE ALL ON FUNCTION public.finish_check_tokens(text, text, integer, integer, jsonb, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finish_check_tokens(text, text, integer, integer, jsonb, text) TO service_role;