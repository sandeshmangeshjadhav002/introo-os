-- ==================================================================
-- 00011_schema_column_unification.sql
-- Fixes ERROR 42703: column "user_id" does not exist
--
-- ROOT CAUSE
--   Several tables were declared TWICE across migrations with
--   CREATE TABLE IF NOT EXISTS + differing column sets:
--     * public.activities  : 00002 (CRM entity) vs 00008 (PM audit log)
--     * public.notifications: 00001 (simple) vs 00008 (org-scoped rich)
--   On a fresh install, the EARLIER migration wins the column set,
--   so later-migration RLS policies (e.g. 00008 activities.user_id =
--   auth.uid()) and client queries (is_archived, deleted_at, updated_by,
--   notifications.body, notifications.organization_id, ...) fail with
--   42703 because the columns simply don't exist.
--
-- FIX
--   Add every missing column from the LATER-definition to the table that
--   actually exists, backfill identity/semantic columns, and re-apply the
--   updated_at trigger that some of the duplicate definitions omitted.
--   No tables are dropped so existing data is preserved.
-- ==================================================================

-- ==================================================================
-- 1. UNIFY public.activities
--    Winner on clean install: 00002 CRM activities.
--    Missing columns come from 00008 PM audit-log definition plus the
--    soft-delete / archive columns the client-side hook already queries.
-- ==================================================================

-- Columns from 00008 PM audit-log definition of "activities"
ALTER TABLE public.activities
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.activities
    ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.activities
    ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE;
ALTER TABLE public.activities
    ADD COLUMN IF NOT EXISTS action TEXT;
ALTER TABLE public.activities
    ADD COLUMN IF NOT EXISTS subject_type TEXT;
ALTER TABLE public.activities
    ADD COLUMN IF NOT EXISTS subject_id UUID;
ALTER TABLE public.activities
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Soft-delete + archive columns used by useActivities() hook that do not
-- exist in either of the original CREATE TABLE definitions.
ALTER TABLE public.activities
    ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.activities
    ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE public.activities
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 00008 RLS insert policy enforces (user_id = auth.uid()). Backfill existing
-- rows so that they still satisfy "own-row" predicates and so the column is
-- never semantically NULL for rows that DO have a creator.
UPDATE public.activities
SET    user_id = created_by
WHERE  user_id IS NULL AND created_by IS NOT NULL;

-- For rows that carry a CRM "type" but no 00008 "action", treat them as the
-- same thing so audit-log queries against action continue to work.
UPDATE public.activities
SET    action = type
WHERE  action IS NULL AND type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_activities_user_id       ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_project_id    ON public.activities(project_id);
CREATE INDEX IF NOT EXISTS idx_activities_task_id       ON public.activities(task_id);
CREATE INDEX IF NOT EXISTS idx_activities_action        ON public.activities(action);
CREATE INDEX IF NOT EXISTS idx_activities_is_archived   ON public.activities(is_archived);
CREATE INDEX IF NOT EXISTS idx_activities_deleted_at    ON public.activities(deleted_at);

-- 00002 originally added an updated_at trigger; make sure it still exists.
DROP TRIGGER IF EXISTS set_activities_updated_at ON public.activities;
CREATE TRIGGER set_activities_updated_at
    BEFORE UPDATE ON public.activities
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ==================================================================
-- 2. UNIFY public.notifications
--    Winner on clean install: 00001 simple notifications.
--    Missing columns come from 00008 org-scoped rich definition.
-- ==================================================================

ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS related_project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS related_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE;

-- 00001 used "message", 00008 used "body". Keep both columns populated so
-- neither old nor new queries break. On new inserts we write "body" per the
-- later (00008) contract but backfill existing "message" -> "body" here.
UPDATE public.notifications
SET    body = message
WHERE  body IS NULL AND message IS NOT NULL;

-- If a profile linked to the user can be resolved, backfill
-- organization_id so 00008 RLS org filters pass for legacy rows.
UPDATE public.notifications n
SET    organization_id = u.organization_id
FROM   public.users u
WHERE  n.user_id = u.id
  AND  n.organization_id IS NULL
  AND  u.organization_id IS NOT NULL;

ALTER TABLE public.notifications
    ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_organization_id  ON public.notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type             ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at          ON public.notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at       ON public.notifications(created_at);

-- 00001 originally had updated_at; 00008 did not. Keep the trigger.
DROP TRIGGER IF EXISTS set_notifications_updated_at ON public.notifications;
CREATE TRIGGER set_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ==================================================================
-- 3. PROJECTS / MILESTONES: add soft-delete / archive + updated_by
--    columns that their hooks use (same pattern as CRM activities).
-- ==================================================================

ALTER TABLE public.projects
    ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.milestones
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.milestones
    ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_updated_by   ON public.projects(updated_by);
CREATE INDEX IF NOT EXISTS idx_milestones_created_by ON public.milestones(created_by);
CREATE INDEX IF NOT EXISTS idx_milestones_updated_by ON public.milestones(updated_by);
