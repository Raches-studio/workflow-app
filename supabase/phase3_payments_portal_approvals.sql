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

DROP POLICY IF EXISTS "Public client portal can read payment settings" ON public.payment_settings;
DROP POLICY IF EXISTS "Users can manage their own payment settings" ON public.payment_settings;
CREATE POLICY "Users can manage their own payment settings"
    ON public.payment_settings FOR ALL
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- 5. Public Read-Only Access for Client Portals (Secure RPC Function)
-- Public access is strictly controlled via a SECURITY DEFINER function.
-- Table-level policies are NOT made publicly accessible to prevent broad data enumeration.

-- Clean up any prior broad portal policies
DROP POLICY IF EXISTS "Public client portal can read client by token" ON public.clients;
DROP POLICY IF EXISTS "Public client portal can read client projects" ON public.projects;
DROP POLICY IF EXISTS "Public client portal can read client invoices" ON public.invoices;
DROP POLICY IF EXISTS "Public client portal can read approved time logs" ON public.time_logs;

CREATE OR REPLACE FUNCTION public.get_client_portal_data(p_portal_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_client RECORD;
    v_projects JSONB;
    v_time_logs JSONB;
    v_invoices JSONB;
    v_payment_settings JSONB;
BEGIN
    -- Guard against empty or null tokens
    IF p_portal_token IS NULL OR TRIM(p_portal_token) = '' THEN
        RETURN NULL;
    END IF;

    -- Lookup client strictly by exact portal token
    SELECT * INTO v_client
    FROM public.clients
    WHERE portal_token = TRIM(p_portal_token)
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- Fetch projects belonging to this client
    SELECT COALESCE(jsonb_agg(to_jsonb(p)), '[]'::jsonb) INTO v_projects
    FROM public.projects p
    WHERE p.client_id = v_client.id;

    -- Fetch approved time logs for this client
    SELECT COALESCE(jsonb_agg(to_jsonb(tl)), '[]'::jsonb) INTO v_time_logs
    FROM public.time_logs tl
    WHERE tl.client_id = v_client.id AND tl.approval_status = 'approved';

    -- Fetch invoices belonging to this client
    SELECT COALESCE(jsonb_agg(to_jsonb(inv)), '[]'::jsonb) INTO v_invoices
    FROM public.invoices inv
    WHERE inv.client_id = v_client.id;

    -- Fetch payment settings belonging to the organization/owner,
    -- REDACTING the administrative secret key (paystack_secret_key)
    SELECT to_jsonb(ps) - 'paystack_secret_key' INTO v_payment_settings
    FROM public.payment_settings ps
    WHERE ps.user_id = v_client.user_id
    LIMIT 1;

    RETURN jsonb_build_object(
        'client', to_jsonb(v_client),
        'projects', v_projects,
        'time_logs', v_time_logs,
        'invoices', v_invoices,
        'payment_settings', v_payment_settings
    );
END;
$$;

-- Grant execution permission to public/anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.get_client_portal_data(TEXT) TO anon, authenticated;
