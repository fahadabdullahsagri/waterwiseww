ALTER TABLE public.agent_events ADD COLUMN IF NOT EXISTS approved_by text;

CREATE TABLE IF NOT EXISTS public.pilot_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  organisation text not null,
  role text,
  email text not null,
  city text,
  connections text,
  message text,
  tier text not null default 'pilot'
);

GRANT INSERT ON public.pilot_requests TO anon;
GRANT SELECT, INSERT ON public.pilot_requests TO authenticated;
GRANT ALL ON public.pilot_requests TO service_role;

ALTER TABLE public.pilot_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit a pilot request" ON public.pilot_requests;
CREATE POLICY "Anyone can submit a pilot request"
ON public.pilot_requests FOR INSERT TO anon, authenticated
WITH CHECK (true);