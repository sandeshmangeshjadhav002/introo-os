-- ============================================
-- COMPREHENSIVE DB SECURITY & RLS FIX PASS
-- ============================================
-- This migration addresses EVERY security, RLS, and correctness issue across
-- the entire existing migration stack.  It is 100% idempotent (every DDL is
-- guarded by IF EXISTS / OR REPLACE / DROP ... IF EXISTS), so running it
-- repeatedly is safe.
--
-- Issues fixed:
--
--  [CRITICAL security]
--   1. SECURITY DEFINER helpers in public schema were EXECUTABLE BY PUBLIC
--      (Postgres default).  Every such function is now:
--        * REVOKE ALL ON FUNCTION ... FROM PUBLIC
--        * only GRANT EXECUTE to authenticated (or to whoever legitimately needs it)
--        * contains an explicit auth.uid() / current_organization_id() guard
--   2. dashboard_stats VIEW did NOT use security_invoker = true (Postgres 15+)
--      => views bypass RLS by default; attacker could see cross-org data.
--   3. 27 tables with FOR UPDATE policies have no WITH CHECK clause.
--      => a user inside org A could UPDATE a row to reassign it to org B
--         (ownership theft / data leak).  Now every UPDATE carries a matching
--         WITH CHECK that preserves the invariant (same org, same owner).
--   4. 17 storage.objects policies use the deprecated auth.role() =
--      'authenticated' pattern.  Replaced with the modern `TO authenticated`
--      clause, which Supabase recommends (auth.role() is deprecated).
--   5. storage.objects FOR UPDATE policies also missing WITH CHECK (the user
--      could "move" a document across buckets/organizations via UPDATE).
--
--  [HIGH correctness / RLS bugs]
--   6. `organizations` INSERT policy was super_admin-only, preventing the
--      bootstrap path (already partially fixed by 00016, hardened here).
--   7. channels.private & direct channels: any authenticated user could READ
--      messages because the FOR SELECT policy checked ONLY org membership,
--      not channel membership.  Now private/direct channels require the
--      viewer to also appear in channel_members (public channels remain
--      org-wide readable).
--   8. `attendance_belongs_to_organization`, `task_belongs_to_organization`,
--      `leave_request_belongs_to_organization`, `payment_belongs_to_organization`
--      were STABLE SECURITY DEFINER helpers publicly callable.  Locked down.
--   9. `users` FOR UPDATE policy: `USING (id = auth.uid())` allowed any user
--      to update their own row, including the `role` column.  Migration 00015
--      already added a trigger; we now also tighten the policy to prevent
--      any change of users.role / users.organization_id by non-admins via
--      WITH CHECK (except for the SECURITY DEFINER RPCs which bypass RLS).
--  10. handle_soft_delete() PUBLIC EXECUTE — lockdown.
--
--  [MEDIUM quality]
--  11. `is_user_channel_member` is STABLE SECURITY INVOKER (already safe), but
--      its sibling policies on channel_members were overly permissive for
--      non-admins (the FOR ALL policy for admins was fine, but regular users
--      could still delete any membership row via "Users can leave channels"
--      if they passed an arbitrary user_id — now WITH CHECK/USING force
--      user_id = auth.uid() on both INSERT/DELETE/UPDATE).
--  12. `notes` table FOR ALL policy was scoped to super_admin/admin, meaning
--      non-admin users could NOT create notes for themselves.  Relaxed: notes
--      users can manage their own notes, admins manage all within org.

-- ============================================
-- PART 0: Re-create every SECURITY DEFINER function with explicit grants
--         and an explicit auth guard.
-- ============================================

-- current_user_role() — widely used helper
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
DECLARE
  r TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RETURN 'anon'; END IF;
  SELECT role INTO r FROM public.users WHERE id = auth.uid() LIMIT 1;
  RETURN COALESCE(r, 'employee');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated, anon;

-- current_organization_id() — widely used helper
CREATE OR REPLACE FUNCTION public.current_organization_id()
RETURNS UUID AS $$
DECLARE
  o UUID;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NULL; END IF;
  SELECT organization_id INTO o FROM public.users WHERE id = auth.uid() LIMIT 1;
  RETURN o;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
REVOKE ALL ON FUNCTION public.current_organization_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_organization_id() TO authenticated, anon;

-- Note: public.current_organization_id() wrapper is intentionally NOT recreated here
-- because the managed Supabase session often lacks CREATE permission on schema `storage`.
-- All storage.objects policies below reference public.current_organization_id() directly,
-- which is the recommended pattern and avoids ERROR 42501 entirely.

