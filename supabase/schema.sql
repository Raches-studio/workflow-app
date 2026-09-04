-- ==========================================================
-- WorkerHub: Supabase Database Schema
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New query)
-- ==========================================================

-- 1. Clients Table
CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT 'user-default',
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    currency TEXT DEFAULT 'USD',
    hourly_rate NUMERIC,
    payment_terms_days INTEGER DEFAULT 14,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT 'user-default',
    client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    billing_type TEXT DEFAULT 'hourly',
    rate NUMERIC DEFAULT 0,
    budget_hours NUMERIC,
    budget_amount NUMERIC,
    deadline TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT 'user-default',
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'medium',
    estimated_hours NUMERIC,
    due_date TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Time Logs Table
CREATE TABLE IF NOT EXISTS public.time_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT 'user-default',
    client_id TEXT,
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    task_id TEXT REFERENCES public.tasks(id) ON DELETE SET NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_seconds INTEGER NOT NULL,
    is_billable BOOLEAN DEFAULT TRUE,
    hourly_rate NUMERIC DEFAULT 0,
    is_invoiced BOOLEAN DEFAULT FALSE,
    invoice_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_project_id ON public.time_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_client_id ON public.time_logs(client_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach updated_at triggers
DROP TRIGGER IF EXISTS set_clients_updated_at ON public.clients;
CREATE TRIGGER set_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_projects_updated_at ON public.projects;
CREATE TRIGGER set_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_tasks_updated_at ON public.tasks;
CREATE TRIGGER set_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_time_logs_updated_at ON public.time_logs;
CREATE TRIGGER set_time_logs_updated_at
    BEFORE UPDATE ON public.time_logs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;

-- Development policies (allow all authenticated & anon queries with valid API key)
DROP POLICY IF EXISTS "Public access to clients" ON public.clients;
CREATE POLICY "Public access to clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to projects" ON public.projects;
CREATE POLICY "Public access to projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to tasks" ON public.tasks;
CREATE POLICY "Public access to tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to time_logs" ON public.time_logs;
CREATE POLICY "Public access to time_logs" ON public.time_logs FOR ALL USING (true) WITH CHECK (true);
