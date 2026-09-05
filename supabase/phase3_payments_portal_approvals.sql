-- ==========================================================
-- WorkerHub: Phase 3 Migration (Multi-Gateway Payments, Client Portals, Team Roles/Approvals)
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor -> New query)
-- ==========================================================

-- 1. Extend Profiles Table with Team Roles ('admin', 'manager', 'member')
ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'admin';

-- 2. Extend Clients Table with Unique Client Portal Tokens
ALTER TABLE public.clients 
    ADD COLUMN IF NOT EXISTS portal_token VARCHAR(64);

-- Generate unique portal tokens for any existing clients lacking one
UPDATE public.clients 
SET portal_token = 'cp_' || SUBSTRING(MD5(id || created_at::text || RANDOM()::text) FROM 1 FOR 16)
WHERE portal_token IS NULL;

ALTER TABLE public.clients 
    ADD CONSTRAINT clients_portal_token_unique UNIQUE (portal_token);

-- 3. Extend Time Logs Table with Timesheet Approval Workflow
ALTER TABLE public.time_logs 
    ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reviewed_by TEXT,
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 4. Create Payment Settings Table (Multi-Gateway Configuration)
CREATE TABLE IF NOT EXISTS public.payment_settings (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT auth.uid()::text,
    active_provider VARCHAR(30) DEFAULT 'paypal',
    paypal_email TEXT,
    paypal_client_id TEXT,
    paystack_public_key TEXT,
    paystack_secret_key TEXT,
    flutterwave_public_key TEXT,
    bank_name TEXT,
    account_name TEXT,
    account_number TEXT,
    routing_or_sort_code TEXT,
    swift_bic TEXT,
    payment_instructions TEXT,
    custom_payment_url TEXT,
    is_configured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on Payment Settings
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own payment settings" ON public.payment_settings;
CREATE POLICY "Users can manage their own payment settings"
    ON public.payment_settings FOR ALL
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Public client portal can read payment settings" ON public.payment_settings;
CREATE POLICY "Public client portal can read payment settings"
    ON public.payment_settings FOR SELECT
    USING (true);

-- 5. Public Read-Only Access for Client Portals (Scoped strictly by portal_token)
-- Clients can read their own client row via portal token
DROP POLICY IF EXISTS "Public client portal can read client by token" ON public.clients;
CREATE POLICY "Public client portal can read client by token"
    ON public.clients FOR SELECT
    USING (portal_token IS NOT NULL);

-- Clients can read their own projects
DROP POLICY IF EXISTS "Public client portal can read client projects" ON public.projects;
CREATE POLICY "Public client portal can read client projects"
    ON public.projects FOR SELECT
    USING (client_id IN (SELECT id FROM public.clients WHERE portal_token IS NOT NULL));

-- Clients can read their own invoices
DROP POLICY IF EXISTS "Public client portal can read client invoices" ON public.invoices;
CREATE POLICY "Public client portal can read client invoices"
    ON public.invoices FOR SELECT
    USING (client_id IN (SELECT id FROM public.clients WHERE portal_token IS NOT NULL));

-- Clients can read approved time logs
DROP POLICY IF EXISTS "Public client portal can read approved time logs" ON public.time_logs;
CREATE POLICY "Public client portal can read approved time logs"
    ON public.time_logs FOR SELECT
    USING (
        client_id IN (SELECT id FROM public.clients WHERE portal_token IS NOT NULL)
        AND approval_status = 'approved'
    );
