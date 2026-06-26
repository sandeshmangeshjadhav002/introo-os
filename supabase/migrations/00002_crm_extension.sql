-- ============================================
-- CRM EXTENSION SCHEMA
-- ============================================

-- Enable necessary extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TAGS TABLE (for all CRM entities)
-- ============================================
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3b82f6',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, name)
);

CREATE INDEX IF NOT EXISTS idx_tags_organization_id ON public.tags(organization_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON public.tags(name);

-- Enable RLS
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tags in their organization" ON public.tags
    FOR SELECT USING (organization_id = current_organization_id());

CREATE POLICY "Users can create tags" ON public.tags
    FOR INSERT WITH CHECK (organization_id = current_organization_id());

CREATE POLICY "Users can update tags" ON public.tags
    FOR UPDATE USING (organization_id = current_organization_id());

CREATE POLICY "Admins and managers can delete tags" ON public.tags
    FOR DELETE USING (organization_id = current_organization_id() AND (current_user_role() = 'super_admin' OR current_user_role() = 'admin' OR current_user_role() = 'manager'));

-- Triggers
CREATE TRIGGER set_tags_updated_at
    BEFORE UPDATE ON public.tags
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- CONTACTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    mobile TEXT,
    job_title TEXT,
    department TEXT,
    website TEXT,
    linkedin TEXT,
    twitter TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    postal_code TEXT,
    notes TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'lead')),
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Contacts indexes
CREATE INDEX IF NOT EXISTS idx_contacts_organization_id ON public.contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON public.contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON public.contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_assigned_to ON public.contacts(assigned_to);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);

-- Enable RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Contacts RLS policies
CREATE POLICY "Users can view contacts in their organization" ON public.contacts
    FOR SELECT USING (organization_id = current_organization_id());

CREATE POLICY "Users can create contacts" ON public.contacts
    FOR INSERT WITH CHECK (organization_id = current_organization_id());

CREATE POLICY "Users can update contacts" ON public.contacts
    FOR UPDATE USING (organization_id = current_organization_id());

CREATE POLICY "Admins and managers can delete contacts" ON public.contacts
    FOR DELETE USING (organization_id = current_organization_id() AND (current_user_role() = 'super_admin' OR current_user_role() = 'admin' OR current_user_role() = 'manager'));

-- Contacts triggers
CREATE TRIGGER set_contacts_updated_at
    BEFORE UPDATE ON public.contacts
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- DEAL STAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.deal_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    position INTEGER NOT NULL,
    color TEXT DEFAULT '#3b82f6',
    probability INTEGER DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
    is_closed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Deal stages indexes
CREATE INDEX IF NOT EXISTS idx_deal_stages_organization_id ON public.deal_stages(organization_id);
CREATE INDEX IF NOT EXISTS idx_deal_stages_position ON public.deal_stages(position);

-- Enable RLS
ALTER TABLE public.deal_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view deal stages in their organization" ON public.deal_stages
    FOR SELECT USING (organization_id = current_organization_id());

CREATE POLICY "Admins and managers can create deal stages" ON public.deal_stages
    FOR INSERT WITH CHECK (organization_id = current_organization_id() AND (current_user_role() = 'super_admin' OR current_user_role() = 'admin' OR current_user_role() = 'manager'));

CREATE POLICY "Admins and managers can update deal stages" ON public.deal_stages
    FOR UPDATE USING (organization_id = current_organization_id() AND (current_user_role() = 'super_admin' OR current_user_role() = 'admin' OR current_user_role() = 'manager'));

CREATE POLICY "Admins can delete deal stages" ON public.deal_stages
    FOR DELETE USING (organization_id = current_organization_id() AND (current_user_role() = 'super_admin' OR current_user_role() = 'admin'));

