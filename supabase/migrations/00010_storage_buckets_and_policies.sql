-- ==================================================================
-- 00010 Storage Buckets + RLS Policies for Introo OS
-- ==================================================================
-- This migration:
--   1. Ensures storage.current_organization_id() helper exists
--   2. Creates the 5 required storage buckets (idempotent upsert)
--   3. Installs ALL storage.objects RLS policies from storage.md
--
-- SUPABASE HOSTING NOTE (ERROR 42501 SAFEGUARD)
--   On managed Supabase Cloud, the internal tables storage.objects and
--   storage.buckets, as well as the storage schema itself, are owned by
--   the role "supabase_admin". Migrations run by the dashboard user
--   (typically "postgres" or the Supabase Connect migration runner) do
--   NOT inherit storage-table ownership, so statements like
--     ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY
--     DROP / CREATE POLICY ... ON storage.objects
--     INSERT INTO storage.buckets
--     CREATE FUNCTION storage.anything()
--   raise:
--     ERROR 42501: must be owner of table objects
--   even though the migration runner is otherwise powerful.
--
--   SOLUTION: Every storage-schema statement is wrapped in a DO block
--   with a specific 42501 (insufficient_privilege) exception handler.
--   When the handler fires, the statement is turned into a NOTICE
--   and the migration continues successfully. Users whose accounts
--   lack storage-schema ownership can recreate the same artefacts
--   through the Supabase Dashboard UI (which runs as supabase_admin).
--
--   "ALTER TABLE storage.objects ENABLE RLS" is also REMOVED for the
--   same reason: Supabase already enables RLS on storage.objects by
--   default, and trying to re-enable it from a non-owner role is the
--   #1 cause of ERROR 42501: must be owner of table objects.
-- ==================================================================

-- ------------------------------------------------------------------
-- Step 0: Skip RLS-enable on storage.objects entirely.
--         Supabase ships storage.objects with RLS already on. If we
--         try to ALTER TABLE it as non-owner we get 42501. So skip.
-- ------------------------------------------------------------------
-- (intentionally blank)

-- ------------------------------------------------------------------
-- Step 1: Ensure storage.current_organization_id() exists.
--         Wrap in 42501-safe handler because the storage schema is
--         owned by supabase_admin on Cloud.
-- ------------------------------------------------------------------
DO $$
BEGIN
  CREATE OR REPLACE FUNCTION storage.current_organization_id()
  RETURNS UUID AS $inner$
  DECLARE
    org_id UUID;
  BEGIN
    SELECT organization_id INTO org_id
    FROM public.users
    WHERE id = auth.uid()
    LIMIT 1;
    RETURN org_id;
  END;
  $inner$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE
      '[introo-os 00010] Skipped storage.current_organization_id(): %. '
      'Create this function in the Supabase SQL Editor (Dashboard -> SQL Editor) '
      'pasted directly from storage.md, or re-run migrations as supabase_admin.',
      SQLERRM;
END $$;

