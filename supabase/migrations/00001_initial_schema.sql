-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create helper function to check if table is in publication
CREATE OR REPLACE FUNCTION public.is_table_in_publication(pub_name text, schema_name text, table_name text)
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

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Create function to get current user's organization id
CREATE OR REPLACE FUNCTION public.current_organization_id()
RETURNS UUID AS $$
DECLARE
  org_id UUID;
BEGIN
  SELECT organization_id INTO org_id FROM public.users WHERE id = auth.uid() LIMIT 1;
  RETURN org_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Create function to get current user's role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE id = auth.uid() LIMIT 1;
  RETURN user_role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================
-- ORGANIZATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    industry TEXT,
    size TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Organizations indexes
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON public.organizations(created_at);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Organizations RLS policies
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;
CREATE POLICY "Users can view their own organization" ON public.organizations
  FOR SELECT USING (id = current_organization_id());

DROP POLICY IF EXISTS "Super admins can create organizations" ON public.organizations;
CREATE POLICY "Super admins can create organizations" ON public.organizations
  FOR INSERT WITH CHECK (current_user_role() = 'super_admin');

DROP POLICY IF EXISTS "Super admins and admins can update organizations" ON public.organizations;
CREATE POLICY "Super admins and admins can update organizations" ON public.organizations
  FOR UPDATE USING (id = current_organization_id() AND (current_user_role() = 'super_admin' OR current_user_role() = 'admin'));

-- Organizations triggers
DROP TRIGGER IF EXISTS set_organizations_updated_at ON public.organizations;
CREATE TRIGGER set_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('super_admin', 'admin', 'manager', 'employee', 'client')),
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON public.users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users RLS policies
DROP POLICY IF EXISTS "Users can view all users in their organization" ON public.users;
CREATE POLICY "Users can view all users in their organization" ON public.users
  FOR SELECT USING (organization_id = current_organization_id());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins and managers can create users" ON public.users;
CREATE POLICY "Admins and managers can create users" ON public.users
  FOR INSERT WITH CHECK (organization_id = current_organization_id() AND (current_user_role() = 'super_admin' OR current_user_role() = 'admin' OR current_user_role() = 'manager'));

DROP POLICY IF EXISTS "Admins can update and delete users" ON public.users;
CREATE POLICY "Admins can update and delete users" ON public.users
  FOR ALL USING (organization_id = current_organization_id() AND (current_user_role() = 'super_admin' OR current_user_role() = 'admin'));

-- Users triggers
DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;
CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Create a trigger to automatically create a public.users entry when a new auth.user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- CLIENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    company_name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'lead')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Clients indexes
CREATE INDEX IF NOT EXISTS idx_clients_organization_id ON public.clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Clients RLS policies
DROP POLICY IF EXISTS "Users can view clients in their organization" ON public.clients;
CREATE POLICY "Users can view clients in their organization" ON public.clients
  FOR SELECT USING (organization_id = current_organization_id());

DROP POLICY IF EXISTS "Users can create clients" ON public.clients;
CREATE POLICY "Users can create clients" ON public.clients
  FOR INSERT WITH CHECK (organization_id = current_organization_id());

DROP POLICY IF EXISTS "Users can update clients" ON public.clients;
CREATE POLICY "Users can update clients" ON public.clients
  FOR UPDATE USING (organization_id = current_organization_id());

DROP POLICY IF EXISTS "Admins and managers can delete clients" ON public.clients;
CREATE POLICY "Admins and managers can delete clients" ON public.clients
  FOR DELETE USING (organization_id = current_organization_id() AND (current_user_role() = 'super_admin' OR current_user_role() = 'admin' OR current_user_role() = 'manager'));

-- Clients triggers
DROP TRIGGER IF EXISTS set_clients_updated_at ON public.clients;
CREATE TRIGGER set_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- LEADS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    source TEXT,
    value NUMERIC,
    stage TEXT DEFAULT 'new' CHECK (stage IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Leads indexes
CREATE INDEX IF NOT EXISTS idx_leads_organization_id ON public.leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON public.leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Leads RLS policies
DROP POLICY IF EXISTS "Users can view leads in their organization" ON public.leads;
CREATE POLICY "Users can view leads in their organization" ON public.leads
  FOR SELECT USING (organization_id = current_organization_id());

DROP POLICY IF EXISTS "Users can create leads" ON public.leads;
CREATE POLICY "Users can create leads" ON public.leads
  FOR INSERT WITH CHECK (organization_id = current_organization_id());

DROP POLICY IF EXISTS "Users can update leads" ON public.leads;
CREATE POLICY "Users can update leads" ON public.leads
  FOR UPDATE USING (organization_id = current_organization_id());

DROP POLICY IF EXISTS "Admins and managers can delete leads" ON public.leads;
CREATE POLICY "Admins and managers can delete leads" ON public.leads
  FOR DELETE USING (organization_id = current_organization_id() AND (current_user_role() = 'super_admin' OR current_user_role() = 'admin' OR current_user_role() = 'manager'));

-- Leads triggers
DROP TRIGGER IF EXISTS set_leads_updated_at ON public.leads;
CREATE TRIGGER set_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- PROJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'on_hold', 'completed', 'cancelled')),
    start_date DATE,
    end_date DATE,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON public.projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Projects RLS policies
