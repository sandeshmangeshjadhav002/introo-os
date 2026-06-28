-- ============================================
-- Add more tables to Supabase Realtime
-- ============================================

-- Helper function to check if a table is in publication
CREATE OR REPLACE FUNCTION is_table_in_publication(pub_name text, schema_name text, table_name text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = pub_name
      AND schemaname = schema_name
      AND tablename = table_name
  );
END;
$$ LANGUAGE plpgsql;

-- Add CRM tables to realtime (if not already there)
DO $$ BEGIN
  IF NOT is_table_in_publication('supabase_realtime', 'public', 'contacts') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT is_table_in_publication('supabase_realtime', 'public', 'deals') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT is_table_in_publication('supabase_realtime', 'public', 'activities') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT is_table_in_publication('supabase_realtime', 'public', 'tags') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tags;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT is_table_in_publication('supabase_realtime', 'public', 'deal_stages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.deal_stages;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT is_table_in_publication('supabase_realtime', 'public', 'leads') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT is_table_in_publication('supabase_realtime', 'public', 'clients') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
  END IF;
END $$;

-- Add Project Management tables (if not already there)
DO $$ BEGIN
  IF NOT is_table_in_publication('supabase_realtime', 'public', 'projects') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT is_table_in_publication('supabase_realtime', 'public', 'sprints') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sprints;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT is_table_in_publication('supabase_realtime', 'public', 'milestones') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.milestones;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT is_table_in_publication('supabase_realtime', 'public', 'labels') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.labels;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT is_table_in_publication('supabase_realtime', 'public', 'task_labels') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.task_labels;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT is_table_in_publication('supabase_realtime', 'public', 'subtasks') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.subtasks;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT is_table_in_publication('supabase_realtime', 'public', 'task_comments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT is_table_in_publication('supabase_realtime', 'public', 'project_files') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.project_files;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT is_table_in_publication('supabase_realtime', 'public', 'task_files') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.task_files;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT is_table_in_publication('supabase_realtime', 'public', 'time_logs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.time_logs;
  END IF;
END $$;

-- Add HR tables (if not already there)
DO $$ BEGIN
  IF NOT is_table_in_publication('supabase_realtime', 'public', 'employees') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT is_table_in_publication('supabase_realtime', 'public', 'attendance') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT is_table_in_publication('supabase_realtime', 'public', 'leave_requests') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.leave_requests;
  END IF;
END $$;

-- Add Finance tables (if not already there)
DO $$ BEGIN
  IF NOT is_table_in_publication('supabase_realtime', 'public', 'invoices') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT is_table_in_publication('supabase_realtime', 'public', 'payments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
  END IF;
END $$;
