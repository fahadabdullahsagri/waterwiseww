CREATE TABLE public.household_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id TEXT NOT NULL,
  entry_date DATE NOT NULL,
  litres INTEGER NOT NULL CHECK (litres > 0 AND litres <= 200000),
  category TEXT NOT NULL DEFAULT 'household' CHECK (category IN ('household','garden','livestock','other')),
  note TEXT CHECK (note IS NULL OR length(note) <= 300),
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX household_entries_household_idx ON public.household_entries (household_id, entry_date);
GRANT ALL ON public.household_entries TO service_role;
ALTER TABLE public.household_entries ENABLE ROW LEVEL SECURITY;