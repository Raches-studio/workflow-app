// src/App.tsx
import { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  Briefcase, 
  Receipt, 
  CheckSquare, 
  Flower2, 
  Square, 
  Moon, 
  Sun, 
  Database, 
  Sparkles,
  LayoutDashboard,
  Users,
  LogIn,
  X
} from 'lucide-react';
import { BlackHoleHeroSectionDemo } from '@/components/ui/demo';
import { 
  SidebarNav, 
  SmartWorkplaceDashboard, 
  TeamWorkspaceView 
} from './components/SmartWorkplace';
import { TimeTracker } from './components/TimeTracker/TimeTracker';
import { ClientProjectManager } from './components/Projects/ClientProjectManager';
import { InvoiceManager } from './components/Invoices/InvoiceManager';
import { ApprovalsDashboard } from './components/Approvals/ApprovalsDashboard';
import { ClientPortalView } from './components/Portal/ClientPortalView';
import { SupabaseModal } from './components/Supabase/SupabaseModal';
import { AuthPage } from './components/Auth/AuthPage';
import { UserProfileMenu } from './components/Header/UserProfileMenu';
import { useTimerStore } from './store/useTimerStore';
import { useWorkflowStore } from './store/useWorkflowStore';
import { useAuthStore } from './store/useAuthStore';
import { formatDuration, formatCurrency } from './utils/formatters';
import { AIAssistantDrawer } from './components/AIAssistant/AIAssistantDrawer';
import { CurrentAppContext, UserRole } from './types';

/**
 * Extract client portal token from URL if present:
 * 1. Path: /portal/:token
 * 2. Hash: #/portal/:token or #portal=:token
 * 3. Query: ?portal=:token or ?token=:token
 */
