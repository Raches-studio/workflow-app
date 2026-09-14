// src/components/SmartWorkplace/MobileDevicePanel.tsx
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  MoreVertical, 
  Power, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  ThumbsUp, 
  ThumbsDown, 
  Share2, 
  Wifi, 
  BatteryCharging 
} from 'lucide-react';
import { useSmartWorkplaceStore } from '../../store/useSmartWorkplaceStore';

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const MobileDevicePanel: React.FC = () => {
  const {
    ambienceMode,
    speakerPower,
    speakerLightLevel,
    isMuted,
    toggleSpeakerPower,
    setSpeakerVolume,
    setSpeakerLightLevel,
    toggleMute,
    isPlaying,
    playbackProgress,
    currentTrack,
    togglePlay,
    setPlaybackProgress,
    nextTrack,
    prevTrack,
    isLiked,
    isDisliked,
    isShuffle,
    isRepeat,
    toggleLike,
    toggleDislike,
    toggleShuffle,
    toggleRepeat,
  } = useSmartWorkplaceStore();

  const track = currentTrack();

  // Progress timer simulation
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setPlaybackProgress((playbackProgress + 1) % track.duration);
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, playbackProgress, track.duration, setPlaybackProgress]);

  // Glow color depending on ambience
  const glowColor = ambienceMode === 'warm' 
    ? 'rgba(249, 115, 22, 0.4)' 
    : ambienceMode === 'neutral' 
    ? 'rgba(245, 158, 11, 0.35)' 
    : 'rgba(56, 189, 248, 0.35)';

  const accentHex = ambienceMode === 'warm' 
    ? '#F97316' 
    : ambienceMode === 'neutral' 
    ? '#F59E0B' 
    : '#38BDF8';

  return (
    <div className="relative mx-auto w-full max-w-[340px] select-none">
      {/* Phone Hardware Shell */}
      <div className="relative rounded-[48px] p-3.5 bg-gradient-to-b from-[#2A2E39] via-[#1E2128] to-[#121418] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border border-white/15">
        
        {/* Antenna Lines & Metal Edge Highlights */}
        <div className="absolute -left-[2px] top-28 w-[3px] h-9 bg-slate-600/60 rounded-l" />
        <div className="absolute -left-[2px] top-40 w-[3px] h-12 bg-slate-600/60 rounded-l" />
        <div className="absolute -left-[2px] top-56 w-[3px] h-12 bg-slate-600/60 rounded-l" />
        <div className="absolute -right-[2px] top-36 w-[3px] h-16 bg-slate-600/60 rounded-r" />

        {/* Screen Bezel Container */}
        <div className="relative overflow-hidden rounded-[38px] bg-[#0E1015] border border-black/80 shadow-inner flex flex-col justify-between min-h-[660px]">
          
          {/* Subtle Ambient Screen Gradient */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-20 transition-all duration-700"
            style={{
              background: `radial-gradient(circle at 50% 30%, ${accentHex} 0%, transparent 65%)`
            }}
          />

          {/* Top Status Bar & Dynamic Island */}
          <div className="relative z-20 px-6 pt-3 pb-1 flex items-center justify-between text-[11px] font-semibold text-slate-300">
            <span>9:41</span>
            
            {/* Dynamic Island */}
            <div className="w-24 h-5 rounded-full bg-black border border-white/10 flex items-center justify-between px-2.5 shadow-md">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700/60" />
              <div className="flex items-center gap-1">
                {isPlaying && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
                <span className="w-2 h-2 rounded-full bg-amber-500/80" />
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Wifi className="w-3 h-3 text-slate-300" />
              <div className="flex items-center gap-0.5">
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Device In-App Header */}
          <div className="relative z-10 px-5 pt-3 flex items-center justify-between">
            <button className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition">
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-center">
              <h2 className="text-xs font-semibold text-white tracking-wide">Main light</h2>
              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" 
                  alt="Maria Z." 
                  className="w-3.5 h-3.5 rounded-full object-cover border border-white/20"
                />
                <span className="text-[10px] text-slate-400 font-medium">Maria Z.</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                  71%
                </span>
              </div>
            </div>

            <button className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition">
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Central Animated Smart Speaker Ring Visualizer */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-2">
            
            {/* Visualizer Container */}
            <div className="relative w-52 h-52 flex items-center justify-center">
              
              {/* Outer Pulsing Ambient Halo */}
              <motion.div
                animate={{
                  scale: speakerPower && isPlaying ? [1, 1.08, 1] : 1,
                  opacity: speakerPower ? [0.6, 0.85, 0.6] : 0.2,
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full blur-2xl"
                style={{ background: glowColor }}
              />

              {/* 3D Smart Speaker Mesh Ring */}
              <div className="relative w-48 h-48 rounded-full p-2.5 bg-gradient-to-tr from-[#121418] via-[#1E222A] to-[#2B303C] border border-white/15 shadow-2xl flex items-center justify-center">
                
                {/* Micro-mesh Texture Pattern */}
                <div 
                  className="absolute inset-1 rounded-full opacity-35"
                  style={{
                    backgroundImage: 'radial-gradient(#ffffff 0.75px, transparent 0.75px)',
                    backgroundSize: '4px 4px',
                  }}
                />

                {/* Inner Glowing Torus Ring */}
                <motion.div 
                  animate={{
                    rotate: speakerPower && isPlaying ? 360 : 0,
                  }}
                  transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                  className="relative w-36 h-36 rounded-full p-1 border-2 transition-colors duration-500 flex items-center justify-center"
                  style={{
                    borderColor: speakerPower ? accentHex : 'rgba(255,255,255,0.1)',
                    boxShadow: speakerPower ? `0 0 25px ${accentHex}88, inset 0 0 15px ${accentHex}55` : 'none',
                  }}
                >
                  {/* Concentric Disc Interior */}
                  <div className="w-full h-full rounded-full bg-[#101319] border border-white/10 flex flex-col items-center justify-center relative overflow-hidden">
                    
                    {/* Audio Waveform Bars when playing */}
                    {speakerPower && isPlaying && (
                      <div className="absolute inset-x-0 bottom-4 flex items-end justify-center gap-1 h-8 opacity-60">
                        {[40, 75, 100, 60, 90, 45, 80].map((h, i) => (
                          <motion.div
                            key={i}
                            animate={{ height: [`${h * 0.3}%`, `${h}%`, `${h * 0.4}%`] }}
                            transition={{ duration: 0.6 + i * 0.1, repeat: Infinity, ease: 'easeInOut' }}
                            className="w-1 rounded-full"
                            style={{ backgroundColor: accentHex }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Central Brand Mark / Audio Crest */}
                    <div 
                      className="text-2xl font-black tracking-tighter select-none transition-colors duration-500"
                      style={{ 
                        color: speakerPower ? accentHex : '#64748B',
                        textShadow: speakerPower ? `0 0 12px ${accentHex}` : 'none'
                      }}
                    >
                      G
                    </div>
                    <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mt-0.5">
                      {speakerPower ? (isMuted ? 'Muted' : 'Acoustic') : 'Off'}
                    </span>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Quick Slider & Power Controls Pill */}
            <div className="w-full max-w-[260px] mt-3 flex items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              {/* Power Toggle */}
              <button 
                onClick={toggleSpeakerPower}
                title="Toggle Speaker / Light Power"
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                  speakerPower 
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-[0_0_12px_rgba(249,115,22,0.3)]' 
                    : 'bg-white/5 text-slate-500 border border-white/5 hover:text-slate-300'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
              </button>

              {/* Slider Control */}
              <div className="flex-1 px-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium mb-1">
                  <span>Level</span>
                  <span className="font-semibold text-white">{speakerLightLevel}%</span>
                </div>
                <input 
                  type="range" 
                  min={0} 
                  max={100} 
                  value={speakerLightLevel}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setSpeakerLightLevel(val);
                    setSpeakerVolume(val);
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>

              {/* Mute Button */}
              <button 
                onClick={toggleMute}
                title="Toggle Mute"
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${
                  isMuted ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Bottom Interactive Music Player Card */}
          <div className="relative z-10 m-2.5 p-3 rounded-2xl bg-[#14171E]/90 border border-white/10 backdrop-blur-xl shadow-xl">
            
            {/* Song Info & Thumbnail */}
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-white/10 shrink-0">
                  <img 
                    src={track.coverUrl} 
                    alt={track.title} 
                    className="w-full h-full object-cover"
                  />
                  {isPlaying && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="text-xs font-semibold text-white truncate leading-tight">
                    {track.title}
                  </h3>
                  <p className="text-[10px] text-slate-400 truncate">
                    {track.artist}
                  </p>
                </div>
              </div>

              {/* Social / Feedback buttons */}
              <div className="flex items-center gap-1">
                <button 
                  onClick={toggleLike}
                  className={`p-1 rounded-md transition ${isLiked ? 'text-orange-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <ThumbsUp className="w-3 h-3" />
                </button>
                <button 
                  onClick={toggleDislike}
                  className={`p-1 rounded-md transition ${isDisliked ? 'text-rose-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <ThumbsDown className="w-3 h-3" />
                </button>
                <button className="p-1 rounded-md text-slate-500 hover:text-slate-300">
                  <Share2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Scrubbable Progress Bar */}
            <div className="mb-2">
              <div className="relative w-full h-1 bg-slate-800 rounded-full overflow-hidden cursor-pointer">
                <motion.div 
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                  style={{ width: `${(playbackProgress / track.duration) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-1">
                <span>{formatTime(playbackProgress)}</span>
                <span>{formatTime(track.duration)}</span>
              </div>
            </div>

            {/* Playback Controls Strip */}
            <div className="flex items-center justify-between px-1">
              <button 
                onClick={toggleShuffle}
                className={`transition ${isShuffle ? 'text-orange-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Shuffle className="w-3 h-3" />
              </button>

              <button 
                onClick={prevTrack}
                className="text-slate-400 hover:text-white transition"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>

              <button 
                onClick={togglePlay}
                className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:bg-slate-200 transition active:scale-95"
              >
                {isPlaying ? (
                  <Pause className="w-3.5 h-3.5 fill-black" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-black translate-x-0.5" />
                )}
              </button>

              <button 
                onClick={nextTrack}
                className="text-slate-400 hover:text-white transition"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>

              <button 
                onClick={toggleRepeat}
                className={`transition ${isRepeat ? 'text-orange-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Repeat className="w-3 h-3" />
              </button>
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
