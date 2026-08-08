-- ============================================
-- Add RLS policies for task_labels and task_dependencies
-- ============================================

-- task_labels
ALTER TABLE public.task_labels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view task labels in their organization" ON public.task_labels;
CREATE POLICY "Users can view task labels in their organization" ON public.task_labels
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_labels.task_id AND t.organization_id = current_organization_id()
        )
    );

DROP POLICY IF EXISTS "Users can create task labels" ON public.task_labels;
CREATE POLICY "Users can create task labels" ON public.task_labels
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_labels.task_id AND t.organization_id = current_organization_id()
        )
    );

DROP POLICY IF EXISTS "Users can delete task labels" ON public.task_labels;
CREATE POLICY "Users can delete task labels" ON public.task_labels
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_labels.task_id AND t.organization_id = current_organization_id()
        )
    );

-- task_dependencies
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view task dependencies in their organization" ON public.task_dependencies;
CREATE POLICY "Users can view task dependencies in their organization" ON public.task_dependencies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_dependencies.task_id AND t.organization_id = current_organization_id()
        )
    );

DROP POLICY IF EXISTS "Users can create task dependencies" ON public.task_dependencies;
CREATE POLICY "Users can create task dependencies" ON public.task_dependencies
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_dependencies.task_id AND t.organization_id = current_organization_id()
        ) AND EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_dependencies.depends_on_task_id AND t.organization_id = current_organization_id()
        )
    );

DROP POLICY IF EXISTS "Users can delete task dependencies" ON public.task_dependencies;
CREATE POLICY "Users can delete task dependencies" ON public.task_dependencies
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_dependencies.task_id AND t.organization_id = current_organization_id()
        )
    );

-- project_files and task_files - add organization_id columns for better RLS
ALTER TABLE public.project_files ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
UPDATE public.project_files pf
SET organization_id = p.organization_id
FROM public.projects p
WHERE pf.project_id = p.id AND pf.organization_id IS NULL;
ALTER TABLE public.project_files ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE public.task_files ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
UPDATE public.task_files tf
SET organization_id = t.organization_id
FROM public.tasks t
WHERE tf.task_id = t.id AND tf.organization_id IS NULL;
ALTER TABLE public.task_files ALTER COLUMN organization_id SET NOT NULL;

-- task_comments - add organization_id for better RLS
ALTER TABLE public.task_comments ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
UPDATE public.task_comments tc
SET organization_id = t.organization_id
FROM public.tasks t
WHERE tc.task_id = t.id AND tc.organization_id IS NULL;
ALTER TABLE public.task_comments ALTER COLUMN organization_id SET NOT NULL;

-- subtasks - add organization_id
ALTER TABLE public.subtasks ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
UPDATE public.subtasks st
SET organization_id = t.organization_id
FROM public.tasks t
WHERE st.task_id = t.id AND st.organization_id IS NULL;
ALTER TABLE public.subtasks ALTER COLUMN organization_id SET NOT NULL;
