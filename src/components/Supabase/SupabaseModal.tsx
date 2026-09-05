// src/components/Supabase/SupabaseModal.tsx
import { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Copy, 
  ExternalLink, 
  UploadCloud, 
  Key, 
  Globe, 
  Layers,
  Code2,
  Trash2
} from 'lucide-react';
import { 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  clearSupabaseConfig, 
  testSupabaseConnection 
} from '../../lib/supabase';
import { useWorkflowStore } from '../../store/useWorkflowStore';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUPABASE_SCHEMA_SQL = `-- WorkerHub: Phase 1 Database Schema (Profiles & Strict Row Level Security)
-- Run this in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & Run

-- 1. Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL DEFAULT '',
    business_name TEXT,
    email TEXT NOT NULL DEFAULT '',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Clients Table
CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT auth.uid()::text,
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

-- 3. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT auth.uid()::text,
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

-- 4. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT auth.uid()::text,
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

-- 5. Time Logs Table
CREATE TABLE IF NOT EXISTS public.time_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT auth.uid()::text,
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
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_user_id ON public.time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_project_id ON public.time_logs(project_id);

-- Updated_at Trigger Function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_clients_updated_at ON public.clients;
CREATE TRIGGER set_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_projects_updated_at ON public.projects;
CREATE TRIGGER set_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_tasks_updated_at ON public.tasks;
CREATE TRIGGER set_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_time_logs_updated_at ON public.time_logs;
CREATE TRIGGER set_time_logs_updated_at BEFORE UPDATE ON public.time_logs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto Profile Trigger on auth.users Sign Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, business_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'business_name', ''),
        COALESCE(NEW.email, '')
    )
    ON CONFLICT (id) DO UPDATE
    SET
        full_name = EXCLUDED.full_name,
        business_name = EXCLUDED.business_name,
        email = EXCLUDED.email,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Core Data Isolation Policies (auth.uid() = user_id)
DROP POLICY IF EXISTS "Public access to clients" ON public.clients;
DROP POLICY IF EXISTS "Users can manage their own clients" ON public.clients;
CREATE POLICY "Users can manage their own clients" ON public.clients FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Public access to projects" ON public.projects;
DROP POLICY IF EXISTS "Users can manage their own projects" ON public.projects;
CREATE POLICY "Users can manage their own projects" ON public.projects FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Public access to tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can manage their own tasks" ON public.tasks;
CREATE POLICY "Users can manage their own tasks" ON public.tasks FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Public access to time_logs" ON public.time_logs;
DROP POLICY IF EXISTS "Users can manage their own time_logs" ON public.time_logs;
CREATE POLICY "Users can manage their own time_logs" ON public.time_logs FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
`;

