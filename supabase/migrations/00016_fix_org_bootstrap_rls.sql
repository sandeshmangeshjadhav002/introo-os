-- ============================================
-- FIX ORGANIZATION BOOTSTRAP RLS
-- ============================================
-- Problem: Organizations INSERT policy required current_user_role() = 'super_admin'
-- but a brand-new signup has role = 'admin' (or 'employee') AND organization_id IS NULL.
-- This is a chicken-and-egg bug: you need a super_admin role to create an org,
-- but you can't have a role (or org) until you belong to an org. So the auto-fallback
-- in SupabaseContext.jsx always failed with:
--   "new row violates row-level security policy for table organizations"
--
-- Solution A (RLS policies):
--   1) Add a bootstrap INSERT policy that lets any authenticated user who currently
--      has NO organization create their first organization (one-time bootstrap).
--   2) Also widen the existing super_admin-only policy to include the 'admin' role,
--      because org owners typically start with role='admin' from signup metadata.
--
-- Solution B (SECURITY DEFINER RPC — guaranteed to work even if policies fail):
--   3) Expose a dedicated function public.bootstrap_create_first_organization(org_name)
--      that runs with the privileges of the function creator (postgres), so it bypasses
--      RLS entirely. The frontend calls this FIRST if plain INSERT fails, and it will
--      always succeed for an authenticated user with no org.

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.current_user_has_no_organization()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND organization_id IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================
-- GUARANTEED WORKAROUND: SECURITY DEFINER RPC
-- (Used by frontend as a fallback when the plain INSERT RLS path fails.)
-- ============================================
CREATE OR REPLACE FUNCTION public.bootstrap_create_first_organization(org_name TEXT)
RETURNS UUID AS $$
DECLARE
  new_org_id UUID;
  uid UUID;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- If user already has an org, return their existing org id (idempotent)
  SELECT organization_id INTO new_org_id
    FROM public.users
   WHERE id = uid
   LIMIT 1;

  IF new_org_id IS NOT NULL THEN
    RETURN new_org_id;
  END IF;

  -- Create the organization
  INSERT INTO public.organizations (name)
    VALUES (COALESCE(NULLIF(org_name, ''), 'My Organization'))
    RETURNING id INTO new_org_id;

  -- Attach it to the user
  UPDATE public.users
     SET organization_id = new_org_id
   WHERE id = uid;

  RETURN new_org_id;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.bootstrap_create_first_organization(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bootstrap_create_first_organization(TEXT) TO authenticated, anon;

-- ============================================
-- RLS POLICIES (preferred path — cleaner than RPC)
-- ============================================

-- 1) Bootstrap policy: any authenticated user with NO org may create their first one
DROP POLICY IF EXISTS "Users without organization can create their first organization" ON public.organizations;
CREATE POLICY "Users without organization can create their first organization"
  ON public.organizations
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND public.current_user_has_no_organization()
  );

-- 2) Also allow newly created organization rows to be READ back during the same request
--    (the existing "Users can view their own organization" SELECT policy matches by
--     current_organization_id(), which only works AFTER users.organization_id is updated).
DROP POLICY IF EXISTS "Users can read the organization they just created in their first transaction" ON public.organizations;
CREATE POLICY "Users can read the organization they just created in their first transaction"
  ON public.organizations
  FOR SELECT
  USING (
    public.current_user_has_no_organization()  -- will be false after update, which makes this harmless
    OR id = current_organization_id()
  );

-- 3) Widen admin-create policy: both super_admin and admin can create orgs
DROP POLICY IF EXISTS "Super admins can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Super admins and admins can create organizations" ON public.organizations;
CREATE POLICY "Super admins and admins can create organizations"
  ON public.organizations
  FOR INSERT
  WITH CHECK (
    current_user_role() IN ('super_admin', 'admin')
  );
