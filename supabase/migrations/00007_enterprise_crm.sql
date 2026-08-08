-- ============================================
-- ENTERPRISE CRM SCHEMA EXTENSION
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- SOFT DELETE FUNCTIONS
-- ============================================
CREATE OR REPLACE FUNCTION handle_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    NEW.deleted_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMPANIES TABLE (rename clients to companies)
-- ============================================
-- Add soft delete, updated_by, and missing fields to clients first
ALTER TABLE public.clients 
    ADD COLUMN IF NOT EXISTS industry TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS employees INTEGER,
    ADD COLUMN IF NOT EXISTS revenue NUMERIC,
    ADD COLUMN IF NOT EXISTS gst_number TEXT,
    ADD COLUMN IF NOT EXISTS state TEXT,
    ADD COLUMN IF NOT EXISTS zip TEXT,
    ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

-- Rename clients to companies (idempotent check with check)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
        ALTER TABLE public.clients RENAME TO companies;
        ALTER INDEX IF EXISTS idx_clients_organization_id RENAME TO idx_companies_organization_id;
        ALTER INDEX IF EXISTS idx_clients_status RENAME TO idx_companies_status;
        ALTER INDEX IF EXISTS idx_clients_assigned_to RENAME TO idx_companies_assigned_to;
        -- Rename company_name to name
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'company_name') THEN
            ALTER TABLE public.companies RENAME COLUMN company_name TO name;
        END IF;
    END IF;
END $$;

-- If companies already exists, make sure name column exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'name') THEN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'company_name') THEN
                ALTER TABLE public.companies RENAME COLUMN company_name TO name;
            END IF;
        END IF;
    END IF;
END $$;

-- Update foreign keys to point to companies instead of clients
ALTER TABLE public.contacts 
    DROP CONSTRAINT IF EXISTS contacts_company_id_fkey,
    ADD CONSTRAINT contacts_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;

ALTER TABLE public.deals 
    DROP CONSTRAINT IF EXISTS deals_company_id_fkey,
    ADD CONSTRAINT deals_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;

ALTER TABLE public.activities 
    DROP CONSTRAINT IF EXISTS activities_company_id_fkey,
    ADD CONSTRAINT activities_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;

-- Add indexes to companies
CREATE INDEX IF NOT EXISTS idx_companies_deleted_at ON public.companies(deleted_at);
CREATE INDEX IF NOT EXISTS idx_companies_is_archived ON public.companies(is_archived);

-- Update companies RLS policies
DROP POLICY IF EXISTS "Users can view tags in their organization" ON public.tags;
DROP POLICY IF EXISTS "Users can create tags" ON public.tags;
DROP POLICY IF EXISTS "Users can update tags" ON public.tags;
DROP POLICY IF EXISTS "Admins and managers can delete tags" ON public.tags;
DROP POLICY IF EXISTS "Users can view companies in their organization" ON public.companies;
DROP POLICY IF EXISTS "Users can create companies" ON public.companies;
DROP POLICY IF EXISTS "Users can update companies" ON public.companies;
DROP POLICY IF EXISTS "Admins and managers can delete companies" ON public.companies;

CREATE POLICY "Users can view companies in their organization" ON public.companies
    FOR SELECT USING (organization_id = current_organization_id() AND deleted_at IS NULL);

CREATE POLICY "Users can create companies" ON public.companies
    FOR INSERT WITH CHECK (organization_id = current_organization_id());

CREATE POLICY "Users can update companies" ON public.companies
    FOR UPDATE USING (organization_id = current_organization_id());

CREATE POLICY "Admins and managers can delete companies" ON public.companies
    FOR DELETE USING (organization_id = current_organization_id() AND (current_user_role() = 'super_admin' OR current_user_role() = 'admin' OR current_user_role() = 'manager'));

-- Add soft delete trigger to companies
DROP TRIGGER IF EXISTS set_companies_updated_at ON public.companies;
CREATE TRIGGER set_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- CONTACTS TABLE - Add missing fields and soft delete
-- ============================================
ALTER TABLE public.contacts 
    ADD COLUMN IF NOT EXISTS whatsapp TEXT,
    ADD COLUMN IF NOT EXISTS birthday DATE,
    ADD COLUMN IF NOT EXISTS lead_source TEXT,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_deleted_at ON public.contacts(deleted_at);
CREATE INDEX IF NOT EXISTS idx_contacts_is_archived ON public.contacts(is_archived);

