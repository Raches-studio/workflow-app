-- ==========================================================
-- WorkerHub: Phase 2 Migration (Flexible Pricing & Invoicing)
-- Run this in your Supabase SQL Editor:
-- Supabase Dashboard -> SQL Editor -> New Query -> Paste & Run
-- ==========================================================

-- 1. Extend Projects Table with Flexible Pricing Columns
ALTER TABLE public.projects 
    ADD COLUMN IF NOT EXISTS contract_total NUMERIC,
    ADD COLUMN IF NOT EXISTS milestones JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS retainer_monthly_fee NUMERIC,
    ADD COLUMN IF NOT EXISTS retainer_hours_cap NUMERIC,
    ADD COLUMN IF NOT EXISTS retainer_overtime_rate NUMERIC;

-- 2. Create Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT auth.uid()::text,
    client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL DEFAULT '',
    client_email TEXT,
    client_company TEXT,
    invoice_number TEXT NOT NULL,
    issue_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    subtotal NUMERIC NOT NULL DEFAULT 0,
    tax_rate NUMERIC DEFAULT 0,
    tax_amount NUMERIC DEFAULT 0,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    payment_terms_days INTEGER DEFAULT 14,
    notes TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes for Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON public.invoices(issue_date);

-- 4. Trigger for Updated_at on Invoices
DROP TRIGGER IF EXISTS set_invoices_updated_at ON public.invoices;
CREATE TRIGGER set_invoices_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. Enable Row Level Security (RLS) on Invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own invoices" ON public.invoices;
CREATE POLICY "Users can manage their own invoices"
    ON public.invoices FOR ALL
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);
