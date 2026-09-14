// src/components/SmartWorkplace/MobileDevicePanel.tsx
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  MoreVertical, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Circle, 
  Wifi, 
  BatteryCharging,
  Target,
  Activity
} from 'lucide-react';
import { useSmartWorkplaceStore } from '../../store/useSmartWorkplaceStore';

function formatTimer(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const MobileDevicePanel: React.FC = () => {
  const {
    ambienceMode,
    isSprintRunning,
    sprintRemainingSeconds,
    sprintDurationSeconds,
    activeSprintTaskId,
    toggleSprintTimer,
    resetSprintTimer,
    setSprintRemainingSeconds,
    tasks,
    toggleTaskCompletion,
    activityFeed,
    onSprintCompleted
  } = useSmartWorkplaceStore();

  // Active task derived
  const activeTask = tasks.find((t) => t.id === activeSprintTaskId) || tasks[0];

  // Live timer tick
  useEffect(() => {
    if (!isSprintRunning) return;
    const interval = setInterval(() => {
      if (sprintRemainingSeconds > 1) {
        setSprintRemainingSeconds(sprintRemainingSeconds - 1);
      } else if (sprintRemainingSeconds === 1) {
        setSprintRemainingSeconds(0);
        onSprintCompleted();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isSprintRunning, sprintRemainingSeconds, setSprintRemainingSeconds, onSprintCompleted]);

  // Ambience colors
  const accentHex = ambienceMode === 'warm' 
    ? '#F97316' 
    : ambienceMode === 'neutral' 
    ? '#F59E0B' 
    : '#38BDF8';

  const glowColor = ambienceMode === 'warm' 
    ? 'rgba(249, 115, 22, 0.4)' 
    : ambienceMode === 'neutral' 
    ? 'rgba(245, 158, 11, 0.35)' 
    : 'rgba(56, 189, 248, 0.35)';

  // Calculate percentage of sprint elapsed
  const progressRatio = (sprintDurationSeconds - sprintRemainingSeconds) / sprintDurationSeconds;
  const strokeDashoffset = 377 - 377 * progressRatio;

  return (
    <div className="relative mx-auto w-full max-w-[340px] select-none">
      {/* Phone Hardware Chassis */}
      <div className="relative rounded-[48px] p-3.5 bg-gradient-to-b from-[#2A2E39] via-[#1E2128] to-[#121418] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border border-white/15">
        
        {/* Antenna Lines & Physical Edge Accents */}
        <div className="absolute -left-[2px] top-28 w-[3px] h-9 bg-slate-600/60 rounded-l" />
        <div className="absolute -left-[2px] top-40 w-[3px] h-12 bg-slate-600/60 rounded-l" />
        <div className="absolute -left-[2px] top-56 w-[3px] h-12 bg-slate-600/60 rounded-l" />
        <div className="absolute -right-[2px] top-36 w-[3px] h-16 bg-slate-600/60 rounded-r" />

        {/* Screen Bezel Container */}
        <div className="relative overflow-hidden rounded-[38px] bg-[#0E1015] border border-black/80 shadow-inner flex flex-col justify-between min-h-[660px]">
          
          {/* Subtle Ambient Radial Glow */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-20 transition-all duration-700"
            style={{
              background: `radial-gradient(circle at 50% 28%, ${accentHex} 0%, transparent 65%)`
            }}
          />

          {/* Top Status Bar & Dynamic Island */}
          <div className="relative z-20 px-6 pt-3 pb-1 flex items-center justify-between text-[11px] font-semibold text-slate-300">
            <span>9:41</span>
            
            {/* Dynamic Island */}
            <div className="w-24 h-5 rounded-full bg-black border border-white/10 flex items-center justify-between px-2.5 shadow-md">
              <span className="w-2 h-2 rounded-full bg-slate-900 border border-slate-700/60" />
              <div className="flex items-center gap-1">
                {isSprintRunning && (
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                )}
                <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Wifi className="w-3 h-3 text-slate-300" />
              <div className="flex items-center gap-0.5">
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Phone In-App Header */}
          <div className="relative z-10 px-5 pt-3 flex items-center justify-between">
            <button className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition">
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-center">
              <h2 className="text-xs font-semibold text-white tracking-wide">Focus Sprint</h2>
              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" 
                  alt="Maria Z." 
                  className="w-3.5 h-3.5 rounded-full object-cover border border-white/20"
                />
                <span className="text-[10px] text-slate-400 font-medium">Maria Z.</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-orange-500/20 text-orange-400 font-semibold border border-orange-500/30">
                  Sprint #14
                </span>
              </div>
            </div>

            <button className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition">
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Central Animated Focus & Sprint Dial */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-2">
            
            <div className="relative w-52 h-52 flex items-center justify-center">
              {/* Outer Ambient Glow */}
              <motion.div
                animate={{
                  scale: isSprintRunning ? [1, 1.06, 1] : 1,
                  opacity: isSprintRunning ? [0.5, 0.8, 0.5] : 0.2,
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full blur-2xl"
                style={{ background: glowColor }}
              />

              {/* Dial Outer Bezel */}
              <div className="relative w-48 h-48 rounded-full p-2 bg-gradient-to-tr from-[#121418] via-[#1C2028] to-[#2B303C] border border-white/15 shadow-2xl flex items-center justify-center">
                
                {/* Radial SVG Timer Track */}
                <svg className="absolute inset-0 w-full h-full -rotate-90 p-2" viewBox="0 0 140 140">
                  <circle
                    cx="70"
                    cy="70"
                    r="60"
                    className="stroke-slate-800 fill-transparent"
                    strokeWidth="6"
                  />
                  <motion.circle
                    cx="70"
                    cy="70"
                    r="60"
                    className="fill-transparent transition-all duration-300"
                    stroke={accentHex}
                    strokeWidth="6"
                    strokeDasharray="377"
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{
                      filter: `drop-shadow(0 0 8px ${accentHex})`,
                    }}
                  />
                </svg>

                {/* Inner Dial Face */}
                <div className="relative w-36 h-36 rounded-full bg-[#101319] border border-white/10 flex flex-col items-center justify-center text-center p-2 z-10 shadow-inner">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">
                    {isSprintRunning ? 'In Progress' : 'Paused'}
                  </span>
                  
                  {/* Countdown Timer Display */}
                  <div className="text-2xl font-bold font-mono text-white tracking-tight leading-none my-1">
                    {formatTimer(sprintRemainingSeconds)}
                  </div>

                  {/* Active Sprint Task Label */}
                  <div className="text-[10px] font-medium text-orange-400 truncate max-w-[110px] mt-0.5" title={activeTask?.title}>
                    {activeTask?.title || 'Brand Portal'}
                  </div>

                  {/* Dial Controls Strip */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => resetSprintTimer(1500)}
                      className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white flex items-center justify-center transition"
                      title="Reset 25m Timer"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>

                    <button
                      onClick={toggleSprintTimer}
                      className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-500/30 transition active:scale-95"
                      title={isSprintRunning ? 'Pause Sprint' : 'Start Sprint'}
                    >
                      {isSprintRunning ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white translate-x-0.5" />}
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Sprint Pace / Daily Target Tracker Pill */}
            <div className="w-full max-w-[260px] mt-2.5 px-3 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-[11px] font-medium text-slate-300">Daily Target</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-bold text-white">4 / 6</span>
                <span className="text-[10px] text-slate-400">sprints</span>
              </div>
            </div>

          </div>

          {/* Bottom Card: Mobile Workspace Activity & Active Task Control */}
          <div className="relative z-10 m-2.5 p-3 rounded-2xl bg-[#14171E]/90 border border-white/10 backdrop-blur-xl shadow-xl">
            
            {/* Active Task Quick Item */}
            <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-white/10">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={() => toggleTaskCompletion(activeTask.id)}
                  className="text-orange-400 hover:text-orange-300 transition shrink-0"
                >
                  {activeTask.status === 'done' ? (
                    <CheckCircle2 className="w-4 h-4 fill-orange-400 text-black" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </button>
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-white truncate leading-tight">
                    {activeTask.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 truncate">
                    {activeTask.client} • <span className="text-orange-400">{activeTask.progress}%</span>
                  </p>
                </div>
              </div>

              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                activeTask.priority === 'high' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {activeTask.priority}
              </span>
            </div>

            {/* Live Team Activity Feed Stream */}
            <div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mb-1.5">
                <span className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-orange-400" />
                  Team Activity
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <div className="space-y-1.5">
                {activityFeed.slice(0, 2).map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-[10px] text-slate-300 gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <img src={item.avatarUrl} alt="" className="w-3.5 h-3.5 rounded-full shrink-0 object-cover" />
                      <span className="font-semibold text-white truncate">{item.user}</span>
                      <span className="text-slate-400 truncate">{item.action} {item.target}</span>
                    </div>
                    <span className="text-slate-500 text-[9px] shrink-0">{item.timeAgo}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Bottom Home Indicator Bar */}
          <div className="py-2 flex justify-center">
            <div className="w-28 h-1 rounded-full bg-white/20" />
          </div>

        </div>
      </div>
    </div>
  );
};
