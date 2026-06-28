-- ============================================
-- Add organization_id to tasks table for better performance
-- ============================================

-- Step 1: Add organization_id column
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Step 2: Backfill existing tasks with organization_id from their projects
UPDATE public.tasks t
SET organization_id = p.organization_id
FROM public.projects p
WHERE t.project_id = p.id AND t.organization_id IS NULL;

-- Step 3: Make organization_id NOT NULL after backfilling
ALTER TABLE public.tasks ALTER COLUMN organization_id SET NOT NULL;

-- Step 4: Add index on organization_id
CREATE INDEX IF NOT EXISTS idx_tasks_organization_id ON public.tasks(organization_id);

-- Step 5: Update RLS policies for tasks to use organization_id instead of task_belongs_to_organization function
DROP POLICY IF EXISTS "Users can view tasks in their organization" ON public.tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins and managers can delete tasks" ON public.tasks;

CREATE POLICY "Users can view tasks in their organization" ON public.tasks
    FOR SELECT USING (organization_id = current_organization_id());

CREATE POLICY "Users can create tasks" ON public.tasks
    FOR INSERT WITH CHECK (organization_id = current_organization_id());

CREATE POLICY "Users can update tasks" ON public.tasks
    FOR UPDATE USING (organization_id = current_organization_id());

CREATE POLICY "Admins and managers can delete tasks" ON public.tasks
    FOR DELETE USING (
        organization_id = current_organization_id() AND
        (current_user_role() = 'super_admin' OR current_user_role() = 'admin' OR current_user_role() = 'manager')
    );

-- Step 6: Create trigger to set organization_id from project on insert/update
CREATE OR REPLACE FUNCTION public.set_task_organization_from_project()
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

DROP TRIGGER IF EXISTS on_task_set_organization ON public.tasks;
CREATE TRIGGER on_task_set_organization
    BEFORE INSERT OR UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.set_task_organization_from_project();
