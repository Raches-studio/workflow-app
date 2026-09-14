// src/components/SmartWorkplace/NightModeCard.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sparkles, ShieldAlert, Thermometer, X } from 'lucide-react';
import { useSmartWorkplaceStore } from '../../store/useSmartWorkplaceStore';

export const NightModeCard: React.FC = () => {
  const {
    isNightModeActive,
    isNightModeModalOpen,
    setNightModeModalOpen,
    toggleNightModeActive,
    nightSettings,
    updateNightSettings,
  } = useSmartWorkplaceStore();

  return (
    <>
      <div className="relative rounded-3xl p-6 bg-[#161920]/80 border border-white/10 backdrop-blur-xl shadow-2xl hover:border-white/20 transition-all duration-300 flex flex-col justify-between">
        
        {/* Ambient Top Glow */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-20 bg-orange-500/10 blur-3xl rounded-full pointer-events-none" />

        <div>
          {/* Header Icon Indicator */}
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-white/10 to-white/5 border border-white/15 flex items-center justify-center text-white shadow-inner">
              <Moon className="w-6 h-6 text-amber-300 fill-amber-300/20" />
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
              <span className={`w-2 h-2 rounded-full ${isNightModeActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span className="text-[10px] font-semibold text-slate-300 tracking-wider uppercase">
                {isNightModeActive ? 'Armed & Active' : 'Standby'}
              </span>
            </div>
          </div>

          {/* Main Title & Description */}
          <h3 className="text-xl font-semibold text-white tracking-tight leading-snug">
            Optimize Your Space<br />for the Night
          </h3>

          <p className="mt-2.5 text-xs leading-relaxed text-slate-400 font-normal">
            Night Mode prepares your environment for rest and energy efficiency by dimming lights, silencing non-critical alerts, and elevating perimeter security.
          </p>

          {/* Suggested Setup List */}
          <div className="mt-5 space-y-2.5 bg-white/[0.02] border border-white/5 p-3.5 rounded-2xl">
            <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-orange-400" />
              <span>Suggested setup</span>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-slate-300">
              <div className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center mt-0.5 shrink-0">
                ✓
              </div>
              <span className="leading-tight">Set to soft incandescent atmosphere to wind down</span>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-slate-300">
              <div className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center mt-0.5 shrink-0">
                ✓
              </div>
              <span className="leading-tight">Arm auto-lock doors and set CCTV cameras to high alert</span>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-slate-300">
              <div className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center mt-0.5 shrink-0">
                ✓
              </div>
              <span className="leading-tight">Maintain an optimal 19.5°C temp throughout the night</span>
            </div>
          </div>
        </div>

        {/* Action Button Strip */}
        <div className="mt-6 pt-2">
          <motion.button
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => setNightModeModalOpen(true)}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 border border-orange-400/30 transition-all"
          >
            <Moon className="w-4 h-4 fill-white/30" />
            <span>Configure Night Mode</span>
          </motion.button>
        </div>
      </div>

      {/* Interactive Night Mode Configuration Modal */}
      <AnimatePresence>
        {isNightModeModalOpen && (
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
                    <Moon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">Night Mode Schedule</h3>
                    <p className="text-xs text-slate-400">Automation & environmental parameters</p>
                  </div>
                </div>

                <button 
                  onClick={() => setNightModeModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Toggles */}
              <div className="py-5 space-y-3.5">
                {/* Master Switch */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div>
                    <div className="text-xs font-semibold text-white">Enable Night Mode Now</div>
                    <div className="text-[11px] text-slate-400">Apply evening presets across all zones</div>
                  </div>
                  <button 
                    onClick={toggleNightModeActive}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      isNightModeActive ? 'bg-orange-500' : 'bg-slate-700'
                    }`}
                  >
                    <span 
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                        isNightModeActive ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Lighting Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-xs font-medium text-white">Soft Ambient Lighting</div>
                      <div className="text-[10px] text-slate-400">Dim lighting to 20% warm temperature</div>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={nightSettings.softLighting}
                    onChange={(e) => updateNightSettings({ softLighting: e.target.checked })}
                    className="w-4 h-4 accent-orange-500 rounded"
                  />
                </div>

                {/* Security Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <div>
                      <div className="text-xs font-medium text-white">CCTV & Perimeter High Alert</div>
                      <div className="text-[10px] text-slate-400">Motion detection with instant notify</div>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={nightSettings.cameraHighAlert}
                    onChange={(e) => updateNightSettings({ cameraHighAlert: e.target.checked })}
                    className="w-4 h-4 accent-orange-500 rounded"
                  />
                </div>

                {/* Target Temperature Slider */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 text-xs font-medium text-white">
                      <Thermometer className="w-4 h-4 text-sky-400" />
                      <span>Night Temperature Target</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-orange-400">{nightSettings.targetTemp}°C</span>
                  </div>
                  <input 
                    type="range" 
                    min={16} 
                    max={24} 
                    step={0.5}
                    value={nightSettings.targetTemp}
                    onChange={(e) => updateNightSettings({ targetTemp: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={() => setNightModeModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setNightModeModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs shadow-md transition"
                >
                  Save Settings
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