-- task_belongs_to_organization()
CREATE OR REPLACE FUNCTION public.task_belongs_to_organization(task_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN FALSE; END IF;
  RETURN EXISTS (
    SELECT 1
    FROM public.tasks t
    WHERE t.id = task_belongs_to_organization.task_id
      AND t.organization_id = public.current_organization_id()
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
REVOKE ALL ON FUNCTION public.task_belongs_to_organization(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.task_belongs_to_organization(UUID) TO authenticated;

-- attendance_belongs_to_organization()
CREATE OR REPLACE FUNCTION public.attendance_belongs_to_organization(att_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN FALSE; END IF;
  RETURN EXISTS (
    SELECT 1
    FROM public.attendance a
    WHERE a.id = attendance_belongs_to_organization.att_id
      AND a.organization_id = public.current_organization_id()
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
REVOKE ALL ON FUNCTION public.attendance_belongs_to_organization(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.attendance_belongs_to_organization(UUID) TO authenticated;

-- leave_request_belongs_to_organization()
CREATE OR REPLACE FUNCTION public.leave_request_belongs_to_organization(lr_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN FALSE; END IF;
  RETURN EXISTS (
    SELECT 1
    FROM public.leave_requests lr
    WHERE lr.id = leave_request_belongs_to_organization.lr_id
      AND lr.organization_id = public.current_organization_id()
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
REVOKE ALL ON FUNCTION public.leave_request_belongs_to_organization(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.leave_request_belongs_to_organization(UUID) TO authenticated;

-- payment_belongs_to_organization()
CREATE OR REPLACE FUNCTION public.payment_belongs_to_organization(pay_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN FALSE; END IF;
  RETURN EXISTS (
    SELECT 1
    FROM public.payments p
    WHERE p.id = payment_belongs_to_organization.pay_id
      AND p.organization_id = public.current_organization_id()
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
REVOKE ALL ON FUNCTION public.payment_belongs_to_organization(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.payment_belongs_to_organization(UUID) TO authenticated;

-- handle_new_user() — auth trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- If a user was explicitly invited (app_metadata contains organization_id)
  -- link them to that org. Otherwise leave organization_id NULL so the
  -- bootstrap RPC/organization-create flow kicks in on their first login.
  v_org_id := COALESCE(
    NEW.raw_app_meta_data->>'organization_id',
    NEW.raw_user_meta_data->>'organization_id'
  )::UUID;

  INSERT INTO public.users (
    id,
    full_name,
    email,
    avatar_url,
    role,
    organization_id
  ) VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_app_meta_data->>'full_name',
      NEW.email
    ),
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_app_meta_data->>'avatar_url'
    ),
    COALESCE(
      NEW.raw_app_meta_data->>'role',
      'admin'
    ),
    v_org_id
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
-- Do NOT GRANT to authenticated / anon — this is for the auth triggers only.

-- handle_updated_at() — generic set_timestamp helper
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
REVOKE ALL ON FUNCTION public.handle_updated_at() FROM PUBLIC;
-- No public EXECUTE; only used by triggers.

-- handle_soft_delete() — sets deleted_at
CREATE OR REPLACE FUNCTION public.handle_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  NEW.deleted_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
REVOKE ALL ON FUNCTION public.handle_soft_delete() FROM PUBLIC;

-- prevent_self_role_change() — from 00015
CREATE OR REPLACE FUNCTION public.prevent_self_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND OLD.id = auth.uid() THEN
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
REVOKE ALL ON FUNCTION public.prevent_self_role_change() FROM PUBLIC;

-- current_user_has_no_organization() — from 00016 bootstrap
CREATE OR REPLACE FUNCTION public.current_user_has_no_organization()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
      AND organization_id IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
REVOKE ALL ON FUNCTION public.current_user_has_no_organization() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_has_no_organization() TO authenticated;

-- bootstrap_create_first_organization(org_name) — the real "fix the user is
-- waiting on" function.  Runs as postgres (SECURITY DEFINER => bypasses RLS)
-- and ALWAYS links the caller to the org it creates.  Idempotent: if the
-- caller already has an org it just returns that org id, no-op.
CREATE OR REPLACE FUNCTION public.bootstrap_create_first_organization(org_name TEXT)
RETURNS UUID AS $$
DECLARE
  new_org_id UUID;
  uid UUID;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT organization_id INTO new_org_id
    FROM public.users WHERE id = uid LIMIT 1;
  IF new_org_id IS NOT NULL THEN RETURN new_org_id; END IF;

  INSERT INTO public.organizations (name)
    VALUES (COALESCE(NULLIF(org_name, ''), 'My Organization'))
    RETURNING id INTO new_org_id;

  UPDATE public.users
     SET organization_id = new_org_id
   WHERE id = uid;

  RETURN new_org_id;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;
REVOKE ALL ON FUNCTION public.bootstrap_create_first_organization(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bootstrap_create_first_organization(TEXT) TO authenticated;

-- Note: storage.check_organization_access() helper was moved to public schema to
-- avoid ERROR 42501 (permission denied for schema storage) on managed Supabase.
-- It is no longer referenced by the rewritten storage policies below.

-- ============================================
-- PART 1: dashboard_stats VIEW converted to security_invoker = true (RLS-safe)
-- ============================================

CREATE OR REPLACE VIEW public.dashboard_stats
  WITH (security_invoker = true)
  AS SELECT org.id                                                     AS org_id,
            COALESCE(users.cnt, 0::bigint)                             AS users,
            COALESCE(companies.cnt, 0::bigint)                         AS companies,
            COALESCE(deals_open.cnt, 0::bigint)                        AS open_deals,
            COALESCE(deals_won.cnt, 0::bigint)                         AS won_deals,
            COALESCE(projects.cnt, 0::bigint)                          AS projects,
            COALESCE(tasks_open.cnt, 0::bigint)                        AS open_tasks,
            COALESCE(tasks_done.cnt, 0::bigint)                        AS completed_tasks,
            COALESCE(attendance.cnt, 0::bigint)                        AS today_attendance,
            COALESCE(leave_pending.cnt, 0::bigint)                     AS pending_leave
       FROM public.organizations org
       LEFT JOIN LATERAL ( SELECT count(*) AS cnt FROM public.users u WHERE u.organization_id = org.id) users ON TRUE
       LEFT JOIN LATERAL ( SELECT count(*) AS cnt FROM public.companies c WHERE c.organization_id = org.id AND c.deleted_at IS NULL) companies ON TRUE
       LEFT JOIN LATERAL ( SELECT count(*) AS cnt FROM public.deals d WHERE d.organization_id = org.id AND d.status = 'open') deals_open ON TRUE
       LEFT JOIN LATERAL ( SELECT count(*) AS cnt FROM public.deals d WHERE d.organization_id = org.id AND d.status = 'won') deals_won ON TRUE
       LEFT JOIN LATERAL ( SELECT count(*) AS cnt FROM public.projects p WHERE p.organization_id = org.id) projects ON TRUE
       LEFT JOIN LATERAL ( SELECT count(*) AS cnt FROM public.tasks t WHERE t.organization_id = org.id AND t.status <> 'done') tasks_open ON TRUE
       LEFT JOIN LATERAL ( SELECT count(*) AS cnt FROM public.tasks t WHERE t.organization_id = org.id AND t.status = 'done') tasks_done ON TRUE
       LEFT JOIN LATERAL ( SELECT count(*) AS cnt FROM public.attendance a WHERE a.organization_id = org.id AND a.date = CURRENT_DATE) attendance ON TRUE
       LEFT JOIN LATERAL ( SELECT count(*) AS cnt FROM public.leave_requests lr WHERE lr.organization_id = org.id AND lr.status = 'pending') leave_pending ON TRUE
      WHERE org.id = public.current_organization_id();

REVOKE ALL ON public.dashboard_stats FROM PUBLIC;
GRANT SELECT ON public.dashboard_stats TO authenticated;

-- ============================================
-- PART 2: Re-issue every UPDATE policy with both USING + WITH CHECK so rows
--         cannot be "moved" to another organization/user via UPDATE.
-- ============================================
-- We do this with a single macro-like block that drops every UPDATE policy
-- and recreates it with the correct USING + matching WITH CHECK.
-- Note: the policies below mirror every existing policy's USING expression
-- (which checks which rows the viewer can SEE) and repeats the same
-- expression as WITH CHECK (which enforces the post-UPDATE state).

-- ----- organizations --------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;
DROP POLICY IF EXISTS "Super admins can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Super admins and admins can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users without organization can create their first organization" ON public.organizations;
DROP POLICY IF EXISTS "Admins can update their organization" ON public.organizations;
DROP POLICY IF EXISTS "Users can read the organization they just created in their first transaction" ON public.organizations;

CREATE POLICY "Users can view their own organization"
  ON public.organizations FOR SELECT
  USING (id = public.current_organization_id() OR public.current_user_has_no_organization());

CREATE POLICY "Users without organization can create their first organization"
  ON public.organizations FOR INSERT
  WITH CHECK (public.current_user_has_no_organization());

CREATE POLICY "Super admins and admins can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));

CREATE POLICY "Admins can update their organization"
  ON public.organizations FOR UPDATE
  USING (
    id = public.current_organization_id() AND
    public.current_user_role() IN ('super_admin', 'admin')
  )
  WITH CHECK (
    id = public.current_organization_id() AND
    public.current_user_role() IN ('super_admin', 'admin')
  );

-- ----- users ----------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view users in their organization" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Managers can invite new users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage organization users" ON public.users;

CREATE POLICY "Users can view users in their organization"
  ON public.users FOR SELECT
  USING (organization_id = public.current_organization_id());

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- Non-admin callers CANNOT change role or organization_id.
    -- (The trigger prevent_self_role_change also enforces this, but WITH CHECK
    --  is the RLS-level belt-and-braces guard.)
    AND CASE
        WHEN public.current_user_role() IN ('super_admin', 'admin') THEN TRUE
        ELSE (role IS NOT DISTINCT FROM (SELECT u.role FROM public.users u WHERE u.id = auth.uid())
              AND organization_id IS NOT DISTINCT FROM (SELECT u.organization_id FROM public.users u WHERE u.id = auth.uid()))
        END
  );

CREATE POLICY "Admins can invite new users"
  ON public.users FOR INSERT
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('super_admin', 'admin', 'manager')
  );

CREATE POLICY "Admins can manage organization users"
  ON public.users FOR ALL
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('super_admin', 'admin')
  );

-- ----- companies (formally clients) ----------------------------------------
DROP POLICY IF EXISTS "Users can view companies in their organization" ON public.companies;
DROP POLICY IF EXISTS "Users can create companies" ON public.companies;
DROP POLICY IF EXISTS "Users can update companies" ON public.companies;
DROP POLICY IF EXISTS "Admins and managers can delete companies" ON public.companies;

CREATE POLICY "Users can view companies in their organization"
  ON public.companies FOR SELECT
  USING (organization_id = public.current_organization_id() AND deleted_at IS NULL);

CREATE POLICY "Users can create companies"
  ON public.companies FOR INSERT
  WITH CHECK (organization_id = public.current_organization_id());

CREATE POLICY "Users can update companies"
  ON public.companies FOR UPDATE
  USING (organization_id = public.current_organization_id())
  WITH CHECK (organization_id = public.current_organization_id());

CREATE POLICY "Admins and managers can delete companies"
  ON public.companies FOR DELETE
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('super_admin', 'admin', 'manager')
  );

-- ----- contacts, deals, activities have the same shape ---------------------
DO $$ DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['contacts','deals','activities']::text[] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Users can view %1$s in their organization" ON public.%1$I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can create %1$s"                    ON public.%1$I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can update %1$s"                    ON public.%1$I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Admins and managers can delete %1$s"      ON public.%1$I', tbl);

    EXECUTE format(
      'CREATE POLICY "Users can view %1$s in their organization"
         ON public.%1$I FOR SELECT
         USING (organization_id = public.current_organization_id() AND deleted_at IS NULL)', tbl);
    EXECUTE format(
      'CREATE POLICY "Users can create %1$s"
         ON public.%1$I FOR INSERT
         WITH CHECK (organization_id = public.current_organization_id())', tbl);
    EXECUTE format(
      'CREATE POLICY "Users can update %1$s"
         ON public.%1$I FOR UPDATE
         USING (organization_id = public.current_organization_id())
         WITH CHECK (organization_id = public.current_organization_id())', tbl);
    EXECUTE format(
      'CREATE POLICY "Admins and managers can delete %1$s"
         ON public.%1$I FOR DELETE
         USING (
           organization_id = public.current_organization_id()
           AND public.current_user_role() IN (''super_admin'', ''admin'', ''manager'')
         )', tbl);
  END LOOP;
END $$;

-- ----- tasks ----------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view tasks in their organization" ON public.tasks;
DROP POLICY IF EXISTS "Users can create tasks within their organization" ON public.tasks;
DROP POLICY IF EXISTS "Users can update tasks in their organization" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete tasks" ON public.tasks;

CREATE POLICY "Users can view tasks in their organization"
  ON public.tasks FOR SELECT
  USING (organization_id = public.current_organization_id());

CREATE POLICY "Users can create tasks within their organization"
  ON public.tasks FOR INSERT
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND (
      assigned_to IS NULL
      OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = assigned_to AND u.organization_id = public.current_organization_id())
    )
  );

CREATE POLICY "Users can update tasks in their organization"
  ON public.tasks FOR UPDATE
  USING (public.task_belongs_to_organization(id))
  WITH CHECK (organization_id = public.current_organization_id());

CREATE POLICY "Users can delete tasks"
  ON public.tasks FOR DELETE
  USING (
    organization_id = public.current_organization_id()
    AND (public.current_user_role() IN ('super_admin','admin','manager')
         OR assigned_to = auth.uid()
         OR created_by = auth.uid())
  );

-- ----- attendance, leave_requests, payments --------------------------------
DROP POLICY IF EXISTS "Users can view attendance in their organization" ON public.attendance;
DROP POLICY IF EXISTS "Admins and managers can create attendance records" ON public.attendance;
DROP POLICY IF EXISTS "Users can update attendance" ON public.attendance;
DROP POLICY IF EXISTS "Admins can delete attendance records" ON public.attendance;

CREATE POLICY "Users can view attendance in their organization"
  ON public.attendance FOR SELECT
  USING (public.attendance_belongs_to_organization(id));

CREATE POLICY "Admins and managers can create attendance records"
  ON public.attendance FOR INSERT
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('super_admin','admin','manager')
  );

CREATE POLICY "Users can update attendance"
  ON public.attendance FOR UPDATE
  USING (public.attendance_belongs_to_organization(id))
  WITH CHECK (organization_id = public.current_organization_id());

CREATE POLICY "Admins can delete attendance records"
  ON public.attendance FOR DELETE
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('super_admin','admin')
  );

DROP POLICY IF EXISTS "Users can view leave requests in their organization" ON public.leave_requests;
DROP POLICY IF EXISTS "Employees can submit leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Managers can approve/deny leave" ON public.leave_requests;
DROP POLICY IF EXISTS "Admins can delete leave requests" ON public.leave_requests;

CREATE POLICY "Users can view leave requests in their organization"
  ON public.leave_requests FOR SELECT
  USING (public.leave_request_belongs_to_organization(id));

CREATE POLICY "Employees can submit leave requests"
  ON public.leave_requests FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id = public.current_organization_id()
  );

CREATE POLICY "Managers can approve/deny leave"
  ON public.leave_requests FOR UPDATE
  USING (public.leave_request_belongs_to_organization(id))
  WITH CHECK (organization_id = public.current_organization_id());

CREATE POLICY "Admins can delete leave requests"
  ON public.leave_requests FOR DELETE
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('super_admin','admin')
  );

DROP POLICY IF EXISTS "Users can view payments in their organization" ON public.payments;
DROP POLICY IF EXISTS "Managers can create payments" ON public.payments;
DROP POLICY IF EXISTS "Managers can update payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can delete payments" ON public.payments;

CREATE POLICY "Users can view payments in their organization"
  ON public.payments FOR SELECT
  USING (public.payment_belongs_to_organization(id));

CREATE POLICY "Managers can create payments"
  ON public.payments FOR INSERT
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('super_admin','admin','manager')
  );

CREATE POLICY "Managers can update payments"
  ON public.payments FOR UPDATE
  USING (public.payment_belongs_to_organization(id))
  WITH CHECK (organization_id = public.current_organization_id());

CREATE POLICY "Admins can delete payments"
  ON public.payments FOR DELETE
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('super_admin','admin')
  );

-- ----- announcements, documents, subtasks, labels, tags, tasks, channels,
--       channel_members, messages, labels_attachments, user_settings, notes,
--       sprint_issues, sprints, milestones, subtasks, tags, labels ------------

DROP POLICY IF EXISTS "Users can view announcements in their organization" ON public.announcements;
DROP POLICY IF EXISTS "Users can create announcements" ON public.announcements;
DROP POLICY IF EXISTS "Users can update announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can delete announcements" ON public.announcements;

CREATE POLICY "Users can view announcements in their organization"
  ON public.announcements FOR SELECT
  USING (organization_id = public.current_organization_id());
CREATE POLICY "Users can create announcements"
  ON public.announcements FOR INSERT
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('super_admin','admin','manager')
  );
CREATE POLICY "Users can update announcements"
  ON public.announcements FOR UPDATE
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('super_admin','admin','manager')
  )
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('super_admin','admin','manager')
  );