-- Deal stages triggers
CREATE TRIGGER set_deal_stages_updated_at
    BEFORE UPDATE ON public.deal_stages
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- DEALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    amount NUMERIC,
    currency TEXT DEFAULT 'USD',
    stage_id UUID REFERENCES public.deal_stages(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    company_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    close_date DATE,
    probability INTEGER CHECK (probability >= 0 AND probability <= 100),
    description TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost')),
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Deals indexes
CREATE INDEX IF NOT EXISTS idx_deals_organization_id ON public.deals(organization_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage_id ON public.deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_deals_company_id ON public.deals(company_id);
CREATE INDEX IF NOT EXISTS idx_deals_contact_id ON public.deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_deals_assigned_to ON public.deals(assigned_to);
CREATE INDEX IF NOT EXISTS idx_deals_status ON public.deals(status);

-- Enable RLS
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view deals in their organization" ON public.deals
    FOR SELECT USING (organization_id = current_organization_id());

CREATE POLICY "Users can create deals" ON public.deals
    FOR INSERT WITH CHECK (organization_id = current_organization_id());

CREATE POLICY "Users can update deals" ON public.deals
    FOR UPDATE USING (organization_id = current_organization_id());

CREATE POLICY "Admins and managers can delete deals" ON public.deals
    FOR DELETE USING (organization_id = current_organization_id() AND (current_user_role() = 'super_admin' OR current_user_role() = 'admin' OR current_user_role() = 'manager'));

-- Deals triggers
CREATE TRIGGER set_deals_updated_at
    BEFORE UPDATE ON public.deals
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- ACTIVITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('note', 'call', 'meeting', 'email', 'task', 'event')),
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Activities indexes
CREATE INDEX IF NOT EXISTS idx_activities_organization_id ON public.activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_deal_id ON public.activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_activities_contact_id ON public.activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_activities_company_id ON public.activities(company_id);
CREATE INDEX IF NOT EXISTS idx_activities_assigned_to ON public.activities(assigned_to);
CREATE INDEX IF NOT EXISTS idx_activities_due_date ON public.activities(due_date);

-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activities in their organization" ON public.activities
    FOR SELECT USING (organization_id = current_organization_id());

CREATE POLICY "Users can create activities" ON public.activities
    FOR INSERT WITH CHECK (organization_id = current_organization_id());

CREATE POLICY "Users can update activities" ON public.activities
    FOR UPDATE USING (organization_id = current_organization_id());

CREATE POLICY "Users can delete their own activities, admins can delete any" ON public.activities
    FOR DELETE USING (
        organization_id = current_organization_id() AND 
        (created_by = auth.uid() OR current_user_role() = 'super_admin' OR current_user_role() = 'admin')
    );

-- Activities triggers
CREATE TRIGGER set_activities_updated_at
    BEFORE UPDATE ON public.activities
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- CONTACT TAGS JUNCTION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.contact_tags (
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (contact_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_contact_tags_contact_id ON public.contact_tags(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_tags_tag_id ON public.contact_tags(tag_id);

-- ============================================
-- DEAL TAGS JUNCTION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.deal_tags (
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (deal_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_deal_tags_deal_id ON public.deal_tags(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_tags_tag_id ON public.deal_tags(tag_id);

-- ============================================
-- INSERT DEFAULT DEAL STAGES FOR ORGANIZATIONS
-- ============================================
-- This function creates default deal stages when a new organization is created
CREATE OR REPLACE FUNCTION public.create_default_deal_stages()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.deal_stages (organization_id, name, position, color, probability, is_closed)
    VALUES
        (NEW.id, 'Prospecting', 1, '#6366f1', 10, FALSE),
        (NEW.id, 'Qualification', 2, '#0ea5e9', 25, FALSE),
        (NEW.id, 'Proposal', 3, '#f59e0b', 50, FALSE),
        (NEW.id, 'Negotiation', 4, '#f97316', 75, FALSE),
        (NEW.id, 'Closed Won', 5, '#10b981', 100, TRUE),
        (NEW.id, 'Closed Lost', 6, '#ef4444', 0, TRUE);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new organizations
DROP TRIGGER IF EXISTS on_organization_create_default_stages ON public.organizations;
CREATE TRIGGER on_organization_create_default_stages
    AFTER INSERT ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.create_default_deal_stages();
