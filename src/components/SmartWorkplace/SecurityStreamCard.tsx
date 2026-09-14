// src/components/SmartWorkplace/SecurityStreamCard.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Volume2, 
  VolumeX, 
  Maximize2, 
  ChevronRight, 
  Camera, 
  ShieldCheck 
} from 'lucide-react';
import { useSmartWorkplaceStore } from '../../store/useSmartWorkplaceStore';

export const SecurityStreamCard: React.FC = () => {
  const { 
    cameras, 
    activeCameraId, 
    setActiveCameraId, 
    isCameraAudioOn, 
    toggleCameraAudio 
  } = useSmartWorkplaceStore();

  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  const activeCamera = cameras.find((c) => c.id === activeCameraId) || cameras[0];

  return (
    <div className="space-y-4">
      {/* Primary Video Stream Card */}
      <div className="relative rounded-3xl overflow-hidden bg-[#14171E] border border-white/10 shadow-2xl group">
        
        {/* Camera Preview Image with subtle slow zoom animation */}
        <div className="relative h-60 w-full overflow-hidden">
          <motion.img 
            src={activeCamera.imageUrl} 
            alt={activeCamera.name}
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
            className="w-full h-full object-cover brightness-90"
          />

          {/* Vignette & Scanline Overlay for CCTV realism */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/60 pointer-events-none" />
          <div 
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, #000, #000 1px, transparent 1px, transparent 2px)',
              backgroundSize: '100% 2px'
            }}
          />

          {/* Top Overlays: Camera Label & LIVE Badge */}
          <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between z-10">
            {/* Camera Tag */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/60 border border-white/15 backdrop-blur-md text-xs font-semibold text-white">
              <Camera className="w-3.5 h-3.5 text-orange-400" />
              <span>{activeCamera.id.toUpperCase()}</span>
            </div>

            {/* Pulsing Red LIVE Tag */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-rose-500/20 border border-rose-500/40 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
              </span>
              <span className="text-[11px] font-bold text-rose-300 tracking-wider uppercase">
                LIVE
              </span>
            </div>
          </div>

          {/* Floating Controls Overlay on Hover */}
          <div className="absolute top-14 right-3.5 flex flex-col gap-1.5 z-10 opacity-80 group-hover:opacity-100 transition">
            <button 
              onClick={toggleCameraAudio}
              className="w-8 h-8 rounded-xl bg-black/60 hover:bg-black/80 border border-white/15 text-white flex items-center justify-center backdrop-blur-md transition"
              title={isCameraAudioOn ? 'Mute Stream' : 'Enable Stream Audio'}
            >
              {isCameraAudioOn ? <Volume2 className="w-3.5 h-3.5 text-orange-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
            </button>
            <button 
              onClick={() => setIsFullscreenOpen(!isFullscreenOpen)}
              className="w-8 h-8 rounded-xl bg-black/60 hover:bg-black/80 border border-white/15 text-white flex items-center justify-center backdrop-blur-md transition"
              title="Fullscreen CCTV"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bottom Glassmorphic Stream Details Card */}
          <div className="absolute bottom-3 inset-x-3 p-3 rounded-2xl bg-black/65 border border-white/15 backdrop-blur-xl flex items-center justify-between text-white z-10">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-semibold tracking-tight">{activeCamera.name}</h4>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-orange-500/20 text-orange-400 font-medium border border-orange-500/30">
                  {activeCamera.resolution}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {activeCamera.location} • <span className="text-emerald-400 font-medium">{activeCamera.fps} FPS</span>
              </p>
            </div>

            {/* Quick Camera Switcher Buttons */}
            <div className="flex items-center gap-1">
              {cameras.map((cam, idx) => (
                <button
                  key={cam.id}
                  onClick={() => setActiveCameraId(cam.id)}
                  className={`w-7 h-7 rounded-lg text-[10px] font-bold transition flex items-center justify-center ${
                    activeCameraId === cam.id
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                      : 'bg-white/10 hover:bg-white/20 text-slate-300'
                  }`}
                  title={cam.name}
                >
                  C{idx + 1}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Secondary Compact Camera Card (Home / Workplace CCTV) */}
      <div className="p-4 rounded-3xl bg-[#161920]/80 border border-white/10 backdrop-blur-xl shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500/20 to-amber-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white flex items-center gap-1.5">
              <span>Workplace Security Perimeter</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-400">3 Cameras Online • Zurich HQ West Wing</p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
          <span className="hidden sm:inline text-[11px] text-slate-500">All feeds active</span>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </div>

    </div>
  );
};
