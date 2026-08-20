DROP POLICY IF EXISTS "Anyone can submit a pilot request" ON public.pilot_requests;

REVOKE INSERT ON public.pilot_requests FROM anon, authenticated;
GRANT ALL ON public.pilot_requests TO service_role;

ALTER TABLE public.pilot_requests
  ADD CONSTRAINT pilot_requests_name_len CHECK (char_length(btrim(name)) BETWEEN 2 AND 120),
  ADD CONSTRAINT pilot_requests_org_len CHECK (char_length(btrim(organisation)) BETWEEN 2 AND 160),
  ADD CONSTRAINT pilot_requests_email_fmt CHECK (char_length(email) <= 160 AND email ~* '^[^@\s]+@[^@\s.]+\.[^@\s]+$'),
  ADD CONSTRAINT pilot_requests_role_len CHECK (role IS NULL OR char_length(role) <= 120),
  ADD CONSTRAINT pilot_requests_city_len CHECK (city IS NULL OR char_length(city) <= 120),
  ADD CONSTRAINT pilot_requests_connections_len CHECK (connections IS NULL OR char_length(connections) <= 60),
  ADD CONSTRAINT pilot_requests_message_len CHECK (message IS NULL OR char_length(message) <= 1000),
  ADD CONSTRAINT pilot_requests_tier_allowed CHECK (tier IN ('pilot','municipal','state'));