function getPortalTokenFromUrl(): string | null {
  if (typeof window === 'undefined') return null;

  // 1. Pathname
  const path = window.location.pathname;
  const pathMatch = path.match(/\/portal\/([a-zA-Z0-9_-]+)/i);
  if (pathMatch && pathMatch[1]) return pathMatch[1];

  // 2. Hash
  const hash = window.location.hash;
  const hashMatch = hash.match(/#\/?portal(?:\/|=)([a-zA-Z0-9_-]+)/i);
  if (hashMatch && hashMatch[1]) return hashMatch[1];

  // 3. Query params
  const searchParams = new URLSearchParams(window.location.search);
  const portalParam = searchParams.get('portal') || searchParams.get('token');
  if (portalParam) return portalParam;

  return null;
}

export function App() {
  const [activeScreen, setActiveScreen] = useState<'dashboard' | 'team' | 'projects' | 'tracker' | 'invoices' | 'approvals'>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState<boolean>(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);
  const [showHeroPreview, setShowHeroPreview] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [rachesInitialPrompt, setRachesInitialPrompt] = useState<string | undefined>();
  const [portalToken, setPortalToken] = useState<string | null>(() => getPortalTokenFromUrl());

  const { status, projectId, taskId, getElapsedSeconds, stopTimer } = useTimerStore();
  const { 
    projects, 
    tasks, 
    timeLogs,
    getUnbilledSummary, 
    supabaseStatus, 
    isSyncing, 
    initSupabaseSync 
  } = useWorkflowStore();
  const { user, profile, isLoading, initAuth } = useAuthStore();
  const unbilled = getUnbilledSummary();

  const userRole: UserRole = profile?.role || 'admin';
  const isMember = userRole === 'member';
  const canApprove = userRole === 'admin' || userRole === 'manager';

  // Listen to navigation events for portal token
  useEffect(() => {
    const handleLocationChange = () => {
      setPortalToken(getPortalTokenFromUrl());
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Safe fallback if role switched to member while on restricted screens
  useEffect(() => {
    if (isMember && (activeScreen === 'approvals' || activeScreen === 'invoices')) {
      setActiveScreen('dashboard');
    }
  }, [isMember, activeScreen]);

  const [headerTimerSeconds, setHeaderTimerSeconds] = useState(0);

  // 1. Initialize Supabase Auth on app mount
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // 2. Initialize Supabase sync when authenticated
  useEffect(() => {
    if (user) {
      initSupabaseSync();
    }
  }, [user, initSupabaseSync]);

  // Keep top-bar persistent timer in sync
  useEffect(() => {
    setHeaderTimerSeconds(getElapsedSeconds());
    if (status === 'running') {
      const id = setInterval(() => {
        setHeaderTimerSeconds(getElapsedSeconds());
      }, 1000);
      return () => clearInterval(id);
    }
  }, [status, getElapsedSeconds]);

  // Derive dynamic real-time context for Rachel (Raches)
  const activeProject = useMemo(() => {
    return projects.find((p) => p.id === projectId) || projects[0];
  }, [projects, projectId]);

  const activeTask = useMemo(() => {
    return tasks.find((t) => t.id === taskId) || tasks[0];
  }, [tasks, taskId]);

  const appContext: CurrentAppContext = useMemo(() => ({
    currentPage: (activeScreen === 'dashboard' || activeScreen === 'team' ? 'tracker' : activeScreen) as any,
    activeProjectId: activeProject?.id,
    activeProjectName: activeProject?.name,
    activeTaskId: activeTask?.id,
    activeTaskTitle: activeTask?.title,
    activeTaskDescription: activeTask?.description,
    isTimerRunning: status === 'running',
  }), [activeScreen, activeProject, activeTask, status]);

  const pendingApprovalsCount = useMemo(() => {
    return timeLogs.filter((l) => l.approvalStatus === 'submitted').length;
  }, [timeLogs]);

  // Handler for 'Get Unstuck' action buttons on active tasks
  const handleGetUnstuck = (taskTitle: string, taskDesc?: string, projectName?: string) => {
    const projContext = projectName ? ` for project "${projectName}"` : (activeProject ? ` for project "${activeProject.name}"` : '');
    const descContext = taskDesc ? ` (Details: ${taskDesc})` : '';
    const prompt = `I'm stuck on "${taskTitle}"${projContext}${descContext}. Rachel, please troubleshoot this with me and give me a clear 3-step solution to get unblocked right now!`;
    setRachesInitialPrompt(prompt);
    setIsAiDrawerOpen(true);
  };

  // --- CLIENT PORTAL ACCESS (PUBLIC READ-ONLY ACCESS) ---
  if (portalToken) {
    return (
      <ClientPortalView 
        portalToken={portalToken} 
        onExitPortal={() => {
          setPortalToken(null);
          if (window.location.hash.includes('portal')) {
            window.location.hash = '';
          }
          const newUrl = window.location.pathname.replace(/\/portal\/[a-zA-Z0-9_-]+/i, '') || '/';
          window.history.pushState(null, '', newUrl);
        }} 
      />
    );
  }

  // --- ROUTE PROTECTION: LOADING STATE ---
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#121418] text-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 via-orange-600 to-amber-500 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-orange-500/25 animate-pulse">
            W
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <div className="w-3.5 h-3.5 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
            <span>Connecting to WorkHub Smart Grid...</span>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN APPLICATION SHELL (WITH SLEEK SIDEBAR & SMART DASHBOARD) ---
  return (
    <div className={`min-h-screen bg-[#121418] text-slate-100 flex flex-col lg:flex-row transition-colors ${isDarkMode ? 'dark' : ''}`}>
      
      {/* Sleek Desktop Sidebar Navigation */}
      <SidebarNav
        currentView={
          activeScreen === 'team'
            ? 'team'
            : activeScreen === 'projects'
            ? 'projects'
            : activeScreen === 'tracker'
            ? 'analytics'
            : 'dashboard'
        }
        onSelectView={(v) => {
          if (v === 'dashboard') setActiveScreen('dashboard');
          else if (v === 'team') setActiveScreen('team');
          else if (v === 'projects') setActiveScreen('projects');
          else if (v === 'analytics') setActiveScreen('tracker');
        }}
      />

      {/* Main App Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className="sticky top-0 z-40 bg-[#121418]/85 backdrop-blur-xl border-b border-white/10 px-4 md:px-8 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            
            {/* Mobile / Tablet Logo & Switcher */}
            <div className="flex items-center gap-3">
              <div className="lg:hidden w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white font-black text-sm shadow-md shadow-orange-500/20">
                W
              </div>

              {/* Navigation Pill Strip (Shown on all screen sizes for fast switching) */}
              <nav className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-full">
                <button
                  onClick={() => setActiveScreen('dashboard')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition shrink-0 ${
                    activeScreen === 'dashboard'
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => setActiveScreen('team')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition shrink-0 ${
                    activeScreen === 'team'
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Team & Workspace</span>
                </button>

                <button
                  onClick={() => setActiveScreen('projects')}
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition shrink-0 ${
                    activeScreen === 'projects'
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Projects</span>
                </button>

                <button
                  onClick={() => setActiveScreen('tracker')}
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition shrink-0 ${
                    activeScreen === 'tracker'
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Tracker</span>
                </button>

                {!isMember && (
                  <button
                    onClick={() => setActiveScreen('invoices')}
                    className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition shrink-0 ${
                      activeScreen === 'invoices'
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Invoices</span>
                  </button>
                )}

                {canApprove && (
                  <button
                    onClick={() => setActiveScreen('approvals')}
                    className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition shrink-0 relative ${
                      activeScreen === 'approvals'
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Approvals</span>
                    {pendingApprovalsCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                        {pendingApprovalsCount}
                      </span>
                    )}
                  </button>
                )}

                <button
                  onClick={() => setShowHeroPreview(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition shrink-0"
                  title="Preview Black Hole Hero Section"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span className="hidden sm:inline">Hero</span>
                </button>
              </nav>
            </div>

            {/* Right Action Strip */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              
              {/* Supabase Status Button */}
              <button
                onClick={() => setIsSupabaseModalOpen(true)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition active:scale-95 ${
                  supabaseStatus === 'connected'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:border-orange-500/40 hover:text-orange-400'
                }`}
                title="Configure Supabase Cloud"
              >
                <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="hidden md:inline">
                  {supabaseStatus === 'connected' ? 'Cloud Synced' : isSyncing ? 'Syncing...' : 'Connect Cloud'}
                </span>
                {supabaseStatus === 'connected' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>

              {/* Raches AI Co-pilot Button */}
              <button
                onClick={() => {
                  setRachesInitialPrompt(undefined);
                  setIsAiDrawerOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white shadow-md shadow-orange-500/20 transition active:scale-95 border border-orange-400/30"
                title="Open Rachel AI Assistant"
              >
                <Flower2 className="w-3.5 h-3.5 text-white" />
                <span className="font-bold tracking-tight">Raches 🌸</span>
              </button>

              {/* Active Timer Pill */}
              {status === 'running' && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-mono text-xs font-bold text-emerald-400">
                    {formatDuration(headerTimerSeconds)}
                  </span>
                  <button
                    onClick={() => stopTimer()}
                    className="p-1 rounded text-emerald-400 hover:text-rose-400 transition"
                    title="Stop Timer"
                  >
                    <Square className="w-3 h-3 fill-current" />
                  </button>
                </div>
              )}

              {/* Unbilled Quick Counter */}
              {!isMember && (
                <div className="hidden xl:flex flex-col items-end text-right">
                  <span className="text-[10px] uppercase font-semibold text-slate-500">Unbilled</span>
                  <span className="text-xs font-mono font-bold text-slate-300">
                    {formatCurrency(unbilled.unbilledTotalAmount)}
                  </span>
                </div>
              )}

              {/* Theme Toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-xl border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition"
                title="Toggle Dark/Light Mode"
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
              </button>

              {/* Sign In button or Profile Menu */}
              {!user ? (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5 text-orange-400" />
                  <span>Sign In</span>
                </button>
              ) : (
                <UserProfileMenu onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)} />
              )}

            </div>

          </div>
        </header>

        {/* Main Body */}
        <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 w-full flex-1">
          {activeScreen === 'dashboard' && <SmartWorkplaceDashboard />}
          {activeScreen === 'team' && <TeamWorkspaceView />}
          {activeScreen === 'projects' && <ClientProjectManager onGetUnstuck={handleGetUnstuck} />}
          {activeScreen === 'tracker' && <TimeTracker onGetUnstuck={handleGetUnstuck} />}
          {activeScreen === 'invoices' && !isMember && <InvoiceManager />}
          {activeScreen === 'approvals' && canApprove && <ApprovalsDashboard />}
        </main>

        {/* Rachel AI Assistant Drawer */}
        <AIAssistantDrawer
          isOpen={isAiDrawerOpen}
          onClose={() => setIsAiDrawerOpen(false)}
          appContext={appContext}
          initialPrompt={rachesInitialPrompt}
          onClearInitialPrompt={() => setRachesInitialPrompt(undefined)}
        />

        {/* Supabase Configuration Modal */}
        <SupabaseModal
          isOpen={isSupabaseModalOpen}
          onClose={() => setIsSupabaseModalOpen(false)}
        />

        {/* Auth Modal if user clicks Sign In */}
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <div className="relative w-full max-w-md my-8">
              <div className="absolute top-4 right-4 z-50">
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <AuthPage onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)} />
            </div>
          </div>
        )}

        {/* Black Hole Hero Preview Overlay */}
        {showHeroPreview && (
          <div className="fixed inset-0 z-50 bg-black overflow-y-auto">
            <div className="fixed top-4 right-4 z-[60]">
              <button
                onClick={() => setShowHeroPreview(false)}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition border border-white/20 shadow-lg"
              >
                ✕ Exit Preview
              </button>
            </div>
            <BlackHoleHeroSectionDemo />
          </div>
        )}

      </div>

    </div>
  );
}

export default App;