DROP POLICY IF EXISTS "Users can view projects in their organization" ON public.projects;
CREATE POLICY "Users can view projects in their organization" ON public.projects
  FOR SELECT USING (organization_id = current_organization_id());

DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
CREATE POLICY "Users can create projects" ON public.projects
  FOR INSERT WITH CHECK (organization_id = current_organization_id());

DROP POLICY IF EXISTS "Users can update projects" ON public.projects;
CREATE POLICY "Users can update projects" ON public.projects
  FOR UPDATE USING (organization_id = current_organization_id());

DROP POLICY IF EXISTS "Admins and managers can delete projects" ON public.projects;
CREATE POLICY "Admins and managers can delete projects" ON public.projects
  FOR DELETE USING (organization_id = current_organization_id() AND (current_user_role() = 'super_admin' OR current_user_role() = 'admin' OR current_user_role() = 'manager'));

-- Projects triggers
DROP TRIGGER IF EXISTS set_projects_updated_at ON public.projects;
CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- TASKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'cancelled')),
    due_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Tasks RLS policies (using a helper function to get organization from project)
CREATE OR REPLACE FUNCTION public.task_belongs_to_organization(task_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.projects p ON t.project_id = p.id
    WHERE t.id = task_id AND p.organization_id = current_organization_id()
  );
END;
$$ LANGUAGE plpgsql STABLE;

DROP POLICY IF EXISTS "Users can view tasks in their organization" ON public.tasks;
CREATE POLICY "Users can view tasks in their organization" ON public.tasks
  FOR SELECT USING (task_belongs_to_organization(id));

DROP POLICY IF EXISTS "Users can create tasks" ON public.tasks;
CREATE POLICY "Users can create tasks" ON public.tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.organization_id = current_organization_id()
    )
  );

DROP POLICY IF EXISTS "Users can update tasks" ON public.tasks;
CREATE POLICY "Users can update tasks" ON public.tasks
  FOR UPDATE USING (task_belongs_to_organization(id));

DROP POLICY IF EXISTS "Admins and managers can delete tasks" ON public.tasks;
CREATE POLICY "Admins and managers can delete tasks" ON public.tasks
  FOR DELETE USING (
    task_belongs_to_organization(id) AND
    (current_user_role() = 'super_admin' OR current_user_role() = 'admin' OR current_user_role() = 'manager')
  );

-- Tasks triggers
DROP TRIGGER IF EXISTS set_tasks_updated_at ON public.tasks;
CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- EMPLOYEES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    department TEXT,
    designation TEXT,
    joining_date DATE,
    salary NUMERIC,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Employees indexes
CREATE INDEX IF NOT EXISTS idx_employees_organization_id ON public.employees(organization_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Employees RLS policies
DROP POLICY IF EXISTS "Users can view employees in their organization" ON public.employees;
CREATE POLICY "Users can view employees in their organization" ON public.employees
  FOR SELECT USING (organization_id = current_organization_id());

DROP POLICY IF EXISTS "Admins and managers can create employees" ON public.employees;
CREATE POLICY "Admins and managers can create employees" ON public.employees
  FOR INSERT WITH CHECK (organization_id = current_organization_id() AND (current_user_role() = 'super_admin' OR current_user_role() = 'admin' OR current_user_role() = 'manager'));

DROP POLICY IF EXISTS "Admins and managers can update employees" ON public.employees;
CREATE POLICY "Admins and managers can update employees" ON public.employees
  FOR UPDATE USING (organization_id = current_organization_id() AND (current_user_role() = 'super_admin' OR current_user_role() = 'admin' OR current_user_role() = 'manager'));

DROP POLICY IF EXISTS "Admins can delete employees" ON public.employees;
CREATE POLICY "Admins can delete employees" ON public.employees
  FOR DELETE USING (organization_id = current_organization_id() AND (current_user_role() = 'super_admin' OR current_user_role() = 'admin'));

-- Employees triggers
DROP TRIGGER IF EXISTS set_employees_updated_at ON public.employees;
CREATE TRIGGER set_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- ATTENDANCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half_day')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Attendance indexes
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON public.attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);

