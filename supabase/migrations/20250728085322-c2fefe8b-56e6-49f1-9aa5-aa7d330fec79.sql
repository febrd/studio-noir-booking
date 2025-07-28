
-- Disable RLS policies on storage.objects table for expenses bucket
DROP POLICY IF EXISTS "Give users access to own folder 1oj01fe_0" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1oj01fe_1" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1oj01fe_2" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1oj01fe_3" ON storage.objects;

-- Create permissive policy for expenses bucket
CREATE POLICY "Allow all operations on expenses bucket" ON storage.objects
  FOR ALL 
  USING (bucket_id = 'expenses');

-- Also ensure the bucket allows public access if needed
UPDATE storage.buckets SET public = true WHERE id = 'expenses';
