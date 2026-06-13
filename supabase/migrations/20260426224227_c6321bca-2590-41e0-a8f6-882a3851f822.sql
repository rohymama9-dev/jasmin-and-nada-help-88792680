-- ===== Profiles =====
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text,
  points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email);
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== User roles =====
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;
DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins view all roles" ON public.user_roles;
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Admins manage roles insert" ON public.user_roles;
CREATE POLICY "Admins manage roles insert" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Admins manage roles update" ON public.user_roles;
CREATE POLICY "Admins manage roles update" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Admins manage roles delete" ON public.user_roles;
CREATE POLICY "Admins manage roles delete" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE total_admins int;
BEGIN
  SELECT count(*) INTO total_admins FROM public.user_roles WHERE role = 'admin';
  IF total_admins = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.assign_default_role();

-- ===== Admin (public) uploads =====
INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-uploads', 'admin-uploads', true)
ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Public read admin uploads" ON storage.objects;
CREATE POLICY "Public read admin uploads" ON storage.objects FOR SELECT
  USING (bucket_id = 'admin-uploads');
DROP POLICY IF EXISTS "Authenticated can upload admin uploads" ON storage.objects;
CREATE POLICY "Authenticated can upload admin uploads" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'admin-uploads');
DROP POLICY IF EXISTS "Authenticated can delete own admin uploads" ON storage.objects;
CREATE POLICY "Authenticated can delete own admin uploads" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'admin-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE TABLE IF NOT EXISTS public.admin_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL CHECK (category IN ('summary','sticker','coloring','story')),
  title text NOT NULL,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_uploads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view uploads" ON public.admin_uploads;
CREATE POLICY "Anyone can view uploads" ON public.admin_uploads FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can publish" ON public.admin_uploads;
CREATE POLICY "Authenticated users can publish" ON public.admin_uploads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own uploads" ON public.admin_uploads;
CREATE POLICY "Users can delete their own uploads" ON public.admin_uploads FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_admin_uploads_category ON public.admin_uploads(category, created_at DESC);

-- ===== Lesson progress =====
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id text NOT NULL,
  category text NOT NULL,
  points_awarded integer NOT NULL DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own lesson progress" ON public.lesson_progress;
CREATE POLICY "Users view own lesson progress" ON public.lesson_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users insert own lesson progress" ON public.lesson_progress;
CREATE POLICY "Users insert own lesson progress" ON public.lesson_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON public.lesson_progress(user_id, completed_at DESC);

CREATE OR REPLACE FUNCTION public.complete_lesson(_lesson_id text, _category text, _points integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  inserted boolean := false;
  new_total integer;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  INSERT INTO public.lesson_progress (user_id, lesson_id, category, points_awarded)
  VALUES (uid, _lesson_id, _category, GREATEST(0, _points))
  ON CONFLICT (user_id, lesson_id) DO NOTHING
  RETURNING true INTO inserted;
  IF inserted THEN
    UPDATE public.profiles SET points = points + GREATEST(0, _points)
     WHERE id = uid RETURNING points INTO new_total;
  ELSE
    SELECT points INTO new_total FROM public.profiles WHERE id = uid;
  END IF;
  RETURN COALESCE(new_total, 0);
END; $$;

CREATE OR REPLACE FUNCTION public.add_points(_amount integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  new_total integer;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  UPDATE public.profiles SET points = GREATEST(0, points + _amount)
   WHERE id = uid RETURNING points INTO new_total;
  RETURN COALESCE(new_total, 0);
END; $$;

-- ===== Private uploads =====
INSERT INTO storage.buckets (id, name, public)
VALUES ('private-uploads', 'private-uploads', false)
ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Users read own private uploads" ON storage.objects;
CREATE POLICY "Users read own private uploads" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'private-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Users upload own private files" ON storage.objects;
CREATE POLICY "Users upload own private files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'private-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Users delete own private files" ON storage.objects;
CREATE POLICY "Users delete own private files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'private-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE TABLE IF NOT EXISTS public.private_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('sticker','coloring')),
  title text NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.private_uploads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own private uploads" ON public.private_uploads;
CREATE POLICY "Users view own private uploads" ON public.private_uploads FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users insert own private uploads" ON public.private_uploads;
CREATE POLICY "Users insert own private uploads" ON public.private_uploads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users delete own private uploads" ON public.private_uploads;
CREATE POLICY "Users delete own private uploads" ON public.private_uploads FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_private_uploads_user_cat ON public.private_uploads(user_id, category, created_at DESC);