-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Helper function to check if attendance belongs to org
CREATE OR REPLACE FUNCTION public.attendance_belongs_to_organization(attendance_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.attendance a
    JOIN public.employees e ON a.employee_id = e.id
    WHERE a.id = attendance_id AND e.organization_id = current_organization_id()
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Attendance RLS policies
DROP POLICY IF EXISTS "Users can view attendance in their organization" ON public.attendance;
CREATE POLICY "Users can view attendance in their organization" ON public.attendance
  FOR SELECT USING (attendance_belongs_to_organization(id));

DROP POLICY IF EXISTS "Admins, managers, and employees can create attendance" ON public.attendance;
CREATE POLICY "Admins, managers, and employees can create attendance" ON public.attendance
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = employee_id AND e.organization_id = current_organization_id()
    )
  );

DROP POLICY IF EXISTS "Admins, managers, and employees can update attendance" ON public.attendance;
CREATE POLICY "Admins, managers, and employees can update attendance" ON public.attendance
  FOR UPDATE USING (attendance_belongs_to_organization(id));

DROP POLICY IF EXISTS "Admins and managers can delete attendance" ON public.attendance;
CREATE POLICY "Admins and managers can delete attendance" ON public.attendance
  FOR DELETE USING (
    attendance_belongs_to_organization(id) AND
    (current_user_role() = 'super_admin' OR current_user_role() = 'admin' OR current_user_role() = 'manager')
  );

-- Attendance triggers
DROP TRIGGER IF EXISTS set_attendance_updated_at ON public.attendance;
CREATE TRIGGER set_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- LEAVE REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    leave_type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Leave Requests indexes
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON public.leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);

-- Enable RLS
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION public.leave_request_belongs_to_organization(leave_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.leave_requests lr
    JOIN public.employees e ON lr.employee_id = e.id
    WHERE lr.id = leave_id AND e.organization_id = current_organization_id()
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Leave Requests RLS policies
DROP POLICY IF EXISTS "Users can view leave requests in their organization" ON public.leave_requests;
CREATE POLICY "Users can view leave requests in their organization" ON public.leave_requests
  FOR SELECT USING (leave_request_belongs_to_organization(id));

DROP POLICY IF EXISTS "Employees can create their own leave requests" ON public.leave_requests;
CREATE POLICY "Employees can create their own leave requests" ON public.leave_requests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = employee_id AND e.organization_id = current_organization_id() AND e.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins and managers can update leave requests" ON public.leave_requests;
CREATE POLICY "Admins and managers can update leave requests" ON public.leave_requests
  FOR UPDATE USING (
    leave_request_belongs_to_organization(id) AND
    (current_user_role() = 'super_admin' OR current_user_role() = 'admin' OR current_user_role() = 'manager')
  );

DROP POLICY IF EXISTS "Admins and managers can delete leave requests" ON public.leave_requests;
CREATE POLICY "Admins and managers can delete leave requests" ON public.leave_requests
  FOR DELETE USING (
    leave_request_belongs_to_organization(id) AND
    (current_user_role() = 'super_admin' OR current_user_role() = 'admin' OR current_user_role() = 'manager')
  );

-- Leave Requests triggers
DROP TRIGGER IF EXISTS set_leave_requests_updated_at ON public.leave_requests;
CREATE TRIGGER set_leave_requests_updated_at
  BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- INVOICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    due_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_organization_id ON public.invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Invoices RLS policies
DROP POLICY IF EXISTS "Users can view invoices in their organization" ON public.invoices;
CREATE POLICY "Users can view invoices in their organization" ON public.invoices
  FOR SELECT USING (organization_id = current_organization_id());

DROP POLICY IF EXISTS "Admins, managers, and employees can create invoices" ON public.invoices;
CREATE POLICY "Admins, managers, and employees can create invoices" ON public.invoices
  FOR INSERT WITH CHECK (organization_id = current_organization_id());

DROP POLICY IF EXISTS "Admins, managers, and employees can update invoices" ON public.invoices;
CREATE POLICY "Admins, managers, and employees can update invoices" ON public.invoices
  FOR UPDATE USING (organization_id = current_organization_id());

DROP POLICY IF EXISTS "Admins and managers can delete invoices" ON public.invoices;
CREATE POLICY "Admins and managers can delete invoices" ON public.invoices
  FOR DELETE USING (organization_id = current_organization_id() AND (current_user_role() = 'super_admin' OR current_user_role() = 'admin' OR current_user_role() = 'manager'));

-- Invoices triggers
DROP TRIGGER IF EXISTS set_invoices_updated_at ON public.invoices;
CREATE TRIGGER set_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL,
    payment_method TEXT,
    payment_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION public.payment_belongs_to_organization(payment_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.payments p
    JOIN public.invoices i ON p.invoice_id = i.id
    WHERE p.id = payment_id AND i.organization_id = current_organization_id()
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Payments RLS policies
DROP POLICY IF EXISTS "Users can view payments in their organization" ON public.payments;
CREATE POLICY "Users can view payments in their organization" ON public.payments
  FOR SELECT USING (payment_belongs_to_organization(id));

DROP POLICY IF EXISTS "Admins, managers, and employees can create payments" ON public.payments;
CREATE POLICY "Admins, managers, and employees can create payments" ON public.payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_id AND i.organization_id = current_organization_id()
    )
  );

