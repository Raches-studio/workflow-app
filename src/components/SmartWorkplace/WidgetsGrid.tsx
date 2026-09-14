// src/components/SmartWorkplace/WidgetsGrid.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, HardDrive, Maximize2, TrendingUp } from 'lucide-react';
import { PRODUCTIVITY_HOURS_DATA } from './mockSmartHubData';

export const WidgetsGrid: React.FC = () => {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const storageUsed = 820;
  const storageTotal = 1000;
  const storagePercentage = Math.round((storageUsed / storageTotal) * 100);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      
      {/* 1. Team Productivity Hours Widget */}
      <div className="relative rounded-3xl p-5 bg-[#161920]/80 border border-white/10 backdrop-blur-xl shadow-2xl hover:border-white/20 transition-all duration-300 flex flex-col justify-between">
        
        {/* Header Strip */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-sm">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">Productivity Hours</h4>
              <p className="text-[10px] text-slate-400">Team sprint velocity</p>
            </div>
          </div>

          <button className="text-slate-500 hover:text-white transition">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Big Metric Display */}
        <div className="my-2 flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-bold font-mono text-white tracking-tight">38.5</span>
            <span className="ml-1 text-xs font-semibold text-orange-400">hrs</span>
            <span className="block text-[10px] text-slate-400 font-medium">18.2 billable hours</span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-0.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <TrendingUp className="w-3 h-3" />
            +12.4%
          </span>
        </div>

        {/* Animated 7-Day Vertical Bar Chart */}
        <div className="mt-2 pt-2 border-t border-white/5">
          <div className="flex items-end justify-between gap-1.5 h-20 px-1">
            {PRODUCTIVITY_HOURS_DATA.map((item) => {
              const heightPercent = Math.round((item.totalHours / 10) * 100);
              const isHovered = hoveredDay === item.day;

              return (
                <div 
                  key={item.day}
                  onMouseEnter={() => setHoveredDay(item.day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer"
                >
                  {/* Tooltip on hover */}
                  <div className={`text-[9px] font-mono transition-opacity ${isHovered ? 'opacity-100 text-orange-400 font-bold' : 'opacity-0'}`}>
                    {item.totalHours}h
                  </div>

                  {/* Bar Column */}
                  <div className="w-full bg-slate-800/80 rounded-lg h-14 flex items-end p-0.5 overflow-hidden">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercent}%` }}
                      transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
                      className={`w-full rounded-md transition-colors ${
                        item.isPeak 
                          ? 'bg-gradient-to-t from-orange-600 to-amber-400 shadow-[0_0_10px_rgba(249,115,22,0.4)]' 
                          : 'bg-slate-600 hover:bg-slate-400'
                      }`}
                    />
                  </div>

                  {/* Day Label */}
                  <span className={`text-[10px] font-medium ${isHovered ? 'text-white' : 'text-slate-500'}`}>
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 2. Cloud Storage & Asset Usage Widget */}
      <div className="relative rounded-3xl p-5 bg-[#161920]/80 border border-white/10 backdrop-blur-xl shadow-2xl hover:border-white/20 transition-all duration-300 flex flex-col justify-between">
        
        {/* Header Strip */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-sm">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">Cloud Storage & Assets</h4>
              <p className="text-[10px] text-slate-400">Team drive & archives</p>
            </div>
          </div>

          <button className="text-slate-500 hover:text-white transition">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Big Metric Display */}
        <div className="my-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">{storageUsed}</span>
            <span className="text-xs font-semibold text-slate-400">/ {storageTotal} GB</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {storageTotal - storageUsed} GB available workspace capacity
          </p>
        </div>

        {/* Progress Bar & Breakdown */}
        <div className="mt-2 pt-2 border-t border-white/5 space-y-2">
          {/* Multi-tier Gradient Progress Bar */}
          <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${storagePercentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-orange-500 shadow-sm"
            />
          </div>

          {/* Breakdown Chips */}
          <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              <span>Design 340G</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span>Deliver 210G</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span>Repos 270G</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