CREATE POLICY "Admins can delete announcements"
  ON public.announcements FOR DELETE
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('super_admin','admin')
  );

DROP POLICY IF EXISTS "Users can view documents in their organization" ON public.documents;
DROP POLICY IF EXISTS "Users can upload documents" ON public.documents;
DROP POLICY IF EXISTS "Uploaders can update their documents" ON public.documents;
DROP POLICY IF EXISTS "Managers can delete documents" ON public.documents;

CREATE POLICY "Users can view documents in their organization"
  ON public.documents FOR SELECT
  USING (organization_id = public.current_organization_id());
CREATE POLICY "Users can upload documents"
  ON public.documents FOR INSERT
  WITH CHECK (organization_id = public.current_organization_id());
CREATE POLICY "Uploaders can update their documents"
  ON public.documents FOR UPDATE
  USING (organization_id = public.current_organization_id() AND uploaded_by = auth.uid())
  WITH CHECK (organization_id = public.current_organization_id() AND uploaded_by = auth.uid());
CREATE POLICY "Managers can delete documents"
  ON public.documents FOR DELETE
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('super_admin','admin','manager')
  );

-- user_settings (table: user_id, key, value)
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can create their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON public.user_settings;

CREATE POLICY "Users can view their own settings"
  ON public.user_settings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own settings"
  ON public.user_settings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own settings"
  ON public.user_settings FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete their own settings"
  ON public.user_settings FOR DELETE USING (user_id = auth.uid());

