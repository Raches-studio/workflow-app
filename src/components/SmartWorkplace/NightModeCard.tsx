// src/components/SmartWorkplace/NightModeCard.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  Sparkles, 
  AlertCircle, 
  X, 
  ShieldCheck, 
  Zap
} from 'lucide-react';
import { useSmartWorkplaceStore } from '../../store/useSmartWorkplaceStore';

export const NightModeCard: React.FC = () => {
  const {
    isFocusModalOpen,
    setFocusModalOpen,
    dailyGoalProgress,
    incrementGoalDeliverable,
  } = useSmartWorkplaceStore();

  const percentage = Math.round(
    (dailyGoalProgress.completedDeliverables / dailyGoalProgress.totalDeliverables) * 100
  );

  return (
    <>
      <div className="relative rounded-3xl p-6 bg-[#161920]/80 border border-white/10 backdrop-blur-xl shadow-2xl hover:border-white/20 transition-all duration-300 flex flex-col justify-between">
        
        {/* Ambient Top Glow */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-20 bg-orange-500/10 blur-3xl rounded-full pointer-events-none" />

        <div>
          {/* Header Icon Indicator */}
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500/20 to-amber-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-inner">
              <Target className="w-6 h-6" />
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-semibold tracking-wider uppercase font-mono">
                {percentage}% on track
              </span>
            </div>
          </div>

          {/* Main Title & Description */}
          <h3 className="text-xl font-semibold text-white tracking-tight leading-snug">
            Executive Summary &<br />Daily Goals
          </h3>

          <p className="mt-2 text-xs leading-relaxed text-slate-400 font-normal">
            Track daily sprint targets, unblock active project milestones, and maintain velocity across your team.
          </p>

          {/* Daily Metrics Chips */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="p-2.5 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
              <div className="text-[10px] uppercase font-semibold text-slate-500">Targets</div>
              <div className="text-sm font-bold font-mono text-white mt-0.5">
                {dailyGoalProgress.completedDeliverables}/{dailyGoalProgress.totalDeliverables}
              </div>
            </div>
            <div className="p-2.5 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
              <div className="text-[10px] uppercase font-semibold text-slate-500">Logged</div>
              <div className="text-sm font-bold font-mono text-orange-400 mt-0.5">
                {dailyGoalProgress.loggedHours}h
              </div>
            </div>
            <div className="p-2.5 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
              <div className="text-[10px] uppercase font-semibold text-slate-500">Unbilled</div>
              <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                ${dailyGoalProgress.unbilledAmount}
              </div>
            </div>
          </div>

          {/* Upcoming Deadline Alert Banner */}
          <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-amber-300">Upcoming Deadline Alert</div>
              <p className="text-[11px] text-amber-200/70 leading-snug mt-0.5">
                Mobile Crypto Wallet MVP deposit milestone due in 48 hours.
              </p>
            </div>
          </div>

          {/* Suggested Setup / Milestones Checklist */}
          <div className="mt-4 space-y-2 bg-white/[0.02] border border-white/5 p-3 rounded-2xl">
            <div className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-orange-400" />
              <span>Suggested Milestones</span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                <span className="text-[11px]">Finalize Brand Portal CSS tokens</span>
              </div>
              <button 
                onClick={incrementGoalDeliverable}
                className="text-[10px] text-orange-400 hover:text-orange-300 font-semibold"
              >
                Mark done
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span className="text-[11px]">Approve pending team time logs</span>
              </div>
              <button 
                onClick={incrementGoalDeliverable}
                className="text-[10px] text-orange-400 hover:text-orange-300 font-semibold"
              >
                Mark done
              </button>
            </div>
          </div>
        </div>

        {/* Action Button Strip */}
        <div className="mt-6 pt-2">
          <motion.button
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => setFocusModalOpen(true)}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 border border-orange-400/30 transition-all"
          >
            <Zap className="w-4 h-4 fill-white/30" />
            <span>Launch Focus Mode</span>
          </motion.button>
        </div>
      </div>

      {/* Interactive Focus Mode & Daily Report Modal */}
      <AnimatePresence>
        {isFocusModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              className="relative w-full max-w-md rounded-3xl p-6 bg-[#161920] border border-white/15 shadow-2xl text-white"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">Deep Focus Session</h3>
                    <p className="text-xs text-slate-400">Pomodoro block & distraction shield</p>
                  </div>
                </div>

                <button 
                  onClick={() => setFocusModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Session Controls */}
              <div className="py-5 space-y-3.5">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">Target Session</span>
                  <div className="text-3xl font-bold font-mono text-white mt-1">45:00</div>
                  <p className="text-xs text-slate-400 mt-1">
                    Primary deliverable: <span className="text-white font-semibold">Brand Portal Design Overhaul</span>
                  </p>
                </div>

                {/* Focus Shields */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-xs font-medium text-white">Mute All Incoming Notifications</div>
                      <div className="text-[10px] text-slate-400">Suppress Slack, email, and task pings</div>
                    </div>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-orange-500 rounded" />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-xs font-medium text-white">Ambient Binaural Focus Waves</div>
                      <div className="text-[10px] text-slate-400">Alpha frequency audio layer</div>
                    </div>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-orange-500 rounded" />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={() => setFocusModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => setFocusModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs shadow-md transition"
                >
                  Start 45m Sprint
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
