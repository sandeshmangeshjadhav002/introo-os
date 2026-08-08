-- ============================================
-- Final Project Management Schema Fixes
-- ============================================

-- ============================================
-- Add missing columns to projects table
-- ============================================
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3b82f6';

CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_archived ON public.projects(archived);

-- ============================================
-- Add missing columns to tasks table
-- ============================================
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS recurring_interval TEXT CHECK (recurring_interval IN ('daily', 'weekly', 'biweekly', 'monthly', 'yearly', NULL));
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS recurring_count INTEGER DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON public.tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_progress ON public.tasks(progress);

-- ============================================
-- Add organization_id to milestones and sprints for better RLS and querying
-- ============================================

-- Milestones
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
UPDATE public.milestones m
SET organization_id = p.organization_id
FROM public.projects p
WHERE m.project_id = p.id AND m.organization_id IS NULL;
ALTER TABLE public.milestones ALTER COLUMN organization_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_milestones_organization_id ON public.milestones(organization_id);

-- Drop old RLS policies that use expensive EXISTS check
DROP POLICY IF EXISTS "Users can view milestones in their organization" ON public.milestones;
DROP POLICY IF EXISTS "Users can create milestones" ON public.milestones;
DROP POLICY IF EXISTS "Users can update milestones" ON public.milestones;
DROP POLICY IF EXISTS "Admins and managers can delete milestones" ON public.milestones;

-- New simpler RLS using organization_id
CREATE POLICY "Users can view milestones in their organization" ON public.milestones
    FOR SELECT USING (organization_id = current_organization_id());
CREATE POLICY "Users can create milestones" ON public.milestones
    FOR INSERT WITH CHECK (organization_id = current_organization_id());
CREATE POLICY "Users can update milestones" ON public.milestones
    FOR UPDATE USING (organization_id = current_organization_id());
CREATE POLICY "Admins and managers can delete milestones" ON public.milestones
    FOR DELETE USING (
        organization_id = current_organization_id() AND
        (current_user_role() = 'super_admin' OR current_user_role() = 'admin' OR current_user_role() = 'manager')
    );

-- Trigger to set milestone organization_id from project
CREATE OR REPLACE FUNCTION public.set_milestone_organization_from_project()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.project_id IS NOT NULL THEN
        SELECT p.organization_id INTO NEW.organization_id
        FROM public.projects p
        WHERE p.id = NEW.project_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_milestone_set_organization ON public.milestones;
CREATE TRIGGER on_milestone_set_organization
    BEFORE INSERT OR UPDATE ON public.milestones
    FOR EACH ROW EXECUTE FUNCTION public.set_milestone_organization_from_project();

-- Sprints
ALTER TABLE public.sprints ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
UPDATE public.sprints s
SET organization_id = p.organization_id
FROM public.projects p
WHERE s.project_id = p.id AND s.organization_id IS NULL;
ALTER TABLE public.sprints ALTER COLUMN organization_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sprints_organization_id ON public.sprints(organization_id);

-- Drop old RLS policies
DROP POLICY IF EXISTS "Users can view sprints in their organization" ON public.sprints;
DROP POLICY IF EXISTS "Users can create sprints" ON public.sprints;
DROP POLICY IF EXISTS "Users can update sprints" ON public.sprints;
DROP POLICY IF EXISTS "Admins and managers can delete sprints" ON public.sprints;

-- New simpler RLS
CREATE POLICY "Users can view sprints in their organization" ON public.sprints
    FOR SELECT USING (organization_id = current_organization_id());
CREATE POLICY "Users can create sprints" ON public.sprints
    FOR INSERT WITH CHECK (organization_id = current_organization_id());
CREATE POLICY "Users can update sprints" ON public.sprints
    FOR UPDATE USING (organization_id = current_organization_id());
CREATE POLICY "Admins and managers can delete sprints" ON public.sprints
    FOR DELETE USING (
        organization_id = current_organization_id() AND
        (current_user_role() = 'super_admin' OR current_user_role() = 'admin' OR current_user_role() = 'manager')
    );

-- Trigger to set sprint organization_id from project
CREATE OR REPLACE FUNCTION public.set_sprint_organization_from_project()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.project_id IS NOT NULL THEN
        SELECT p.organization_id INTO NEW.organization_id
        FROM public.projects p
        WHERE p.id = NEW.project_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_sprint_set_organization ON public.sprints;
CREATE TRIGGER on_sprint_set_organization
    BEFORE INSERT OR UPDATE ON public.sprints
    FOR EACH ROW EXECUTE FUNCTION public.set_sprint_organization_from_project();

-- Time Logs - add organization_id
ALTER TABLE public.time_logs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
UPDATE public.time_logs tl
SET organization_id = p.organization_id
FROM public.projects p
WHERE tl.project_id = p.id AND tl.organization_id IS NULL;
ALTER TABLE public.time_logs ALTER COLUMN organization_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_time_logs_organization_id ON public.time_logs(organization_id);

