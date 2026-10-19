-- Allow anonymous inserts on admin_uploads (owner publishes without Google).
-- The app pins user_id to a fixed "anon owner" UUID so existing per-user
-- delete policy still works for the owner's own session.
DROP POLICY IF EXISTS "Authenticated users can publish" ON public.admin_uploads;
CREATE POLICY "Anyone can publish uploads"
  ON public.admin_uploads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Storage policies for the public admin-uploads bucket so anon writes succeed.
DROP POLICY IF EXISTS "admin-uploads public read"   ON storage.objects;
DROP POLICY IF EXISTS "admin-uploads anon insert"   ON storage.objects;
DROP POLICY IF EXISTS "admin-uploads anon update"   ON storage.objects;
DROP POLICY IF EXISTS "admin-uploads anon delete"   ON storage.objects;

CREATE POLICY "admin-uploads public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'admin-uploads');

CREATE POLICY "admin-uploads anon insert"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'admin-uploads');

CREATE POLICY "admin-uploads anon update"
  ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'admin-uploads');

CREATE POLICY "admin-uploads anon delete"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'admin-uploads');