-- Update contacts RLS for soft delete
DROP POLICY IF EXISTS "Users can view contacts in their organization" ON public.contacts;
CREATE POLICY "Users can view contacts in their organization" ON public.contacts
    FOR SELECT USING (organization_id = current_organization_id() AND deleted_at IS NULL);

-- ============================================
-- LEADS TABLE - Add missing fields and soft delete
-- ============================================
ALTER TABLE public.leads 
    ADD COLUMN IF NOT EXISTS budget NUMERIC,
    ADD COLUMN IF NOT EXISTS interest TEXT,
    ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS campaign TEXT,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_deleted_at ON public.leads(deleted_at);
CREATE INDEX IF NOT EXISTS idx_leads_is_archived ON public.leads(is_archived);
CREATE INDEX IF NOT EXISTS idx_leads_lead_score ON public.leads(lead_score);

-- Update leads RLS for soft delete
DROP POLICY IF EXISTS "Users can view leads in their organization" ON public.leads;
CREATE POLICY "Users can view leads in their organization" ON public.leads
    FOR SELECT USING (organization_id = current_organization_id() AND deleted_at IS NULL);

-- ============================================
-- DEALS TABLE - Add missing fields and soft delete
-- ============================================
ALTER TABLE public.deals 
    ADD COLUMN IF NOT EXISTS lost_reason TEXT,
    ADD COLUMN IF NOT EXISTS won_reason TEXT,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    -- Add stage column as text for backward compatibility
    ADD COLUMN IF NOT EXISTS stage TEXT;

CREATE INDEX IF NOT EXISTS idx_deals_deleted_at ON public.deals(deleted_at);
CREATE INDEX IF NOT EXISTS idx_deals_is_archived ON public.deals(is_archived);

-- Update deals RLS for soft delete
DROP POLICY IF EXISTS "Users can view deals in their organization" ON public.deals;
CREATE POLICY "Users can view deals in their organization" ON public.deals
    FOR SELECT USING (organization_id = current_organization_id() AND deleted_at IS NULL);

-- ============================================
-- ACTIVITIES TABLE - Add missing fields and soft delete
-- ============================================
ALTER TABLE public.activities
    ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS recurrence_rule TEXT,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    ALTER COLUMN type TYPE TEXT,
    DROP CONSTRAINT IF EXISTS activities_type_check;

ALTER TABLE public.activities
    ADD CONSTRAINT activities_type_check CHECK (type IN ('task', 'call', 'meeting', 'email', 'whatsapp', 'sms', 'demo', 'follow-up', 'reminder', 'note'));

CREATE INDEX IF NOT EXISTS idx_activities_deleted_at ON public.activities(deleted_at);
CREATE INDEX IF NOT EXISTS idx_activities_is_archived ON public.activities(is_archived);
CREATE INDEX IF NOT EXISTS idx_activities_priority ON public.activities(priority);

-- Update activities RLS for soft delete
DROP POLICY IF EXISTS "Users can view activities in their organization" ON public.activities;
CREATE POLICY "Users can view activities in their organization" ON public.activities
    FOR SELECT USING (organization_id = current_organization_id() AND deleted_at IS NULL);

-- ============================================
-- PIPELINES TABLE (multiple pipelines)
-- ============================================
CREATE TABLE IF NOT EXISTS public.pipelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    position INTEGER NOT NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    UNIQUE(organization_id, name)
);

CREATE INDEX IF NOT EXISTS idx_pipelines_organization_id ON public.pipelines(organization_id);
CREATE INDEX IF NOT EXISTS idx_pipelines_is_default ON public.pipelines(is_default);
CREATE INDEX IF NOT EXISTS idx_pipelines_deleted_at ON public.pipelines(deleted_at);

ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pipelines in their organization" ON public.pipelines
    FOR SELECT USING (organization_id = current_organization_id() AND deleted_at IS NULL);

CREATE POLICY "Admins and managers can create pipelines" ON public.pipelines
    FOR INSERT WITH CHECK (organization_id = current_organization_id() AND (current_user_role() = 'super_admin' OR current_user_role() = 'admin' OR current_user_role() = 'manager'));

CREATE POLICY "Admins and managers can update pipelines" ON public.pipelines
    FOR UPDATE USING (organization_id = current_organization_id() AND (current_user_role() = 'super_admin' OR current_user_role() = 'admin' OR current_user_role() = 'manager'));

