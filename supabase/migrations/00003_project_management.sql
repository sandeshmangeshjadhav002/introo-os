-- ============================================
-- Project Management Extension Schema for Introo OS
-- ============================================

-- ============================================
-- SUBTASKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.subtasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON public.subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_order ON public.subtasks(order_index);

ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view subtasks in their organization" ON public.subtasks;
CREATE POLICY "Users can view subtasks in their organization" ON public.subtasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            WHERE t.id = subtasks.task_id AND p.organization_id = current_organization_id()
        )
    );

DROP POLICY IF EXISTS "Users can create subtasks" ON public.subtasks;
CREATE POLICY "Users can create subtasks" ON public.subtasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            WHERE t.id = subtasks.task_id AND p.organization_id = current_organization_id()
        )
    );

DROP POLICY IF EXISTS "Users can update subtasks" ON public.subtasks;
CREATE POLICY "Users can update subtasks" ON public.subtasks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            WHERE t.id = subtasks.task_id AND p.organization_id = current_organization_id()
        )
    );

DROP POLICY IF EXISTS "Users can delete subtasks" ON public.subtasks;
CREATE POLICY "Users can delete subtasks" ON public.subtasks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            WHERE t.id = subtasks.task_id AND p.organization_id = current_organization_id()
        )
    );

DROP TRIGGER IF EXISTS set_subtasks_updated_at ON public.subtasks;
CREATE TRIGGER set_subtasks_updated_at
    BEFORE UPDATE ON public.subtasks
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- MILESTONES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue', 'cancelled')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON public.milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON public.milestones(status);
CREATE INDEX IF NOT EXISTS idx_milestones_due_date ON public.milestones(due_date);

ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view milestones in their organization" ON public.milestones;
CREATE POLICY "Users can view milestones in their organization" ON public.milestones
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = milestones.project_id AND p.organization_id = current_organization_id()
        )
    );

DROP POLICY IF EXISTS "Users can create milestones" ON public.milestones;
CREATE POLICY "Users can create milestones" ON public.milestones
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = milestones.project_id AND p.organization_id = current_organization_id()
        )
    );

DROP POLICY IF EXISTS "Users can update milestones" ON public.milestones;
CREATE POLICY "Users can update milestones" ON public.milestones
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = milestones.project_id AND p.organization_id = current_organization_id()
        )
    );

DROP POLICY IF EXISTS "Admins and managers can delete milestones" ON public.milestones;
CREATE POLICY "Admins and managers can delete milestones" ON public.milestones
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = milestones.project_id AND p.organization_id = current_organization_id()
        )
        AND (current_user_role() = 'super_admin' OR current_user_role() = 'admin' OR current_user_role() = 'manager')
    );

DROP TRIGGER IF EXISTS set_milestones_updated_at ON public.milestones;
CREATE TRIGGER set_milestones_updated_at
    BEFORE UPDATE ON public.milestones
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- SPRINTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.sprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
    goal TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sprints_project_id ON public.sprints(project_id);
CREATE INDEX IF NOT EXISTS idx_sprints_status ON public.sprints(status);
CREATE INDEX IF NOT EXISTS idx_sprints_date ON public.sprints(start_date, end_date);

ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view sprints in their organization" ON public.sprints;
CREATE POLICY "Users can view sprints in their organization" ON public.sprints
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = sprints.project_id AND p.organization_id = current_organization_id()
        )
    );

DROP POLICY IF EXISTS "Users can create sprints" ON public.sprints;
CREATE POLICY "Users can create sprints" ON public.sprints
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = sprints.project_id AND p.organization_id = current_organization_id()
        )
    );

DROP POLICY IF EXISTS "Users can update sprints" ON public.sprints;
CREATE POLICY "Users can update sprints" ON public.sprints
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = sprints.project_id AND p.organization_id = current_organization_id()
        )
    );

DROP POLICY IF EXISTS "Admins and managers can delete sprints" ON public.sprints;
CREATE POLICY "Admins and managers can delete sprints" ON public.sprints
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = sprints.project_id AND p.organization_id = current_organization_id()
        )
        AND (current_user_role() = 'super_admin' OR current_user_role() = 'admin' OR current_user_role() = 'manager')
    );

