// src/components/SmartWorkplace/TopAmbienceBar.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Flame, SunMedium, Snowflake } from 'lucide-react';
import { useSmartWorkplaceStore, AmbienceMode } from '../../store/useSmartWorkplaceStore';

interface AmbienceOption {
  id: AmbienceMode;
  label: string;
  icon: React.ElementType;
  accentColor: string;
}

const OPTIONS: AmbienceOption[] = [
  { id: 'warm', label: 'Warm', icon: Flame, accentColor: '#F97316' },
  { id: 'neutral', label: 'Neutral', icon: SunMedium, accentColor: '#F59E0B' },
  { id: 'cold', label: 'Cold', icon: Snowflake, accentColor: '#38BDF8' },
];

export const TopAmbienceBar: React.FC = () => {
  const { ambienceMode, setAmbienceMode } = useSmartWorkplaceStore();

  return (
    <div className="relative inline-flex items-center p-1.5 rounded-2xl bg-[#1A1D24]/80 border border-white/10 backdrop-blur-xl shadow-2xl shadow-black/60">
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const isActive = ambienceMode === option.id;

        return (
          <button
            key={option.id}
            onClick={() => setAmbienceMode(option.id)}
            className={`relative flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl transition-colors duration-200 z-10 ${
              isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="active-ambience-pill"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className="absolute inset-0 rounded-xl bg-white/10 border border-white/15 shadow-inner backdrop-blur-md"
                style={{
                  boxShadow: `0 0 20px ${option.accentColor}33`,
                }}
              />
            )}
            <Icon 
              className={`w-3.5 h-3.5 relative z-10 transition-transform ${
                isActive ? 'scale-110 text-white' : 'text-slate-400'
              }`}
              style={isActive ? { color: option.accentColor } : {}}
            />
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};
