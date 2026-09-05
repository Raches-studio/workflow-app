// src/components/Header/UserProfileMenu.tsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  LogOut, 
  Building2, 
  Mail, 
  ChevronDown, 
  ShieldCheck, 
  Database,
  ExternalLink
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { UserRole } from '../../types';

interface UserProfileMenuProps {
  onOpenSupabaseModal?: () => void;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({ onOpenSupabaseModal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { user, profile, signOut, setRole } = useAuthStore();
  const { supabaseStatus } = useWorkflowStore();

  const activeRole: UserRole = profile?.role || 'admin';

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!user) return null;

  // Derive display values
  const displayName = profile?.fullName || user.user_metadata?.full_name || user.user_metadata?.name || 'WorkerHub Pro';
  const displayEmail = profile?.email || user.email || '';
  const displayBusiness = profile?.businessName || user.user_metadata?.business_name;

  // Compute initials for avatar (e.g. "Sarah Jenkins" -> "SJ")
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (name[0] || 'U').toUpperCase();
  };

  const initials = getInitials(displayName);

  const handleLogout = async () => {
    setIsOpen(false);
    await signOut();
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm transition active:scale-95 group focus:outline-none focus:ring-2 focus:ring-sky-500/40"
        title="User Account & Settings"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar Ring */}
        <div className="relative w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-sm ring-2 ring-white dark:ring-slate-900 group-hover:scale-105 transition-transform">
          {initials}
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
        </div>

        {/* User Name & Role (hidden on small mobile) */}
        <div className="hidden sm:flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight leading-tight truncate max-w-[100px]">
              {displayName}
            </span>
            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
              activeRole === 'admin'
                ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                : activeRole === 'manager'
                ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300'
                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
            }`}>
              {activeRole}
            </span>
          </div>
          {displayBusiness && (
            <span className="text-[10px] text-slate-400 leading-none truncate max-w-[120px]">
              {displayBusiness}
            </span>
          )}
        </div>

        <ChevronDown 
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 py-2 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-right">
          
          {/* Header Section: Identity */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-sky-500/20">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                  <span>{displayName}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {activeRole}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{displayEmail}</span>
                </div>
              </div>
            </div>

            {/* Optional Business Name Pill */}
            {displayBusiness && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 text-xs font-medium border border-sky-200/70 dark:border-sky-800/60 max-w-full truncate">
                <Building2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span className="truncate">{displayBusiness}</span>
              </div>
            )}
          </div>

          {/* Interactive Role Switcher */}
          <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800/80">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Active Role & Permissions</span>
              <span className="text-sky-600 dark:text-sky-400 font-mono capitalize">{activeRole}</span>
            </div>
            <div className="grid grid-cols-3 gap-1 bg-slate-200/60 dark:bg-slate-800/80 p-1 rounded-xl text-center">
              {(['admin', 'manager', 'member'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-1 text-[11px] font-bold rounded-lg capitalize transition ${
                    activeRole === r
                      ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={`Switch to ${r} role`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Account & Security Status */}
          <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Security
              </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                RLS Protected
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-500" />
                Cloud Sync
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">
                {supabaseStatus}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-2 py-1.5 border-b border-slate-100 dark:border-slate-800/80">
            {onOpenSupabaseModal && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenSupabaseModal();
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg transition"
              >
                <span className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-sky-500" />
                  Database & RLS Setup
                </span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </button>
            )}
          </div>

          {/* Sign Out Action */}
          <div className="px-2 pt-1.5">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Log Out</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default UserProfileMenu;