DROP TRIGGER IF EXISTS set_sprints_updated_at ON public.sprints;
CREATE TRIGGER set_sprints_updated_at
    BEFORE UPDATE ON public.sprints
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- Add sprint_id column to tasks
-- ============================================
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS sprint_id UUID REFERENCES public.sprints(id) ON DELETE SET NULL;

-- ============================================
-- TIME LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.time_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    duration INTEGER, -- in minutes
    is_billable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_time_logs_task_id ON public.time_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_project_id ON public.time_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_user_id ON public.time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_date ON public.time_logs(created_at);

ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view time logs in their organization" ON public.time_logs;
CREATE POLICY "Users can view time logs in their organization" ON public.time_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = time_logs.project_id AND p.organization_id = current_organization_id()
        )
    );

DROP POLICY IF EXISTS "Users can create their own time logs" ON public.time_logs;
CREATE POLICY "Users can create their own time logs" ON public.time_logs
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = time_logs.project_id AND p.organization_id = current_organization_id()
        )
    );

DROP POLICY IF EXISTS "Users can update their own time logs" ON public.time_logs;
CREATE POLICY "Users can update their own time logs" ON public.time_logs
    FOR UPDATE USING (
        user_id = auth.uid() AND EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = time_logs.project_id AND p.organization_id = current_organization_id()
        )
    );

DROP POLICY IF EXISTS "Users can delete their own time logs" ON public.time_logs;
CREATE POLICY "Users can delete their own time logs" ON public.time_logs
    FOR DELETE USING (
        user_id = auth.uid() AND EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = time_logs.project_id AND p.organization_id = current_organization_id()
        )
    );

DROP TRIGGER IF EXISTS set_time_logs_updated_at ON public.time_logs;
CREATE TRIGGER set_time_logs_updated_at
    BEFORE UPDATE ON public.time_logs
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- LABELS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.labels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3b82f6',
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, name)
);

CREATE INDEX IF NOT EXISTS idx_labels_organization_id ON public.labels(organization_id);

ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view labels in their organization" ON public.labels;
CREATE POLICY "Users can view labels in their organization" ON public.labels
    FOR SELECT USING (organization_id = current_organization_id());

DROP POLICY IF EXISTS "Users can create labels" ON public.labels;
CREATE POLICY "Users can create labels" ON public.labels
    FOR INSERT WITH CHECK (organization_id = current_organization_id());

DROP POLICY IF EXISTS "Users can update labels" ON public.labels;
CREATE POLICY "Users can update labels" ON public.labels
    FOR UPDATE USING (organization_id = current_organization_id());

DROP POLICY IF EXISTS "Admins can delete labels" ON public.labels;
CREATE POLICY "Admins can delete labels" ON public.labels
    FOR DELETE USING (
        organization_id = current_organization_id() AND
        (current_user_role() = 'super_admin' OR current_user_role() = 'admin')
    );

DROP TRIGGER IF EXISTS set_labels_updated_at ON public.labels;
CREATE TRIGGER set_labels_updated_at
    BEFORE UPDATE ON public.labels
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- TASK LABELS JUNCTION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.task_labels (
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    label_id UUID REFERENCES public.labels(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, label_id)
);

CREATE INDEX IF NOT EXISTS idx_task_labels_task_id ON public.task_labels(task_id);
CREATE INDEX IF NOT EXISTS idx_task_labels_label_id ON public.task_labels(label_id);

-- ============================================
-- TASK DEPENDENCIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.task_dependencies (
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    dependency_type TEXT DEFAULT 'finish_to_start' CHECK (dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')),
    PRIMARY KEY (task_id, depends_on_task_id)
);

CREATE INDEX IF NOT EXISTS idx_task_deps_task_id ON public.task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_deps_depends_on ON public.task_dependencies(depends_on_task_id);

-- ============================================
-- TASK COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.task_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON public.task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created ON public.task_comments(created_at);

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view comments in their organization" ON public.task_comments;
CREATE POLICY "Users can view comments in their organization" ON public.task_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            WHERE t.id = task_comments.task_id AND p.organization_id = current_organization_id()
        )
    );

DROP POLICY IF EXISTS "Users can create comments" ON public.task_comments;
CREATE POLICY "Users can create comments" ON public.task_comments
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            WHERE t.id = task_comments.task_id AND p.organization_id = current_organization_id()
        )
    );