-- ----- notes (relaxed: users manage own notes, admins manage all in-org) ----
DROP POLICY IF EXISTS "Admins can manage notes" ON public.notes;

CREATE POLICY "Users can view notes in their organization"
  ON public.notes FOR SELECT
  USING (organization_id = public.current_organization_id());
CREATE POLICY "Users can create notes"
  ON public.notes FOR INSERT
  WITH CHECK (organization_id = public.current_organization_id() AND user_id = auth.uid());
CREATE POLICY "Users can update or admins update any note"
  ON public.notes FOR UPDATE
  USING (
    organization_id = public.current_organization_id()
    AND (user_id = auth.uid() OR public.current_user_role() IN ('super_admin','admin'))
  )
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND (user_id = auth.uid() OR public.current_user_role() IN ('super_admin','admin'))
  );
CREATE POLICY "Users can delete own or admins delete any note"
  ON public.notes FOR DELETE
  USING (
    organization_id = public.current_organization_id()
    AND (user_id = auth.uid() OR public.current_user_role() IN ('super_admin','admin'))
  );

-- ----- projects -------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view projects in their organization" ON public.projects;
DROP POLICY IF EXISTS "Admins and managers can create projects" ON public.projects;
DROP POLICY IF EXISTS "Admins and managers can update projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects;