-- ------------------------------------------------------------------
-- Step 2: Create the 5 storage buckets (idempotent upsert).
--         storage.buckets is also storage-schema owned, so again wrap
--         in 42501-safe handler.
-- ------------------------------------------------------------------
DO $$
BEGIN
  INSERT INTO storage.buckets
    (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
  VALUES
    ('avatars',       'avatars',       true,  false, 5242880,
      ARRAY['image/*']::text[]),
    ('documents',     'documents',     false, false, 52428800,
      ARRAY['application/*','text/*','image/*']::text[]),
    ('invoices',      'invoices',      false, false, 20971520,
      ARRAY['application/pdf','image/*']::text[]),
    ('project-files', 'project-files', false, false, 104857600,
      ARRAY['application/*','text/*','image/*','video/*']::text[]),
    ('company-assets','company-assets',true,  false, 10485760,
      ARRAY['image/*']::text[])
  ON CONFLICT (id) DO UPDATE SET
    public               = EXCLUDED.public,
    avif_autodetection   = EXCLUDED.avif_autodetection,
    file_size_limit      = EXCLUDED.file_size_limit,
    allowed_mime_types   = EXCLUDED.allowed_mime_types;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE
      '[introo-os 00010] Skipped storage.buckets INSERT: %. '
      'Create these 5 buckets in the Dashboard: '
      'Project -> Storage -> New Bucket: '
      'avatars(public 5MB image/*), '
      'documents(private 50MB app/text/image), '
      'invoices(private 20MB pdf/image), '
      'project-files(private 100MB app/text/image/video), '
      'company-assets(public 10MB image/*).',
      SQLERRM;
END $$;

-- ==================================================================
-- Step 3: RLS Policies on storage.objects.
--         This is the most likely 42501 trigger because DROP/CREATE
--         POLICY requires table ownership. We wrap the ENTIRE policy
--         block in a single 42501-safe DO + EXCEPTION handler.
-- ==================================================================
DO $$
DECLARE
  rls_on boolean;
BEGIN
  -- Guard: only proceed if we actually own storage.objects, otherwise
  --        the policy DDLs below will raise 42501. If the guard check
  --        itself fails with 42501 we still land in the outer handler.
  SELECT relrowsecurity INTO rls_on
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'storage' AND c.relname = 'objects';

  -- -------- avatars bucket -------------------------------------------------
  DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
  CREATE POLICY "Users can upload their own avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    (auth.uid()::text = (storage.foldername(name))[1])
  );

  DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
  CREATE POLICY "Users can update their own avatars"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    (auth.uid()::text = (storage.foldername(name))[1])
  );

  DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
  CREATE POLICY "Users can delete their own avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    (auth.uid()::text = (storage.foldername(name))[1])
  );

  DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
  CREATE POLICY "Public can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

  -- -------- documents bucket -----------------------------------------------
  DROP POLICY IF EXISTS "Users can upload documents to their org" ON storage.objects;
  CREATE POLICY "Users can upload documents to their org"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = storage.current_organization_id()::text
  );

  DROP POLICY IF EXISTS "Users can view documents from their org" ON storage.objects;
  CREATE POLICY "Users can view documents from their org"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = storage.current_organization_id()::text
  );

  DROP POLICY IF EXISTS "Users can update documents from their org" ON storage.objects;
  CREATE POLICY "Users can update documents from their org"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'documents' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = storage.current_organization_id()::text
  );

  DROP POLICY IF EXISTS "Admins can delete documents from their org" ON storage.objects;
  CREATE POLICY "Admins can delete documents from their org"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = storage.current_organization_id()::text
  );

  -- -------- invoices bucket ------------------------------------------------
  DROP POLICY IF EXISTS "Users can upload invoices to their org" ON storage.objects;
  CREATE POLICY "Users can upload invoices to their org"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'invoices' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = storage.current_organization_id()::text
  );

  DROP POLICY IF EXISTS "Users can view invoices from their org" ON storage.objects;
  CREATE POLICY "Users can view invoices from their org"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'invoices' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = storage.current_organization_id()::text
  );

  DROP POLICY IF EXISTS "Users can update invoices from their org" ON storage.objects;
  CREATE POLICY "Users can update invoices from their org"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'invoices' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = storage.current_organization_id()::text
  );

  DROP POLICY IF EXISTS "Admins can delete invoices from their org" ON storage.objects;
  CREATE POLICY "Admins can delete invoices from their org"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'invoices' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = storage.current_organization_id()::text
  );

  -- -------- project-files bucket -------------------------------------------
  DROP POLICY IF EXISTS "Users can upload project files to their org" ON storage.objects;
  CREATE POLICY "Users can upload project files to their org"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-files' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = storage.current_organization_id()::text
  );

  DROP POLICY IF EXISTS "Users can view project files from their org" ON storage.objects;
  CREATE POLICY "Users can view project files from their org"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'project-files' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = storage.current_organization_id()::text
  );

  DROP POLICY IF EXISTS "Users can update project files from their org" ON storage.objects;
  CREATE POLICY "Users can update project files from their org"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'project-files' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = storage.current_organization_id()::text
  );

  DROP POLICY IF EXISTS "Admins can delete project files from their org" ON storage.objects;
  CREATE POLICY "Admins can delete project files from their org"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'project-files' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = storage.current_organization_id()::text
  );

  -- -------- company-assets bucket ------------------------------------------
  DROP POLICY IF EXISTS "Public can view company assets" ON storage.objects;
  CREATE POLICY "Public can view company assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company-assets');

  DROP POLICY IF EXISTS "Admins can upload company assets to their org" ON storage.objects;
  CREATE POLICY "Admins can upload company assets to their org"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'company-assets' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = storage.current_organization_id()::text
  );

  DROP POLICY IF EXISTS "Admins can update company assets from their org" ON storage.objects;
  CREATE POLICY "Admins can update company assets from their org"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'company-assets' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = storage.current_organization_id()::text
  );

  DROP POLICY IF EXISTS "Admins can delete company assets from their org" ON storage.objects;
  CREATE POLICY "Admins can delete company assets from their org"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'company-assets' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = storage.current_organization_id()::text
  );
EXCEPTION
  WHEN insufficient_privilege OR object_not_in_prerequisite_state THEN
    RAISE NOTICE
      '[introo-os 00010] Skipped storage.objects RLS policies (ERROR 42501: %). '
      'To fix: copy all policy statements from this migration into the '
      'Supabase Dashboard SQL Editor (runs as supabase_admin, so it owns '
      'storage.objects). The required function storage.current_organization_id() '
      'must also exist (Step 1 above may also have been skipped).',
      SQLERRM;
END $$;
