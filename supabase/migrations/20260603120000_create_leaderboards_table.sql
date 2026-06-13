-- ===== Leaderboards =====
CREATE TABLE IF NOT EXISTS public.leaderboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  section text NOT NULL CHECK (section IN ('games','education','global')),
  week_start date NOT NULL,
  score integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name, section, week_start)
);
ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view leaderboards" ON public.leaderboards;
CREATE POLICY "Anyone can view leaderboards" ON public.leaderboards
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert leaderboards" ON public.leaderboards;
CREATE POLICY "Anyone can insert leaderboards" ON public.leaderboards
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update leaderboards" ON public.leaderboards;
CREATE POLICY "Anyone can update leaderboards" ON public.leaderboards
  FOR UPDATE TO anon, authenticated USING (true);

CREATE TRIGGER IF NOT EXISTS leaderboards_set_updated_at
  BEFORE UPDATE ON public.leaderboards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
