// src/components/SmartWorkplace/SmartWorkplaceDashboard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { TopAmbienceBar } from './TopAmbienceBar';
import { MobileDevicePanel } from './MobileDevicePanel';
import { ScenarioSelectorCard } from './ScenarioSelectorCard';
import { NightModeCard } from './NightModeCard';
import { SecurityStreamCard } from './SecurityStreamCard';
import { WidgetsGrid } from './WidgetsGrid';
import { useSmartWorkplaceStore } from '../../store/useSmartWorkplaceStore';

export const SmartWorkplaceDashboard: React.FC = () => {
  const { ambienceMode } = useSmartWorkplaceStore();

  // Dynamic ambient glow styling
  const ambientBackgroundGlow = ambienceMode === 'warm'
    ? 'radial-gradient(ellipse 60% 40% at 50% -10%, rgba(249, 115, 22, 0.15), transparent 70%)'
    : ambienceMode === 'neutral'
    ? 'radial-gradient(ellipse 60% 40% at 50% -10%, rgba(245, 158, 11, 0.12), transparent 70%)'
    : 'radial-gradient(ellipse 60% 40% at 50% -10%, rgba(56, 189, 248, 0.12), transparent 70%)';

  return (
    <div className="relative min-h-screen text-slate-100 overflow-hidden pb-16">
      
      {/* Dynamic Ambient Background Glow */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-700 z-0"
        style={{ background: ambientBackgroundGlow }}
      />

      {/* Top Floating Control Bar Header */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 pt-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>Workplace Atmosphere</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 capitalize">
              {ambienceMode} Mode
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Connected to Zurich HQ Main Light & Audio Grid • 21.4°C Ambient
          </p>
        </div>

        {/* Floating Ambience Selector Pill */}
        <TopAmbienceBar />
      </div>

      {/* Main 3-Column Dashboard Grid Matching Reference Screenshot */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Smartphone Remote Simulator (4 Cols on lg) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-4 flex justify-center w-full"
        >
          <MobileDevicePanel />
        </motion.div>

        {/* Middle Column: Scenarios & Live Security Stream (4 Cols on lg) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-4 space-y-6 w-full"
        >
          {/* Quick Scenario & Room Selector Card */}
          <ScenarioSelectorCard />

          {/* Live Security Camera Feeds */}
          <SecurityStreamCard />
        </motion.div>

        {/* Right Column: Optimize Night Mode & Bottom Widgets (4 Cols on lg) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-4 space-y-6 w-full"
        >
          {/* Night Mode Banner Card */}
          <NightModeCard />

          {/* Energy & Storage Widgets */}
          <WidgetsGrid />
        </motion.div>

      </div>

    </div>
  );
};