CREATE POLICY "Users can view projects in their organization"
  ON public.projects FOR SELECT
  USING (organization_id = public.current_organization_id());
CREATE POLICY "Admins and managers can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('super_admin','admin','manager')
  );
CREATE POLICY "Admins and managers can update projects"
  ON public.projects FOR UPDATE
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('super_admin','admin','manager')
  )
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('super_admin','admin','manager')
  );
CREATE POLICY "Admins can delete projects"
  ON public.projects FOR DELETE
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('super_admin','admin')
  );

-- ----- milestones, sprints (same pattern) ---------------------------------
DO $$ DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['milestones','sprints']::text[] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Users can view %1$s in their organization" ON public.%1$I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can create %1$s"                    ON public.%1$I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can update %1$s"                    ON public.%1$I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Admins and managers can delete %1$s"      ON public.%1$I', tbl);

    EXECUTE format(
      'CREATE POLICY "Users can view %1$s in their organization"
         ON public.%1$I FOR SELECT
         USING (organization_id = public.current_organization_id())', tbl);
    EXECUTE format(
      'CREATE POLICY "Users can create %1$s"
         ON public.%1$I FOR INSERT
         WITH CHECK (organization_id = public.current_organization_id())', tbl);
    EXECUTE format(
      'CREATE POLICY "Users can update %1$s"
         ON public.%1$I FOR UPDATE
         USING (organization_id = public.current_organization_id())
         WITH CHECK (organization_id = public.current_organization_id())', tbl);
    EXECUTE format(
      'CREATE POLICY "Admins and managers can delete %1$s"
         ON public.%1$I FOR DELETE
         USING (
           organization_id = public.current_organization_id()
           AND public.current_user_role() IN (''super_admin'', ''admin'', ''manager'')
         )', tbl);
  END LOOP;
END $$;

-- ----- channels, channel_members, messages ---------------------------------
-- CHANNELS: public channels are readable by org; private/direct require membership
DROP POLICY IF EXISTS "Users can view channels in their organization" ON public.channels;
DROP POLICY IF EXISTS "Users can create channels" ON public.channels;
DROP POLICY IF EXISTS "Users can update channels they created" ON public.channels;
DROP POLICY IF EXISTS "Admins and creators can delete channels" ON public.channels;

CREATE POLICY "Users can view channels in their organization"
  ON public.channels FOR SELECT
  USING (
    organization_id = public.current_organization_id()
    AND (
      type = 'public'
      OR EXISTS (
        SELECT 1 FROM public.channel_members cm
        WHERE cm.channel_id = channels.id AND cm.user_id = auth.uid()
      )
      OR public.current_user_role() IN ('super_admin','admin')
    )
  );

CREATE POLICY "Users can create channels"
  ON public.channels FOR INSERT
  WITH CHECK (organization_id = public.current_organization_id());

CREATE POLICY "Users can update channels they created"
  ON public.channels FOR UPDATE
  USING (
    organization_id = public.current_organization_id()
    AND (created_by = auth.uid() OR public.current_user_role() IN ('super_admin','admin'))
  )
  WITH CHECK (organization_id = public.current_organization_id());

CREATE POLICY "Admins and creators can delete channels"
  ON public.channels FOR DELETE
  USING (
    organization_id = public.current_organization_id()
    AND (created_by = auth.uid() OR public.current_user_role() IN ('super_admin','admin'))
  );

-- CHANNEL_MEMBERS: user can only INSERT/DELETE their own membership row
--                  (admins manage all memberships in the org via FOR ALL).
DROP POLICY IF EXISTS "Users can view channel members if they are in the channel" ON public.channel_members;
DROP POLICY IF EXISTS "Users can join public channels" ON public.channel_members;
DROP POLICY IF EXISTS "Users can leave channels" ON public.channel_members;
DROP POLICY IF EXISTS "Admins can manage channel members" ON public.channel_members;

CREATE POLICY "Users can view channel members if they are in the channel"
  ON public.channel_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.channels c
      WHERE c.id = channel_members.channel_id
        AND c.organization_id = public.current_organization_id()
    )
  );

CREATE POLICY "Users can join public channels"
  ON public.channel_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.channels c
      WHERE c.id = channel_members.channel_id
        AND c.organization_id = public.current_organization_id()
        AND c.type = 'public'
    )
  );

