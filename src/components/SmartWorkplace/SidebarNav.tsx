// src/components/SmartWorkplace/SidebarNav.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Briefcase, 
  BarChart3, 
  Users, 
  Settings, 
  Sparkles
} from 'lucide-react';
import { useSmartWorkplaceStore } from '../../store/useSmartWorkplaceStore';

export type MainNavView = 'dashboard' | 'projects' | 'analytics' | 'team';

interface SidebarNavProps {
  currentView: MainNavView;
  onSelectView: (view: MainNavView) => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ currentView, onSelectView }) => {
  const { members } = useSmartWorkplaceStore();
  const pendingCount = members.filter((m) => m.status === 'pending').length;

  const NAV_ITEMS: { id: MainNavView; label: string; icon: React.ElementType; badge?: string | number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'team', label: 'Team & Workspace', icon: Users, badge: pendingCount > 0 ? pendingCount : undefined },
  ];

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col justify-between p-4 bg-[#121418] border-r border-white/10 min-h-screen text-slate-300 select-none">
      
      {/* Top Logo & Branding */}
      <div>
        <div className="flex items-center gap-3 px-3 py-4 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 via-orange-600 to-amber-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-500/25 border border-orange-400/30">
            W
          </div>
          <div>
            <div className="font-bold text-white text-base tracking-tight flex items-center gap-1.5">
              WorkHub
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Smart Workplace OS</p>
          </div>
        </div>

        {/* Navigation Item Links */}
        <nav className="space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`relative w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold transition-colors duration-200 group ${
                  isActive ? 'text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-sidebar-indicator"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500/20 to-amber-500/10 border border-orange-500/30 shadow-md shadow-orange-500/10 backdrop-blur-md"
                  />
                )}

                <div className="relative z-10 flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-orange-400' : 'text-slate-500'
                  }`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="relative z-10 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500 text-white shadow-sm shadow-orange-500/40">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Workspace Status Badge */}
        <div className="mt-8 p-4 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/10 shadow-inner">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>Workspace Status</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-mono text-emerald-400 font-medium tracking-wide uppercase">Optimal</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            18 team members active. All workspace services operational.
          </p>
        </div>
      </div>

      {/* Bottom User Profile Section */}
      <div className="pt-4 border-t border-white/10">
        <div className="flex items-center justify-between p-2 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-9 h-9 rounded-full overflow-hidden border border-white/20 shrink-0">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80" 
                alt="Maria Zakharova" 
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#121418]" />
            </div>
            <div className="min-w-0">
              <h5 className="text-xs font-semibold text-white truncate">Maria Zakharova</h5>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-orange-400 font-semibold uppercase tracking-wider">Admin</span>
                <span className="text-slate-600 text-[9px]">•</span>
                <span className="text-[10px] text-slate-400">Zurich HQ</span>
              </div>
            </div>
          </div>

          <button className="text-slate-500 hover:text-white p-1 rounded-lg transition" title="Workspace Settings">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

    </aside>
  );
};
