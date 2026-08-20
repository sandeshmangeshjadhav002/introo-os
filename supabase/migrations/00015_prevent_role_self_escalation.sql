-- ============================================
-- PREVENT ROLE SELF-ESCALATION & ADD EMAIL SAFETY
-- ============================================

-- Ensure users cannot promote/demote their own role or organization_id via the "edit own profile" RLS policy.
-- Only super_admins and admins should be allowed to change a user's role.

CREATE OR REPLACE FUNCTION public.prevent_self_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If the actor is the same as the row being updated
  IF auth.uid() = OLD.id THEN
    -- Do not allow changing role, organization_id, or id via self-update
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'You cannot change your own role.';
    END IF;
    IF NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
      RAISE EXCEPTION 'You cannot change your own organization.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_self_role_change ON public.users;
CREATE TRIGGER trg_prevent_self_role_change
  BEFORE UPDATE OF role, organization_id ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.prevent_self_role_change();
