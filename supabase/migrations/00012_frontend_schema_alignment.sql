-- 00012_frontend_schema_alignment.sql

-- ============================================
-- 1. LEADS TABLE ALIGNMENT
-- ============================================
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS lead_source TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost'));

-- Migrate existing legacy data so nothing is lost
UPDATE public.leads SET lead_source = source WHERE lead_source IS NULL AND source IS NOT NULL;
UPDATE public.leads SET status = stage WHERE status IS NULL AND stage IS NOT NULL;

-- ============================================
-- 2. CONTACTS TABLE ALIGNMENT
-- ============================================
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS birthday DATE,
  ADD COLUMN IF NOT EXISTS lead_source TEXT;

-- ============================================
-- 3. COMPANIES TABLE ALIGNMENT
-- ============================================
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS employees INTEGER,
  ADD COLUMN IF NOT EXISTS revenue NUMERIC,
  ADD COLUMN IF NOT EXISTS gst_number TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS zip TEXT,
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================
-- 4. DEALS TABLE ALIGNMENT
-- ============================================
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS probability INTEGER CHECK (probability >= 0 AND probability <= 100),
  ADD COLUMN IF NOT EXISTS close_date DATE,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS lost_reason TEXT,
  ADD COLUMN IF NOT EXISTS won_reason TEXT;