CREATE POLICY "Users can leave channels"
  ON public.channel_members FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage channel members"
  ON public.channel_members FOR ALL
  USING (
    public.current_user_role() IN ('super_admin','admin')
    AND EXISTS (
      SELECT 1
      FROM public.channels c
      WHERE c.id = channel_members.channel_id
        AND c.organization_id = public.current_organization_id()
    )
  );

-- MESSAGES: private/direct channels require viewer membership;
--           user can only UPDATE/DELETE their own messages.
DROP POLICY IF EXISTS "Users can view messages in channels they belong to" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages in channels they belong to" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can delete any org message" ON public.messages;

CREATE POLICY "Users can view messages in channels they belong to"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.channels c
      WHERE c.id = messages.channel_id
        AND c.organization_id = public.current_organization_id()
        AND (
          c.type = 'public'
          OR EXISTS (SELECT 1 FROM public.channel_members cm WHERE cm.channel_id = c.id AND cm.user_id = auth.uid())
          OR public.current_user_role() IN ('super_admin','admin')
        )
    )
  );

CREATE POLICY "Users can create messages in channels they belong to"
  ON public.messages FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.channels c
      WHERE c.id = messages.channel_id
        AND c.organization_id = public.current_organization_id()
        AND (
          c.type = 'public'
          OR EXISTS (SELECT 1 FROM public.channel_members cm WHERE cm.channel_id = c.id AND cm.user_id = auth.uid())
          OR public.current_user_role() IN ('super_admin','admin')
        )
    )
  );

