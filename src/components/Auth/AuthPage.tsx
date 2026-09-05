// src/components/Auth/AuthPage.tsx
import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  User, 
  Building2, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Database,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useWorkflowStore } from '../../store/useWorkflowStore';

interface AuthPageProps {
  onOpenSupabaseModal?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onOpenSupabaseModal }) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  
  // Sign In fields
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  
  // Sign Up fields
  const [signUpFullName, setSignUpFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpBusinessName, setSignUpBusinessName] = useState('');
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const { signIn, signUp, isLoading, error, successMessage, clearError, clearSuccessMessage } = useAuthStore();
  const { supabaseStatus } = useWorkflowStore();

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    clearSuccessMessage();

    if (!signInEmail.trim() || !signInPassword) {
      setLocalError('Please enter both email and password.');
      return;
    }

    const res = await signIn({
      email: signInEmail.trim(),
      password: signInPassword,
    });

    if (!res.success && res.error) {
      setLocalError(res.error);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    clearSuccessMessage();

    if (!signUpFullName.trim()) {
      setLocalError('Please enter your full name.');
      return;
    }

    if (!signUpEmail.trim()) {
      setLocalError('Please enter your email address.');
      return;
    }

    if (!signUpPassword || signUpPassword.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }

    const res = await signUp({
      fullName: signUpFullName.trim(),
      email: signUpEmail.trim(),
      password: signUpPassword,
      businessName: signUpBusinessName.trim() || undefined,
    });

    if (!res.success && res.error) {
      setLocalError(res.error);
    } else if (res.emailConfirmationRequired) {
      // Switched to display confirmation message
      setSignInEmail(signUpEmail.trim());
    }
  };

  // Demo helper for testing
  const handleQuickDemoFill = () => {
    if (authMode === 'signin') {
      setSignInEmail('demo@workerhub.pro');
      setSignInPassword('workerhub123');
    } else {
      setSignUpFullName('Alex Vance');
      setSignUpEmail('alex.vance@workhub.io');
      setSignUpPassword('SecurePass123!');
      setSignUpBusinessName('Vance Creative Labs');
    }
    setLocalError(null);
    clearError();
  };

  const activeError = localError || error;

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-sky-50/40 to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-sky-400/10 dark:bg-sky-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-violet-500/10 dark:bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-violet-600 text-white font-black text-2xl shadow-xl shadow-sky-500/25 ring-4 ring-white/60 dark:ring-slate-800/60 mb-4 transition-transform hover:scale-105">
            W
          </div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl text-slate-900 dark:text-white">
            WorkerHub
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Work smarter. Stay organized. Get paid.
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl shadow-slate-200/50 dark:shadow-slate-950/50 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
          
          {/* Tab Switcher */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setLocalError(null);
                clearError();
                clearSuccessMessage();
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                authMode === 'signin'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setLocalError(null);
                clearError();
                clearSuccessMessage();
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                authMode === 'signup'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Alert / Error Banner */}
          {activeError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <div>{activeError}</div>
                {activeError.toLowerCase().includes('supabase') && onOpenSupabaseModal && (
                  <button
                    type="button"
                    onClick={onOpenSupabaseModal}
                    className="mt-2 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1.5"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>Open Supabase Settings & Credentials</span>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setLocalError(null);
                  clearError();
                }}
                className="text-rose-500 hover:text-rose-700 font-bold text-sm leading-none"
              >
                ×
              </button>
            </div>
          )}

          {/* Success / Verification Banner */}
          {successMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-300 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
              <div className="flex-1 leading-relaxed">{successMessage}</div>
              <button
                type="button"
                onClick={clearSuccessMessage}
                className="text-emerald-500 hover:text-emerald-700 font-bold text-sm leading-none"
              >
                ×
              </button>
            </div>
          )}

          {/* --- SIGN IN FORM --- */}
          {authMode === 'signin' && (
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="name@company.com"
                    autoComplete="email"
                    className="block w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                </div>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="block w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-sky-500 via-indigo-600 to-violet-600 hover:from-sky-600 hover:to-indigo-700 shadow-md shadow-sky-500/20 active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to WorkerHub</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* --- SIGN UP FORM --- */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={signUpFullName}
                    onChange={(e) => setSignUpFullName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    autoComplete="name"
                    className="block w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Business / Studio Name <span className="text-slate-400 text-[11px] font-normal">(Optional)</span>
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={signUpBusinessName}
                    onChange={(e) => setSignUpBusinessName(e.target.value)}
                    placeholder="e.g. Acme Design Studio"
                    className="block w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="sarah@example.com"
                    autoComplete="email"
                    className="block w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password <span className="text-rose-500">*</span> <span className="text-[10px] text-slate-400 font-normal">(Min. 6 chars)</span>
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    minLength={6}
                    className="block w-full pl-10 pr-10 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-sky-500 via-indigo-600 to-violet-600 hover:from-sky-600 hover:to-indigo-700 shadow-md shadow-sky-500/20 active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating your workspace...</span>
                  </>
                ) : (
                  <>
                    <span>Create WorkerHub Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Demo Pre-fill helper */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Testing WorkerHub?</span>
            <button
              type="button"
              onClick={handleQuickDemoFill}
              className="font-medium text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
            >
              <Zap className="w-3.5 h-3.5" />
              Fill sample credentials
            </button>
          </div>
        </div>

        {/* Security & Feature Pills Footer */}
        <div className="mt-8 grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
            <ShieldCheck className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
            <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">RLS Isolated</div>
            <div className="text-[10px] text-slate-400">Your data is private</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
            <Clock className="w-4 h-4 mx-auto text-sky-500 mb-1" />
            <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Time Tracking</div>
            <div className="text-[10px] text-slate-400">Billable hours & logs</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
            <Sparkles className="w-4 h-4 mx-auto text-violet-500 mb-1" />
            <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Rachel AI</div>
            <div className="text-[10px] text-slate-400">Smart workflow helper</div>
          </div>
        </div>

        {/* Database connectivity note */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onOpenSupabaseModal}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
          >
            <Database className="w-3.5 h-3.5 text-emerald-500" />
            <span>Supabase Cloud: {supabaseStatus === 'connected' ? 'Connected & Ready' : 'Database Ready'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default AuthPage;
