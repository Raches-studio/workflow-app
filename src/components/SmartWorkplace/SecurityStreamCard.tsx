// src/components/SmartWorkplace/SecurityStreamCard.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneCall, 
  MonitorUp,
  X
} from 'lucide-react';
import { useSmartWorkplaceStore } from '../../store/useSmartWorkplaceStore';

export const SecurityStreamCard: React.FC = () => {
  const { 
    meetingRooms, 
    activeMeetingId, 
    setActiveMeetingId,
    isMicMuted,
    isVideoOn,
    toggleMic,
    toggleVideo,
    isMeetingModalOpen,
    setMeetingModalOpen
  } = useSmartWorkplaceStore();

  const activeRoom = meetingRooms.find((r) => r.id === activeMeetingId) || meetingRooms[0];

  return (
    <div className="space-y-4">
      {/* Primary Video Conference Card */}
      <div className="relative rounded-3xl overflow-hidden bg-[#14171E] border border-white/10 shadow-2xl group">
        
        {/* Meeting Preview Screen */}
        <div className="relative h-60 w-full overflow-hidden">
          <motion.img 
            src={activeRoom.previewImageUrl} 
            alt={activeRoom.title}
            animate={{ scale: [1, 1.025, 1] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
            className="w-full h-full object-cover brightness-90"
          />

          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/60 pointer-events-none" />

          {/* Top Overlays: Room Tag & LIVE Badge */}
          <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between z-10">
            {/* Category / Room Tag */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/60 border border-white/15 backdrop-blur-md text-xs font-semibold text-white">
              <Video className="w-3.5 h-3.5 text-orange-400" />
              <span>{activeRoom.category}</span>
            </div>

            {/* Pulsing Red/Emerald LIVE Tag */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-rose-500/20 border border-rose-500/40 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
              </span>
              <span className="text-[11px] font-bold text-rose-300 tracking-wider uppercase">
                LIVE CALL
              </span>
            </div>
          </div>

          {/* Floating Controls Overlay (Mic & Camera) */}
          <div className="absolute top-14 right-3.5 flex flex-col gap-1.5 z-10">
            <button 
              onClick={toggleMic}
              className={`w-8 h-8 rounded-xl border backdrop-blur-md flex items-center justify-center transition ${
                isMicMuted 
                  ? 'bg-rose-500/30 text-rose-400 border-rose-500/40' 
                  : 'bg-black/60 hover:bg-black/80 text-white border-white/15'
              }`}
              title={isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
            >
              {isMicMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>

            <button 
              onClick={toggleVideo}
              className={`w-8 h-8 rounded-xl border backdrop-blur-md flex items-center justify-center transition ${
                !isVideoOn 
                  ? 'bg-rose-500/30 text-rose-400 border-rose-500/40' 
                  : 'bg-black/60 hover:bg-black/80 text-white border-white/15'
              }`}
              title={isVideoOn ? 'Turn Camera Off' : 'Turn Camera On'}
            >
              {isVideoOn ? <Video className="w-3.5 h-3.5 text-emerald-400" /> : <VideoOff className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Bottom Glassmorphic Stream Details Card */}
          <div className="absolute bottom-3 inset-x-3 p-3.5 rounded-2xl bg-black/70 border border-white/15 backdrop-blur-xl flex items-center justify-between text-white z-10">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-semibold tracking-tight truncate">{activeRoom.title}</h4>
                {activeRoom.isScreenSharing && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-sky-500/20 text-sky-300 font-medium border border-sky-500/30 flex items-center gap-1 shrink-0">
                    <MonitorUp className="w-2.5 h-2.5" />
                    Sharing
                  </span>
                )}
              </div>
              
              {/* Participant Avatars & Timer */}
              <div className="flex items-center gap-2 mt-1">
                <div className="flex -space-x-1.5 overflow-hidden">
                  {activeRoom.participants.map((p, i) => (
                    <img
                      key={i}
                      src={p.avatarUrl}
                      alt={p.name}
                      title={p.name}
                      className="inline-block h-5 w-5 rounded-full ring-1 ring-black object-cover"
                    />
                  ))}
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {activeRoom.participantCount} in room • <span className="text-emerald-400 font-mono">{activeRoom.duration}</span>
                </span>
              </div>
            </div>

            {/* Join Room Action Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMeetingModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white font-semibold text-xs shadow-md shadow-orange-500/30 transition shrink-0"
            >
              <PhoneCall className="w-3 h-3" />
              <span>Join</span>
            </motion.button>
          </div>

        </div>
      </div>

      {/* Secondary Room Selector & Upcoming Sync */}
      <div className="p-4 rounded-3xl bg-[#161920]/80 border border-white/10 backdrop-blur-xl shadow-xl">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Active Meeting Rooms
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {meetingRooms.length} Available
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {meetingRooms.map((room) => {
            const isSelected = activeMeetingId === room.id;
            return (
              <button
                key={room.id}
                onClick={() => setActiveMeetingId(room.id)}
                className={`p-2 rounded-xl text-left border transition ${
                  isSelected
                    ? 'bg-orange-500/15 border-orange-500/40 text-white shadow-sm'
                    : 'bg-white/[0.02] border-white/5 hover:bg-white/10 text-slate-400'
                }`}
              >
                <div className="text-[11px] font-semibold truncate leading-tight">{room.title}</div>
                <div className="text-[9px] text-slate-400 mt-0.5 flex items-center justify-between">
                  <span>{room.category}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Joined Meeting Modal */}
      <AnimatePresence>
        {isMeetingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl rounded-3xl p-6 bg-[#161920] border border-white/15 shadow-2xl text-white overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">{activeRoom.title}</h3>
                    <p className="text-xs text-slate-400">{activeRoom.topic}</p>
                  </div>
                </div>

                <button
                  onClick={() => setMeetingModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Video Grid Simulation */}
              <div className="py-4">
                <div className="grid grid-cols-2 gap-3 aspect-video bg-black/60 rounded-2xl p-3 border border-white/10 relative overflow-hidden">
                  {/* Participant 1 */}
                  <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-white/10 flex items-center justify-center">
                    <img 
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80" 
                      alt="Maria Z." 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-[10px] font-semibold text-white">
                      Maria Zakharova (You)
                    </div>
                  </div>

                  {/* Participant 2 */}
                  <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-white/10 flex items-center justify-center">
                    <img 
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80" 
                      alt="David S." 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-[10px] font-semibold text-white flex items-center gap-1.5">
                      <span>David Sterling</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom In-Call Control Strip */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={toggleMic}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                      isMicMuted ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-white/10 text-white'
                    }`}
                  >
                    {isMicMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    <span>{isMicMuted ? 'Muted' : 'Mic On'}</span>
                  </button>

                  <button 
                    onClick={toggleVideo}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                      !isVideoOn ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-white/10 text-white'
                    }`}
                  >
                    {isVideoOn ? <Video className="w-3.5 h-3.5 text-emerald-400" /> : <VideoOff className="w-3.5 h-3.5" />}
                    <span>{isVideoOn ? 'Camera On' : 'Camera Off'}</span>
                  </button>
                </div>

                <button
                  onClick={() => setMeetingModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition"
                >
                  Leave Meeting
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