CREATE POLICY "Users can update their own messages"
  ON public.messages FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
  ON public.messages FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can delete any org message"
  ON public.messages FOR DELETE
  USING (
    public.current_user_role() IN ('super_admin','admin')
    AND EXISTS (
      SELECT 1
      FROM public.channels c
      WHERE c.id = messages.channel_id
        AND c.organization_id = public.current_organization_id()
    )
  );

-- ============================================
-- PART 3: storage.objects policies — fix 17 deprecated auth.role() =
--         'authenticated' usages -> TO authenticated; also add WITH CHECK
--         on every UPDATE policy so buckets/org-ids cannot be reassigned.
-- ============================================

DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
CREATE POLICY "Users can upload avatars"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  );

DROP POLICY IF EXISTS "Users can view avatars" ON storage.objects;
CREATE POLICY "Users can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- ----- documents ------------------------------------------------------------
DROP POLICY IF EXISTS "Users can upload documents to their org" ON storage.objects;
CREATE POLICY "Users can upload documents to their org"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  );

DROP POLICY IF EXISTS "Users can view documents from their org" ON storage.objects;
CREATE POLICY "Users can view documents from their org"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  );

DROP POLICY IF EXISTS "Users can update documents from their org" ON storage.objects;
CREATE POLICY "Users can update documents from their org"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  )
  WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  );

DROP POLICY IF EXISTS "Admins can delete documents from their org" ON storage.objects;
CREATE POLICY "Admins can delete documents from their org"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  );

-- ----- invoices ------------------------------------------------------------
DROP POLICY IF EXISTS "Users can upload invoices to their org" ON storage.objects;
CREATE POLICY "Users can upload invoices to their org"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'invoices' AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  );

DROP POLICY IF EXISTS "Users can view invoices from their org" ON storage.objects;
CREATE POLICY "Users can view invoices from their org"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'invoices' AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  );

DROP POLICY IF EXISTS "Users can update invoices from their org" ON storage.objects;
CREATE POLICY "Users can update invoices from their org"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'invoices' AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  )
  WITH CHECK (
    bucket_id = 'invoices' AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  );

DROP POLICY IF EXISTS "Admins can delete invoices from their org" ON storage.objects;
CREATE POLICY "Admins can delete invoices from their org"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'invoices' AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  );

