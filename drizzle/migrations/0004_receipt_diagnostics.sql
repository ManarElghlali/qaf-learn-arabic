CREATE TABLE public.receipt_diagnostics (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  platform text NOT NULL CHECK (char_length(platform) <= 16),
  stage text NOT NULL CHECK (char_length(stage) <= 40),
  code text NOT NULL CHECK (char_length(code) <= 80),
  detail text NOT NULL CHECK (char_length(detail) <= 600)
);
GRANT ALL ON public.receipt_diagnostics TO service_role;
ALTER TABLE public.receipt_diagnostics ENABLE ROW LEVEL SECURITY;
CREATE INDEX receipt_diagnostics_created_at_idx ON public.receipt_diagnostics (created_at DESC);