export function SupabaseModal({ isOpen, onClose }: SupabaseModalProps) {
  const [activeTab, setActiveTab] = useState<'connection' | 'sql'>('connection');
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [testingStatus, setTestingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isPushingData, setIsPushingData] = useState(false);

  const { 
    supabaseStatus, 
    supabaseMessage, 
    isSyncing, 
    initSupabaseSync, 
    syncLocalDataToCloud 
  } = useWorkflowStore();

  useEffect(() => {
    if (isOpen) {
      const config = getSupabaseConfig();
      setUrl(config.url);
      setAnonKey(config.anonKey);
      setFeedbackMessage(supabaseMessage || null);
    }
  }, [isOpen, supabaseMessage]);

  if (!isOpen) return null;

  const handleTestAndSave = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setTestingStatus('error');
      setFeedbackMessage('Please enter both the Supabase Project URL and Anon Public Key.');
      return;
    }

    setTestingStatus('loading');
    setFeedbackMessage('Testing connection to Supabase...');

    // Save to local config first so client uses these
    saveSupabaseConfig(url, anonKey);

    const result = await testSupabaseConnection();

    if (result.success) {
      setTestingStatus('success');
      setFeedbackMessage(result.message);
      // Re-init sync with new credentials
      await initSupabaseSync();
    } else {
      setTestingStatus('error');
      setFeedbackMessage(result.message);
    }
  };

  const handleClear = () => {
    clearSupabaseConfig();
    setUrl('');
    setAnonKey('');
    setTestingStatus('idle');
    setFeedbackMessage('Credentials cleared. App is now using local browser storage.');
    initSupabaseSync();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handlePushData = async () => {
    setIsPushingData(true);
    const res = await syncLocalDataToCloud();
    setIsPushingData(false);
    setFeedbackMessage(res.message);
    if (res.success) {
      setTestingStatus('success');
    } else {
      setTestingStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Supabase Cloud Database
                {supabaseStatus === 'connected' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Connected
                  </span>
                ) : supabaseStatus === 'checking' || isSyncing ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Syncing
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                    Local Storage Mode
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sync clients, projects, tasks, and billable time logs to your Supabase project.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 pt-2 bg-slate-50/25 dark:bg-slate-950/25">
          <button
            onClick={() => setActiveTab('connection')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
              activeTab === 'connection'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            Connection Settings
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
              activeTab === 'sql'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            SQL Setup Script
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-sm">
          
          {activeTab === 'connection' && (
            <>
              {/* Status or Alert banner */}
              {feedbackMessage && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                    testingStatus === 'success' || supabaseStatus === 'connected'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : testingStatus === 'error' || supabaseStatus === 'error'
                      ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      : 'bg-sky-50 dark:bg-sky-950/30 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                  }`}
                >
                  {testingStatus === 'success' || supabaseStatus === 'connected' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : testingStatus === 'error' || supabaseStatus === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  ) : (
                    <RefreshCw className="w-4 h-4 text-sky-500 shrink-0 mt-0.5 animate-spin" />
                  )}
                  <div className="flex-1 leading-relaxed">{feedbackMessage}</div>
                </div>
              )}

              {/* Form inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      Supabase Project URL
                    </span>
                    <a
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                    >
                      Supabase Dashboard <ExternalLink className="w-3 h-3" />
                    </a>
                  </label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://your-project-id.supabase.co"
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white font-mono"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Found in Supabase: Project Settings → API → Project URL
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-slate-400" />
                    Supabase Anon Public API Key
                  </label>
                  <input
                    type="password"
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white font-mono"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Found in Supabase: Project Settings → API → Project API Keys (anon / public)
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  onClick={handleTestAndSave}
                  disabled={testingStatus === 'loading'}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition active:scale-95 disabled:opacity-50"
                >
                  {testingStatus === 'loading' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Test & Save Connection</span>
                </button>

                {supabaseStatus === 'connected' && (
                  <button
                    onClick={handlePushData}
                    disabled={isPushingData}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition active:scale-95 disabled:opacity-50"
                    title="Push your existing clients, projects, and logs into your new Supabase database"
                  >
                    {isPushingData ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UploadCloud className="w-3.5 h-3.5" />
                    )}
                    <span>Push Local Data to Supabase</span>
                  </button>
                )}

                {(url || anonKey) && (
                  <button
                    onClick={handleClear}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Disconnect</span>
                  </button>
                )}
              </div>

              {/* Quick Setup Checklist */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-500" />
                  Quick Supabase Setup Guide:
                </div>
                <ol className="list-decimal list-inside text-xs text-slate-600 dark:text-slate-400 space-y-1 pl-1">
                  <li>Create a free project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline">supabase.com</a>.</li>
                  <li>Click on the <strong>SQL Setup Script</strong> tab above and copy the SQL code.</li>
                  <li>In your Supabase dashboard, go to <strong>SQL Editor</strong>, paste the script, and click <strong>Run</strong>.</li>
                  <li>Copy your <strong>Project URL</strong> and <strong>Anon Key</strong> into the fields above and click <strong>Test & Save Connection</strong>!</li>
                </ol>
              </div>
            </>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Database Migration Script</h4>
                  <p className="text-[11px] text-slate-500">
                    Creates tables for <code className="text-sky-600">clients</code>, <code className="text-sky-600">projects</code>, <code className="text-sky-600">tasks</code>, and <code className="text-sky-600">time_logs</code> with RLS policies and timestamp triggers.
                  </p>
                </div>

                <button
                  onClick={handleCopySql}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    copiedSql
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {copiedSql ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy SQL</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 p-4 font-mono text-xs max-h-80 overflow-y-auto">
                <pre className="whitespace-pre text-[11px] leading-relaxed select-all">
                  {SUPABASE_SCHEMA_SQL}
                </pre>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