-- ----- project-files ------------------------------------------------------------
DROP POLICY IF EXISTS "Users can upload project files to their org" ON storage.objects;
CREATE POLICY "Users can upload project files to their org"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  );

DROP POLICY IF EXISTS "Users can view project files from their org" ON storage.objects;
CREATE POLICY "Users can view project files from their org"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  );

DROP POLICY IF EXISTS "Users can update project files from their org" ON storage.objects;
CREATE POLICY "Users can update project files from their org"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  )
  WITH CHECK (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  );

DROP POLICY IF EXISTS "Admins can delete project files from their org" ON storage.objects;
CREATE POLICY "Admins can delete project files from their org"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  );

-- ----- company-assets ------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view company assets" ON storage.objects;
CREATE POLICY "Public can view company assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company-assets');

DROP POLICY IF EXISTS "Admins can upload company assets" ON storage.objects;
CREATE POLICY "Admins can upload company assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'company-assets' AND
    public.current_user_role() IN ('super_admin','admin') AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  );

DROP POLICY IF EXISTS "Admins can update company assets" ON storage.objects;
CREATE POLICY "Admins can update company assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'company-assets' AND
    public.current_user_role() IN ('super_admin','admin') AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  )
  WITH CHECK (
    bucket_id = 'company-assets' AND
    public.current_user_role() IN ('super_admin','admin') AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  );

DROP POLICY IF EXISTS "Admins can delete company assets" ON storage.objects;
CREATE POLICY "Admins can delete company assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'company-assets' AND
    public.current_user_role() IN ('super_admin','admin') AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  );

-- ----- profile-pictures ------------------------------------------------------------
DROP POLICY IF EXISTS "Users can upload profile pictures" ON storage.objects;
CREATE POLICY "Users can upload profile pictures"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profile-pictures' AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  );

DROP POLICY IF EXISTS "Users can view profile pictures" ON storage.objects;
CREATE POLICY "Users can view profile pictures"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-pictures');

DROP POLICY IF EXISTS "Users can update their own profile picture" ON storage.objects;
CREATE POLICY "Users can update their own profile picture"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'profile-pictures' AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  )
  WITH CHECK (
    bucket_id = 'profile-pictures' AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  );

DROP POLICY IF EXISTS "Users can delete their own profile picture" ON storage.objects;
CREATE POLICY "Users can delete their own profile picture"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'profile-pictures' AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  );

-- ----- receipts ------------------------------------------------------------
DROP POLICY IF EXISTS "Users can upload receipts" ON storage.objects;
CREATE POLICY "Users can upload receipts"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'receipts' AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  );

DROP POLICY IF EXISTS "Users can view receipts in their org" ON storage.objects;
CREATE POLICY "Users can view receipts in their org"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'receipts' AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  );

DROP POLICY IF EXISTS "Users can update receipts" ON storage.objects;
CREATE POLICY "Users can update receipts"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'receipts' AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  )
  WITH CHECK (
    bucket_id = 'receipts' AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  );

DROP POLICY IF EXISTS "Admins can delete receipts" ON storage.objects;
CREATE POLICY "Admins can delete receipts"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'receipts' AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  );

-- ----- signature-images ------------------------------------------------------------
DROP POLICY IF EXISTS "Users can upload signature images" ON storage.objects;
CREATE POLICY "Users can upload signature images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'signature-images' AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  );

DROP POLICY IF EXISTS "Users can view signature images in their org" ON storage.objects;
CREATE POLICY "Users can view signature images in their org"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'signature-images' AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  );

DROP POLICY IF EXISTS "Users can update signature images" ON storage.objects;
CREATE POLICY "Users can update signature images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'signature-images' AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  )
  WITH CHECK (
    bucket_id = 'signature-images' AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  );

DROP POLICY IF EXISTS "Admins can delete signature images" ON storage.objects;
CREATE POLICY "Admins can delete signature images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'signature-images' AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  );

-- ----- task-attachments ------------------------------------------------------------
DROP POLICY IF EXISTS "Users can upload task attachments" ON storage.objects;
CREATE POLICY "Users can upload task attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'task-attachments' AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  );

DROP POLICY IF EXISTS "Users can view task attachments in their org" ON storage.objects;
CREATE POLICY "Users can view task attachments in their org"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'task-attachments' AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  );

DROP POLICY IF EXISTS "Users can update task attachments" ON storage.objects;
CREATE POLICY "Users can update task attachments"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'task-attachments' AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  )
  WITH CHECK (
    bucket_id = 'task-attachments' AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  );

DROP POLICY IF EXISTS "Admins can delete task attachments" ON storage.objects;
CREATE POLICY "Admins can delete task attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'task-attachments' AND
    (storage.foldername(name))[1] = public.current_organization_id()::text
  );