DROP POLICY IF EXISTS "Admins, managers, and employees can update payments" ON public.payments;
CREATE POLICY "Admins, managers, and employees can update payments" ON public.payments
  FOR UPDATE USING (payment_belongs_to_organization(id));

DROP POLICY IF EXISTS "Admins and managers can delete payments" ON public.payments;
CREATE POLICY "Admins and managers can delete payments" ON public.payments
  FOR DELETE USING (
    payment_belongs_to_organization(id) AND
    (current_user_role() = 'super_admin' OR current_user_role() = 'admin' OR current_user_role() = 'manager')
  );

-- Payments triggers
DROP TRIGGER IF EXISTS set_payments_updated_at ON public.payments;
CREATE TRIGGER set_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- DOCUMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_organization_id ON public.documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents(uploaded_by);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Documents RLS policies
DROP POLICY IF EXISTS "Users can view documents in their organization" ON public.documents;
CREATE POLICY "Users can view documents in their organization" ON public.documents
  FOR SELECT USING (organization_id = current_organization_id());

DROP POLICY IF EXISTS "Users can create documents" ON public.documents;
CREATE POLICY "Users can create documents" ON public.documents
  FOR INSERT WITH CHECK (organization_id = current_organization_id());

DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
CREATE POLICY "Users can update their own documents" ON public.documents
  FOR UPDATE USING (organization_id = current_organization_id() AND uploaded_by = auth.uid());

DROP POLICY IF EXISTS "Admins and managers can delete documents" ON public.documents;
CREATE POLICY "Admins and managers can delete documents" ON public.documents
  FOR DELETE USING (organization_id = current_organization_id() AND (current_user_role() = 'super_admin' OR current_user_role() = 'admin' OR current_user_role() = 'manager'));

-- Documents triggers
DROP TRIGGER IF EXISTS set_documents_updated_at ON public.documents;
CREATE TRIGGER set_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notifications RLS policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE USING (user_id = auth.uid());

-- Notifications triggers
DROP TRIGGER IF EXISTS set_notifications_updated_at ON public.notifications;
CREATE TRIGGER set_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- ACTIVITY LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Activity Logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_organization_id ON public.activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Activity Logs RLS policies
DROP POLICY IF EXISTS "Users can view activity logs in their organization" ON public.activity_logs;
CREATE POLICY "Users can view activity logs in their organization" ON public.activity_logs
  FOR SELECT USING (organization_id = current_organization_id());

DROP POLICY IF EXISTS "Users can create activity logs" ON public.activity_logs;
CREATE POLICY "Users can create activity logs" ON public.activity_logs
  FOR INSERT WITH CHECK (organization_id = current_organization_id());

-- Activity Logs are immutable once created

-- ============================================
-- DASHBOARD HELPER VIEWS
-- ============================================
CREATE OR REPLACE VIEW public.dashboard_stats AS
WITH org_id AS (SELECT current_organization_id() as id)
SELECT
  (SELECT COUNT(*) FROM public.projects p JOIN org_id o ON p.organization_id = o.id WHERE p.status = 'in_progress') AS active_projects,
  (SELECT COUNT(*) FROM public.tasks t JOIN public.projects p ON t.project_id = p.id JOIN org_id o ON p.organization_id = o.id WHERE t.status NOT IN ('done', 'cancelled')) AS pending_tasks,
  (SELECT COUNT(*) FROM public.employees e JOIN org_id o ON e.organization_id = o.id) AS employee_count,
  (SELECT COALESCE(SUM(amount), 0) FROM public.invoices i JOIN org_id o ON i.organization_id = o.id WHERE i.status = 'paid') AS total_revenue;

-- ============================================
-- REALTIME ENABLEMENT (safe)
-- ============================================
DO $$ BEGIN
  IF NOT is_table_in_publication('supabase_realtime', 'public', 'tasks') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT is_table_in_publication('supabase_realtime', 'public', 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT is_table_in_publication('supabase_realtime', 'public', 'projects') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT is_table_in_publication('supabase_realtime', 'public', 'activity_logs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
  END IF;
END $$;
