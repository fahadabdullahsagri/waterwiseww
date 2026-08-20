
CREATE TABLE public.wards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  population int NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sensors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  ward_id uuid NOT NULL REFERENCES public.wards(id) ON DELETE CASCADE,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  pipe_age_years int NOT NULL DEFAULT 10,
  pipe_diameter_mm int NOT NULL DEFAULT 200,
  status text NOT NULL DEFAULT 'online',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.readings (
  id bigserial PRIMARY KEY,
  sensor_id uuid NOT NULL REFERENCES public.sensors(id) ON DELETE CASCADE,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  flow_lpm double precision NOT NULL,
  pressure_bar double precision NOT NULL,
  acoustic_score double precision NOT NULL,
  is_injected_leak boolean NOT NULL DEFAULT false
);
CREATE INDEX readings_sensor_time_idx ON public.readings (sensor_id, recorded_at DESC);

CREATE TABLE public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_id uuid NOT NULL REFERENCES public.wards(id) ON DELETE CASCADE,
  sensor_id uuid REFERENCES public.sensors(id) ON DELETE SET NULL,
  title text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  est_litres_per_hour double precision NOT NULL DEFAULT 0,
  priority_score double precision NOT NULL DEFAULT 0,
  drought_weight double precision NOT NULL DEFAULT 1,
  confidence double precision NOT NULL DEFAULT 0.8,
  eta text,
  is_true_leak boolean,
  source text NOT NULL DEFAULT 'leaksense',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.agent_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent text NOT NULL,
  alert_id uuid REFERENCES public.alerts(id) ON DELETE CASCADE,
  trigger text NOT NULL,
  perception jsonb NOT NULL DEFAULT '{}'::jsonb,
  reasoning_summary text NOT NULL,
  action text NOT NULL,
  memory text NOT NULL,
  decision text NOT NULL DEFAULT 'recommend',
  confidence double precision NOT NULL DEFAULT 0.8,
  requires_human_approval boolean NOT NULL DEFAULT true,
  approval_status text NOT NULL DEFAULT 'pending',
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.citizen_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_id uuid REFERENCES public.wards(id) ON DELETE SET NULL,
  alert_id uuid REFERENCES public.alerts(id) ON DELETE SET NULL,
  message text NOT NULL,
  intent text NOT NULL DEFAULT 'other',
  reply text,
  deduped boolean NOT NULL DEFAULT false,
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.irrigation_districts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  state text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  crop text NOT NULL DEFAULT 'Cotton',
  fixed_baseline_mm double precision NOT NULL DEFAULT 8,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.work_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id uuid NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
  crew text NOT NULL DEFAULT 'Crew A',
  status text NOT NULL DEFAULT 'drafted',
  queue_position int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_id uuid NOT NULL REFERENCES public.wards(id) ON DELETE CASCADE,
  alert_id uuid REFERENCES public.alerts(id) ON DELETE SET NULL,
  body text NOT NULL,
  channel text NOT NULL DEFAULT 'app',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.nrw_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month date NOT NULL UNIQUE,
  nrw_percent double precision NOT NULL,
  litres_saved bigint NOT NULL DEFAULT 0
);

GRANT SELECT ON public.wards, public.sensors, public.readings, public.alerts,
  public.agent_events, public.citizen_reports, public.irrigation_districts,
  public.work_orders, public.notifications, public.nrw_history TO anon, authenticated;
GRANT ALL ON public.wards, public.sensors, public.readings, public.alerts,
  public.agent_events, public.citizen_reports, public.irrigation_districts,
  public.work_orders, public.notifications, public.nrw_history TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.readings_id_seq TO service_role;

ALTER TABLE public.wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citizen_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.irrigation_districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nrw_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public demo read" ON public.wards FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public demo read" ON public.sensors FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public demo read" ON public.readings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public demo read" ON public.alerts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public demo read" ON public.agent_events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public demo read" ON public.citizen_reports FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public demo read" ON public.irrigation_districts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public demo read" ON public.work_orders FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public demo read" ON public.notifications FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public demo read" ON public.nrw_history FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.wards (name, code, population, lat, lng) VALUES
  ('Kothrud', 'W-01', 182000, 18.5074, 73.8077),
  ('Shivajinagar', 'W-02', 96000, 18.5308, 73.8478),
  ('Hadapsar', 'W-03', 214000, 18.5089, 73.9260),
  ('Aundh', 'W-04', 78000, 18.5590, 73.8078),
  ('Katraj', 'W-05', 131000, 18.4483, 73.8600),
  ('Yerwada', 'W-06', 104000, 18.5510, 73.8880);

INSERT INTO public.sensors (code, ward_id, lat, lng, pipe_age_years, pipe_diameter_mm)
SELECT
  'S-' || lpad((row_number() over ())::text, 3, '0'),
  w.id,
  w.lat + (g * 0.004 - 0.004),
  w.lng + (g * 0.005 - 0.005),
  8 + ((g * 7 + w.population) % 34),
  150 + ((g * 50) % 300)
FROM public.wards w CROSS JOIN generate_series(1, 3) g;

INSERT INTO public.readings (sensor_id, recorded_at, flow_lpm, pressure_bar, acoustic_score)
SELECT s.id,
  now() - (t || ' hours')::interval,
  420 + 60 * sin(t / 3.0) + (s.pipe_age_years * 1.5),
  3.2 + 0.25 * cos(t / 4.0) - (s.pipe_age_years * 0.01),
  greatest(0, 0.18 + 0.08 * sin(t / 2.0) + (s.pipe_age_years * 0.004))
FROM public.sensors s CROSS JOIN generate_series(0, 47) t;

INSERT INTO public.irrigation_districts (name, state, lat, lng, crop, fixed_baseline_mm) VALUES
  ('Baramati', 'Maharashtra', 18.1514, 74.5815, 'Sugarcane', 9),
  ('Solapur', 'Maharashtra', 17.6599, 75.9064, 'Cotton', 8),
  ('Nashik', 'Maharashtra', 19.9975, 73.7898, 'Grapes', 7);

INSERT INTO public.nrw_history (month, nrw_percent, litres_saved)
SELECT (date_trunc('month', now()) - ((11 - g) || ' months')::interval)::date,
       38.4 - g * 0.9,
       g * 1850000
FROM generate_series(0, 11) g;
