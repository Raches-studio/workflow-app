// src/App.tsx
import { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  Briefcase, 
  Flower2, 
  Square, 
  Moon, 
  Sun,
  Database
} from 'lucide-react';
import { TimeTracker } from './components/TimeTracker/TimeTracker';
import { ClientProjectManager } from './components/Projects/ClientProjectManager';
import { SupabaseModal } from './components/Supabase/SupabaseModal';
import { useTimerStore } from './store/useTimerStore';
import { useWorkflowStore } from './store/useWorkflowStore';
import { formatDuration, formatCurrency } from './utils/formatters';
import { AIAssistantDrawer } from './components/AIAssistant/AIAssistantDrawer';
import { CurrentAppContext } from './types';

export function App() {
  const [activeScreen, setActiveScreen] = useState<'tracker' | 'projects'>('tracker');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState<boolean>(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);
  const [rachesInitialPrompt, setRachesInitialPrompt] = useState<string | undefined>();

  const { status, projectId, taskId, getElapsedSeconds, stopTimer } = useTimerStore();
  const { 
    projects, 
    tasks, 
    getUnbilledSummary, 
    supabaseStatus, 
    isSyncing, 
    initSupabaseSync 
  } = useWorkflowStore();
  const unbilled = getUnbilledSummary();

  const [headerTimerSeconds, setHeaderTimerSeconds] = useState(0);

  // Initialize Supabase sync on app mount
  useEffect(() => {
    initSupabaseSync();
  }, [initSupabaseSync]);

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
    currentPage: activeScreen,
    activeProjectId: activeProject?.id,
    activeProjectName: activeProject?.name,
    activeTaskId: activeTask?.id,
    activeTaskTitle: activeTask?.title,
    activeTaskDescription: activeTask?.description,
    isTimerRunning: status === 'running',
  }), [activeScreen, activeProject, activeTask, status]);

  // Handler for 'Get Unstuck' action buttons on active tasks
  const handleGetUnstuck = (taskTitle: string, taskDesc?: string, projectName?: string) => {
    const projContext = projectName ? ` for project "${projectName}"` : (activeProject ? ` for project "${activeProject.name}"` : '');
    const descContext = taskDesc ? ` (Details: ${taskDesc})` : '';
    const prompt = `I'm stuck on "${taskTitle}"${projContext}${descContext}. Rachel, please troubleshoot this with me and give me a clear 3-step solution to get unblocked right now!`;
    setRachesInitialPrompt(prompt);
    setIsAiDrawerOpen(true);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} transition-colors`}>
      {/* --- GLOBAL APPLICATION HEADER --- */}
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-sky-500/20">
              W
            </div>
            <div>
              <div className="font-bold text-base tracking-tight flex items-center gap-1.5">
                WorkFlow
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                  MVP
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-500">Work smarter. Stay organized. Get paid.</p>
            </div>
          </div>

          {/* Navigation Pill Strip */}
          <nav className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveScreen('tracker')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeScreen === 'tracker'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Time Tracker</span>
            </button>

            <button
              onClick={() => setActiveScreen('projects')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeScreen === 'projects'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Projects & Clients</span>
            </button>
          </nav>

          {/* Persistent Active Timer, Supabase Cloud & Raches Trigger Strip */}
          <div className="flex items-center gap-2.5">
            {/* Supabase Cloud Connection Status Button */}
            <button
              onClick={() => setIsSupabaseModalOpen(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition active:scale-95 ${
                supabaseStatus === 'connected'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                  : supabaseStatus === 'checking' || isSyncing
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 animate-pulse'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-400 hover:text-sky-600 dark:hover:text-sky-400 shadow-sm'
              }`}
              title="Configure Supabase Cloud Database"
            >
              <Database className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="hidden sm:inline">
                {supabaseStatus === 'connected' 
                  ? 'Cloud Synced' 
                  : supabaseStatus === 'checking' || isSyncing 
                  ? 'Syncing...' 
                  : 'Connect Supabase'}
              </span>
              {supabaseStatus === 'connected' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>

            {/* Rebranded Raches (Rachel) Trigger Button (Sky blue, White & Floral) */}
            <button
              onClick={() => {
                setRachesInitialPrompt(undefined);
                setIsAiDrawerOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600 hover:from-sky-500 hover:to-sky-700 text-white shadow-sm shadow-sky-500/25 transition active:scale-95 border border-sky-300/40"
              title="Open Raches AI Co-pilot"
            >
              <Flower2 className="w-3.5 h-3.5 text-white animate-spin-slow" />
              <span className="font-bold tracking-tight">Raches 🌸</span>
            </button>

            {status === 'running' && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  {formatDuration(headerTimerSeconds)}
                </span>
                <button
                  onClick={() => stopTimer()}
                  className="p-1 rounded text-emerald-700 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                  title="Stop Active Timer"
                >
                  <Square className="w-3 h-3 fill-current" />
                </button>
              </div>
            )}

            {/* Unbilled Quick Counter */}
            <div className="hidden md:flex flex-col items-end text-right">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Unbilled</span>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                {formatCurrency(unbilled.unbilledTotalAmount)}
              </span>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Toggle Dark/Light Mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

        </div>
      </header>

      {/* --- MAIN PAGE CONTENT --- */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        {activeScreen === 'tracker' && (
          <TimeTracker onGetUnstuck={handleGetUnstuck} />
        )}
        {activeScreen === 'projects' && (
          <ClientProjectManager onGetUnstuck={handleGetUnstuck} />
        )}
      </main>

      {/* --- RACHES (RACHEL) AI ASSISTANT DRAWER --- */}
      <AIAssistantDrawer 
        isOpen={isAiDrawerOpen} 
        onClose={() => setIsAiDrawerOpen(false)}
        appContext={appContext}
        initialPrompt={rachesInitialPrompt}
        onClearInitialPrompt={() => setRachesInitialPrompt(undefined)}
      />

      {/* --- SUPABASE CONFIGURATION MODAL --- */}
      <SupabaseModal 
        isOpen={isSupabaseModalOpen} 
        onClose={() => setIsSupabaseModalOpen(false)} 
      />
    </div>
  );
}

export default App;