CREATE POLICY "Admins can delete pipelines" ON public.pipelines
    FOR DELETE USING (organization_id = current_organization_id() AND (current_user_role() = 'super_admin' OR current_user_role() = 'admin'));

DROP TRIGGER IF EXISTS set_pipelines_updated_at ON public.pipelines;
CREATE TRIGGER set_pipelines_updated_at
    BEFORE UPDATE ON public.pipelines
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- UPDATE DEAL STAGES TO LINK TO PIPELINES
-- ============================================
ALTER TABLE public.deal_stages 
    ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES public.pipelines(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_deal_stages_pipeline_id ON public.deal_stages(pipeline_id);

-- ============================================
-- DEALS TABLE - ADD PIPELINE ID
-- ============================================
ALTER TABLE public.deals 
    ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES public.pipelines(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_deals_pipeline_id ON public.deals(pipeline_id);

-- ============================================
-- STAGE HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.stage_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
    from_stage_id UUID REFERENCES public.deal_stages(id) ON DELETE SET NULL,
    to_stage_id UUID REFERENCES public.deal_stages(id) ON DELETE SET NULL,
    changed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_stage_history_organization_id ON public.stage_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_stage_history_deal_id ON public.stage_history(deal_id);
CREATE INDEX IF NOT EXISTS idx_stage_history_changed_at ON public.stage_history(changed_at);

ALTER TABLE public.stage_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view stage history in their organization" ON public.stage_history
    FOR SELECT USING (organization_id = current_organization_id());

CREATE POLICY "Users can create stage history" ON public.stage_history
    FOR INSERT WITH CHECK (organization_id = current_organization_id());

-- ============================================
-- NOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notes_organization_id ON public.notes(organization_id);
CREATE INDEX IF NOT EXISTS idx_notes_contact_id ON public.notes(contact_id);
CREATE INDEX IF NOT EXISTS idx_notes_company_id ON public.notes(company_id);
CREATE INDEX IF NOT EXISTS idx_notes_deal_id ON public.notes(deal_id);
CREATE INDEX IF NOT EXISTS idx_notes_lead_id ON public.notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_notes_deleted_at ON public.notes(deleted_at);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notes in their organization" ON public.notes
    FOR SELECT USING (organization_id = current_organization_id() AND deleted_at IS NULL);

CREATE POLICY "Users can create notes" ON public.notes
    FOR INSERT WITH CHECK (organization_id = current_organization_id());

CREATE POLICY "Users can update notes" ON public.notes
    FOR UPDATE USING (organization_id = current_organization_id());

CREATE POLICY "Users can delete their own notes, admins can delete any" ON public.notes
    FOR DELETE USING (
        organization_id = current_organization_id() AND 
        (created_by = auth.uid() OR current_user_role() = 'super_admin' OR current_user_role() = 'admin')
    );

DROP TRIGGER IF EXISTS set_notes_updated_at ON public.notes;
CREATE TRIGGER set_notes_updated_at
    BEFORE UPDATE ON public.notes
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT,
    price NUMERIC,
    currency TEXT DEFAULT 'USD',
    stock INTEGER,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    UNIQUE(organization_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_products_organization_id ON public.products(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON public.products(deleted_at);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view products in their organization" ON public.products
    FOR SELECT USING (organization_id = current_organization_id() AND deleted_at IS NULL);

CREATE POLICY "Users can create products" ON public.products
    FOR INSERT WITH CHECK (organization_id = current_organization_id());

CREATE POLICY "Users can update products" ON public.products
    FOR UPDATE USING (organization_id = current_organization_id());

CREATE POLICY "Admins and managers can delete products" ON public.products
    FOR DELETE USING (organization_id = current_organization_id() AND (current_user_role() = 'super_admin' OR current_user_role() = 'admin' OR current_user_role() = 'manager'));

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- DEAL PRODUCTS JUNCTION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.deal_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC,
    total_price NUMERIC,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(deal_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_deal_products_organization_id ON public.deal_products(organization_id);
CREATE INDEX IF NOT EXISTS idx_deal_products_deal_id ON public.deal_products(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_products_product_id ON public.deal_products(product_id);

ALTER TABLE public.deal_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view deal products in their organization" ON public.deal_products
    FOR SELECT USING (organization_id = current_organization_id());

CREATE POLICY "Users can create deal products" ON public.deal_products
    FOR INSERT WITH CHECK (organization_id = current_organization_id());

CREATE POLICY "Users can update deal products" ON public.deal_products
    FOR UPDATE USING (organization_id = current_organization_id());

CREATE POLICY "Users can delete deal products" ON public.deal_products
    FOR DELETE USING (organization_id = current_organization_id());

-- ============================================
-- COMPANY TAGS JUNCTION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.company_tags (
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (company_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_company_tags_company_id ON public.company_tags(company_id);
CREATE INDEX IF NOT EXISTS idx_company_tags_tag_id ON public.company_tags(tag_id);

-- ============================================
-- LEAD TAGS JUNCTION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.lead_tags (
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (lead_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_lead_tags_lead_id ON public.lead_tags(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tags_tag_id ON public.lead_tags(tag_id);

-- ============================================
-- SAVED VIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.saved_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('contacts', 'companies', 'deals', 'leads', 'activities')),
    name TEXT NOT NULL,
    filters JSONB NOT NULL DEFAULT '{}',
    sort_column TEXT,
    sort_direction TEXT DEFAULT 'asc',
    columns TEXT[] NOT NULL DEFAULT '{}',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_saved_views_organization_id ON public.saved_views(organization_id);
CREATE INDEX IF NOT EXISTS idx_saved_views_user_id ON public.saved_views(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_views_entity_type ON public.saved_views(entity_type);

ALTER TABLE public.saved_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved views and public ones" ON public.saved_views
    FOR SELECT USING (organization_id = current_organization_id() AND (user_id = auth.uid() OR is_public = TRUE));

CREATE POLICY "Users can create saved views" ON public.saved_views
    FOR INSERT WITH CHECK (organization_id = current_organization_id() AND user_id = auth.uid());

CREATE POLICY "Users can update their own saved views" ON public.saved_views
    FOR UPDATE USING (organization_id = current_organization_id() AND user_id = auth.uid());

CREATE POLICY "Users can delete their own saved views" ON public.saved_views
    FOR DELETE USING (organization_id = current_organization_id() AND user_id = auth.uid());

DROP TRIGGER IF EXISTS set_saved_views_updated_at ON public.saved_views;
CREATE TRIGGER set_saved_views_updated_at
    BEFORE UPDATE ON public.saved_views
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON public.audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and managers can view audit logs" ON public.audit_logs
    FOR SELECT USING (organization_id = current_organization_id() AND (current_user_role() = 'super_admin' OR current_user_role() = 'admin' OR current_user_role() = 'manager'));

-- ============================================
-- INSERT DEFAULT PIPELINE AND UPDATE EXISTING DEAL STAGES
-- ============================================
-- Function to create default pipeline for new organizations
CREATE OR REPLACE FUNCTION public.create_default_pipeline()
RETURNS TRIGGER AS $$
DECLARE
    v_pipeline_id UUID;
BEGIN
    -- Create default pipeline
    INSERT INTO public.pipelines (organization_id, name, position, is_default)
    VALUES (NEW.id, 'Sales Pipeline', 1, TRUE)
    ON CONFLICT (organization_id, name) DO NOTHING
    RETURNING id INTO v_pipeline_id;

    -- Create default deal stages linked to pipeline
    INSERT INTO public.deal_stages (organization_id, pipeline_id, name, position, color, probability, is_closed)
    VALUES
        (NEW.id, v_pipeline_id, 'New', 1, '#6366f1', 10, FALSE),
        (NEW.id, v_pipeline_id, 'Qualified', 2, '#0ea5e9', 25, FALSE),
        (NEW.id, v_pipeline_id, 'Proposal', 3, '#f59e0b', 50, FALSE),
        (NEW.id, v_pipeline_id, 'Negotiation', 4, '#f97316', 75, FALSE),
        (NEW.id, v_pipeline_id, 'Won', 5, '#10b981', 100, TRUE),
        (NEW.id, v_pipeline_id, 'Lost', 6, '#ef4444', 0, TRUE)
    ON CONFLICT (organization_id, name) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger and create new one
DROP TRIGGER IF EXISTS on_organization_create_default_stages ON public.organizations;
DROP TRIGGER IF EXISTS on_organization_create_default_pipeline ON public.organizations;
CREATE TRIGGER on_organization_create_default_pipeline
    AFTER INSERT ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.create_default_pipeline();