-- Drop old policies
DROP POLICY IF EXISTS "Users can view time logs in their organization" ON public.time_logs;
DROP POLICY IF EXISTS "Users can create their own time logs" ON public.time_logs;
DROP POLICY IF EXISTS "Users can update their own time logs" ON public.time_logs;
DROP POLICY IF EXISTS "Users can delete their own time logs" ON public.time_logs;

-- New simpler RLS
CREATE POLICY "Users can view time logs in their organization" ON public.time_logs
    FOR SELECT USING (organization_id = current_organization_id());
CREATE POLICY "Users can create their own time logs" ON public.time_logs
    FOR INSERT WITH CHECK (organization_id = current_organization_id() AND user_id = auth.uid());
CREATE POLICY "Users can update their own time logs" ON public.time_logs
    FOR UPDATE USING (organization_id = current_organization_id() AND user_id = auth.uid());
CREATE POLICY "Users can delete their own time logs" ON public.time_logs
    FOR DELETE USING (organization_id = current_organization_id() AND (user_id = auth.uid() OR current_user_role() IN ('super_admin', 'admin', 'manager')));

-- Trigger to set timelog organization from project
CREATE OR REPLACE FUNCTION public.set_timelog_organization_from_project()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.project_id IS NOT NULL THEN
        SELECT p.organization_id INTO NEW.organization_id
        FROM public.projects p
        WHERE p.id = NEW.project_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_timelog_set_organization ON public.time_logs;
CREATE TRIGGER on_timelog_set_organization
    BEFORE INSERT OR UPDATE ON public.time_logs
    FOR EACH ROW EXECUTE FUNCTION public.set_timelog_organization_from_project();

-- ============================================
-- ACTIVITIES TABLE (audit log)
-- ============================================
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    subject_type TEXT,
    subject_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activities_organization_id ON public.activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_project_id ON public.activities(project_id);
CREATE INDEX IF NOT EXISTS idx_activities_task_id ON public.activities(task_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at);
CREATE INDEX IF NOT EXISTS idx_activities_action ON public.activities(action);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activities in their organization" ON public.activities
    FOR SELECT USING (organization_id = current_organization_id());

CREATE POLICY "Users can create activities" ON public.activities
    FOR INSERT WITH CHECK (organization_id = current_organization_id() AND user_id = auth.uid());

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    related_project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    related_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_organization_id ON public.notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid() AND organization_id = current_organization_id());

CREATE POLICY "Users can create notifications for same org" ON public.notifications
    FOR INSERT WITH CHECK (organization_id = current_organization_id());

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid() AND organization_id = current_organization_id());

CREATE POLICY "Users can delete their own notifications" ON public.notifications
    FOR DELETE USING (user_id = auth.uid() AND organization_id = current_organization_id());

-- ============================================
-- CUSTOM FIELDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.custom_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('project', 'task', 'milestone')),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('text', 'number', 'date', 'select', 'multi_select', 'boolean')),
    options TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_required BOOLEAN DEFAULT FALSE,
    config JSONB DEFAULT '{}'::jsonb,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view custom fields in their organization" ON public.custom_fields
    FOR SELECT USING (organization_id = current_organization_id());

CREATE POLICY "Admins can create custom fields" ON public.custom_fields
    FOR INSERT WITH CHECK (organization_id = current_organization_id() AND (current_user_role() = 'super_admin' OR current_user_role() = 'admin'));

CREATE POLICY "Admins can update custom fields" ON public.custom_fields
    FOR UPDATE USING (organization_id = current_organization_id() AND (current_user_role() = 'super_admin' OR current_user_role() = 'admin'));

CREATE POLICY "Admins can delete custom fields" ON public.custom_fields
    FOR DELETE USING (organization_id = current_organization_id() AND (current_user_role() = 'super_admin' OR current_user_role() = 'admin'));

DROP TRIGGER IF EXISTS set_custom_fields_updated_at ON public.custom_fields;
CREATE TRIGGER set_custom_fields_updated_at
    BEFORE UPDATE ON public.custom_fields
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- PROJECT MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.project_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'manager', 'member', 'viewer')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view project members in their organization" ON public.project_members;
CREATE POLICY "Users can view project members in their organization" ON public.project_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_members.project_id AND p.organization_id = current_organization_id()
        )
    );

DROP POLICY IF EXISTS "Admins and managers can manage project members" ON public.project_members;
CREATE POLICY "Admins and managers can manage project members" ON public.project_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_members.project_id AND p.organization_id = current_organization_id()
        ) AND (current_user_role() = 'super_admin' OR current_user_role() = 'admin' OR current_user_role() = 'manager')
    );

DROP POLICY IF EXISTS "Admins and managers can update project members" ON public.project_members;
CREATE POLICY "Admins and managers can update project members" ON public.project_members
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_members.project_id AND p.organization_id = current_organization_id()
        ) AND (current_user_role() = 'super_admin' OR current_user_role() = 'admin' OR current_user_role() = 'manager')
    );

DROP POLICY IF EXISTS "Admins and managers can delete project members" ON public.project_members;
CREATE POLICY "Admins and managers can delete project members" ON public.project_members
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_members.project_id AND p.organization_id = current_organization_id()
        ) AND (current_user_role() = 'super_admin' OR current_user_role() = 'admin' OR current_user_role() = 'manager')
    );