DROP POLICY IF EXISTS "Users can update their own comments" ON public.task_comments;
CREATE POLICY "Users can update their own comments" ON public.task_comments
    FOR UPDATE USING (
        user_id = auth.uid() AND EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            WHERE t.id = task_comments.task_id AND p.organization_id = current_organization_id()
        )
    );

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.task_comments;
CREATE POLICY "Users can delete their own comments" ON public.task_comments
    FOR DELETE USING (
        user_id = auth.uid() AND EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            WHERE t.id = task_comments.task_id AND p.organization_id = current_organization_id()
        )
    );

DROP TRIGGER IF EXISTS set_task_comments_updated_at ON public.task_comments;
CREATE TRIGGER set_task_comments_updated_at
    BEFORE UPDATE ON public.task_comments
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- PROJECT FILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.project_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    folder TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON public.project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_user_id ON public.project_files(user_id);

ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view project files in their organization" ON public.project_files;
CREATE POLICY "Users can view project files in their organization" ON public.project_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_files.project_id AND p.organization_id = current_organization_id()
        )
    );

DROP POLICY IF EXISTS "Users can upload project files" ON public.project_files;
CREATE POLICY "Users can upload project files" ON public.project_files
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_files.project_id AND p.organization_id = current_organization_id()
        )
    );

DROP POLICY IF EXISTS "Users can update their own project files" ON public.project_files;
CREATE POLICY "Users can update their own project files" ON public.project_files
    FOR UPDATE USING (
        (user_id = auth.uid() OR current_user_role() = 'super_admin' OR current_user_role() = 'admin') AND EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_files.project_id AND p.organization_id = current_organization_id()
        )
    );

DROP POLICY IF EXISTS "Users can delete their own project files" ON public.project_files;
CREATE POLICY "Users can delete their own project files" ON public.project_files
    FOR DELETE USING (
        (user_id = auth.uid() OR current_user_role() = 'super_admin' OR current_user_role() = 'admin') AND EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_files.project_id AND p.organization_id = current_organization_id()
        )
    );

DROP TRIGGER IF EXISTS set_project_files_updated_at ON public.project_files;
CREATE TRIGGER set_project_files_updated_at
    BEFORE UPDATE ON public.project_files
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- TASK FILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.task_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_task_files_task_id ON public.task_files(task_id);
CREATE INDEX IF NOT EXISTS idx_task_files_user_id ON public.task_files(user_id);

ALTER TABLE public.task_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view task files in their organization" ON public.task_files;
CREATE POLICY "Users can view task files in their organization" ON public.task_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            WHERE t.id = task_files.task_id AND p.organization_id = current_organization_id()
        )
    );

DROP POLICY IF EXISTS "Users can upload task files" ON public.task_files;
CREATE POLICY "Users can upload task files" ON public.task_files
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            WHERE t.id = task_files.task_id AND p.organization_id = current_organization_id()
        )
    );

DROP POLICY IF EXISTS "Users can update their own task files" ON public.task_files;
CREATE POLICY "Users can update their own task files" ON public.task_files
    FOR UPDATE USING (
        (user_id = auth.uid() OR current_user_role() = 'super_admin' OR current_user_role() = 'admin') AND EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            WHERE t.id = task_files.task_id AND p.organization_id = current_organization_id()
        )
    );

DROP POLICY IF EXISTS "Users can delete their own task files" ON public.task_files;
CREATE POLICY "Users can delete their own task files" ON public.task_files
    FOR DELETE USING (
        (user_id = auth.uid() OR current_user_role() = 'super_admin' OR current_user_role() = 'admin') AND EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            WHERE t.id = task_files.task_id AND p.organization_id = current_organization_id()
        )
    );

DROP TRIGGER IF EXISTS set_task_files_updated_at ON public.task_files;
CREATE TRIGGER set_task_files_updated_at
    BEFORE UPDATE ON public.task_files
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- Add more fields to tasks and projects
-- ============================================
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS estimated_hours INTEGER;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS actual_hours INTEGER DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS budget NUMERIC;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

-- ============================================
-- Add default labels
-- ============================================
-- We'll add labels when an organization is created, or just let users create them.
