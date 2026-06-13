-- Tighten public read on admin-uploads: allow downloads, deny bucket listing.
DROP POLICY IF EXISTS "Public read admin uploads" ON storage.objects;
CREATE POLICY "Public read admin uploads"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'admin-uploads'
  AND name IS NOT NULL
  AND name <> ''
);