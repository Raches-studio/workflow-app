// src/components/SmartWorkplace/SecurityStreamCard.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  ExternalLink, 
  MonitorUp,
  X,
  Copy,
  Check,
  Plus,
  Link2,
  Share2
} from 'lucide-react';
import { useSmartWorkplaceStore } from '../../store/useSmartWorkplaceStore';
import { useToastStore } from '../../store/useToastStore';
import { useAuthStore } from '../../store/useAuthStore';

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
    setMeetingModalOpen,
    addMeetingRoom
  } = useSmartWorkplaceStore();

  const { showSuccess } = useToastStore();
  const { profile } = useAuthStore();
  const userRole = profile?.role || 'admin';
  const canSchedule = userRole === 'admin' || userRole === 'manager';

  const [copiedRoomId, setCopiedRoomId] = useState<string | null>(null);
  const [isAddSyncOpen, setIsAddSyncOpen] = useState(false);

  // New sync form state
  const [syncTitle, setSyncTitle] = useState('');
  const [syncUrl, setSyncUrl] = useState('');
  const [syncCategory, setSyncCategory] = useState('Studio Alpha');
  const [syncTopic, setSyncTopic] = useState('');
  const [syncTime, setSyncTime] = useState('Today, 3:00 PM');

  const activeRoom = meetingRooms.find((r) => r.id === activeMeetingId) || meetingRooms[0];
  const meetingUrl = activeRoom.meetingUrl || 'https://meet.google.com/qmv-rtza-jkh';

  // Copy meeting link to clipboard
  const handleCopyLink = (url: string, roomId: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedRoomId(roomId);
      showSuccess('Invite Link Copied! 📋', 'Meeting URL copied to your clipboard.');
      setTimeout(() => setCopiedRoomId(null), 2500);
    }
  };

  // Direct join in new tab
  const handleJoinMeeting = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Submit custom sync / meeting link
  const handleCreateSync = (e: React.FormEvent) => {
    e.preventDefault();
    if (!syncTitle.trim() || !syncUrl.trim()) return;

    let detectedPlatform: 'google_meet' | 'zoom' | 'custom' = 'custom';
    if (syncUrl.includes('meet.google.com')) detectedPlatform = 'google_meet';
    else if (syncUrl.includes('zoom.us')) detectedPlatform = 'zoom';

    addMeetingRoom({
      title: syncTitle.trim(),
      category: syncCategory,
      topic: syncTopic.trim() || 'Scheduled Project Standup',
      meetingUrl: syncUrl.trim(),
      platform: detectedPlatform,
      scheduledTime: syncTime,
    });

    setSyncTitle('');
    setSyncUrl('');
    setSyncTopic('');
    setIsAddSyncOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Primary Video Conference Card */}
      <div className="relative rounded-3xl overflow-hidden bg-[#14171E] border border-white/10 shadow-2xl group">
        
        {/* Meeting Preview Screen */}
        <div className="relative h-64 w-full overflow-hidden">
          <motion.img 
            src={activeRoom.previewImageUrl} 
            alt={activeRoom.title}
            animate={{ scale: [1, 1.025, 1] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
            className="w-full h-full object-cover brightness-90"
          />

          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/60 pointer-events-none" />

          {/* Top Overlays: Room Tag, Dynamic Platform Badge, & LIVE Badge */}
          <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between z-10 gap-2">
            
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Category / Room Tag */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/60 border border-white/15 backdrop-blur-md text-xs font-semibold text-white">
                <Video className="w-3.5 h-3.5 text-orange-400" />
                <span>{activeRoom.category}</span>
              </div>

              {/* Dynamic Google Meet / Zoom Platform Badge */}
              {activeRoom.platform === 'google_meet' ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 backdrop-blur-md text-[11px] font-bold text-emerald-300 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Google Meet</span>
                </div>
              ) : activeRoom.platform === 'zoom' ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-500/20 border border-sky-500/40 backdrop-blur-md text-[11px] font-bold text-sky-300 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                  <span>Zoom Video</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-500/20 border border-orange-500/40 backdrop-blur-md text-[11px] font-bold text-orange-300">
                  <Video className="w-3 h-3 text-orange-400" />
                  <span>Live Sync</span>
                </div>
              )}
            </div>

            {/* Pulsing Red LIVE Tag */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-rose-500/20 border border-rose-500/40 backdrop-blur-md shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
              </span>
              <span className="text-[11px] font-bold text-rose-300 tracking-wider uppercase">
                {activeRoom.status === 'live' ? 'LIVE CALL' : 'UPCOMING'}
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
          <div className="absolute bottom-3 inset-x-3 p-3.5 rounded-2xl bg-black/75 border border-white/15 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white z-10">
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
              
              {/* Participant Avatars & Duration */}
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
                <span className="text-[10px] text-slate-400 font-medium truncate">
                  {activeRoom.participantCount} in room • <span className="text-emerald-400 font-mono">{activeRoom.duration}</span>
                </span>
              </div>
            </div>

            {/* Action Buttons: Copy Link & Join Meeting */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Copy Invite Link Button */}
              <button
                onClick={() => handleCopyLink(meetingUrl, activeRoom.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15 text-xs font-semibold transition active:scale-95"
                title="Copy Meeting Invite Link"
              >
                {copiedRoomId === activeRoom.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span className="hidden sm:inline">Copy Link</span>
                  </>
                )}
              </button>

              {/* Join Meeting Direct Button (Opens Real URL in new tab) */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleJoinMeeting(meetingUrl)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white font-semibold text-xs shadow-md shadow-orange-500/30 transition border border-orange-400/30 shrink-0"
                title={`Open in ${activeRoom.platform === 'zoom' ? 'Zoom' : 'Google Meet'}`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Join Call</span>
              </motion.button>
            </div>
          </div>

        </div>
      </div>

      {/* Secondary Room Selector & Manager/Admin Schedule Option */}
      <div className="p-4 rounded-3xl bg-[#161920]/80 border border-white/10 backdrop-blur-xl shadow-xl">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Meeting Sync Rooms
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              ({meetingRooms.length} active)
            </span>
          </div>

          {canSchedule && (
            <button
              onClick={() => setIsAddSyncOpen(!isAddSyncOpen)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/30 text-[11px] font-semibold transition"
            >
              <Plus className="w-3 h-3" />
              <span>Schedule Sync</span>
            </button>
          )}
        </div>

        {/* Room Switcher Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {meetingRooms.map((room) => {
            const isSelected = activeMeetingId === room.id;
            const roomUrl = room.meetingUrl || 'https://meet.google.com/qmv-rtza-jkh';

            return (
              <div
                key={room.id}
                onClick={() => setActiveMeetingId(room.id)}
                className={`p-2.5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-orange-500/15 border-orange-500/40 text-white shadow-sm ring-1 ring-orange-500/20'
                    : 'bg-white/[0.02] border-white/5 hover:bg-white/10 text-slate-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      {room.category}
                    </span>
                    {room.platform === 'google_meet' ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400" title="Google Meet" />
                    ) : room.platform === 'zoom' ? (
                      <span className="w-2 h-2 rounded-full bg-sky-400" title="Zoom" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-orange-400" title="Sync" />
                    )}
                  </div>
                  <div className="text-xs font-semibold truncate leading-tight text-slate-200">
                    {room.title}
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {room.participants.length} joined
                  </span>
                  
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleCopyLink(roomUrl, room.id)}
                      className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
                      title="Copy invite URL"
                    >
                      {copiedRoomId === room.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      onClick={() => handleJoinMeeting(roomUrl)}
                      className="p-1 rounded-lg hover:bg-white/10 text-orange-400 hover:text-orange-300 transition"
                      title="Launch meeting tab"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Manager / Admin Add Custom Meeting Link Form */}
        <AnimatePresence>
          {isAddSyncOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-3"
            >
              <form 
                onSubmit={handleCreateSync}
                className="p-3.5 rounded-2xl bg-black/40 border border-white/15 space-y-3"
              >
                <div className="flex items-center justify-between pb-1 border-b border-white/10">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                    <Link2 className="w-3.5 h-3.5 text-orange-400" />
                    <span>Attach Custom Google Meet / Zoom Sync</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setIsAddSyncOpen(false)}
                    className="text-slate-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
                      Meeting Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Client Architecture Sync"
                      value={syncTitle}
                      onChange={(e) => setSyncTitle(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
                      Room Category
                    </label>
                    <select
                      value={syncCategory}
                      onChange={(e) => setSyncCategory(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/15 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      <option value="Studio Alpha">Studio Alpha</option>
                      <option value="Executive Suite">Executive Suite</option>
                      <option value="Dev Lounge">Dev Lounge</option>
                      <option value="Client Portal">Client Portal</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
                    Meeting URL (Google Meet / Zoom / Custom)
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      required
                      placeholder="https://meet.google.com/abc-defg-hij or https://zoom.us/j/..."
                      value={syncUrl}
                      onChange={(e) => setSyncUrl(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                    <Share2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
                      Agenda / Topic
                    </label>
                    <input
                      type="text"
                      placeholder="Sprint deliverables check-in"
                      value={syncTopic}
                      onChange={(e) => setSyncTopic(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
                      Scheduled Time
                    </label>
                    <input
                      type="text"
                      placeholder="Today, 3:30 PM"
                      value={syncTime}
                      onChange={(e) => setSyncTime(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddSyncOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-md transition"
                  >
                    Create Meeting Sync
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Interactive Joined Meeting In-App Modal Simulation */}
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
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold">{activeRoom.title}</h3>
                      {activeRoom.platform === 'google_meet' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Google Meet
                        </span>
                      ) : activeRoom.platform === 'zoom' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          Zoom Video
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-400">{activeRoom.topic}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyLink(meetingUrl, activeRoom.id)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs"
                    title="Copy Invite Link"
                  >
                    {copiedRoomId === activeRoom.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">Copy Invite</span>
                  </button>

                  <button
                    onClick={() => setMeetingModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
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

              {/* Live Meeting Direct URL Banner */}
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between mb-3 text-xs">
                <div className="flex items-center gap-2 truncate pr-2">
                  <Link2 className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <span className="text-slate-400 font-mono text-[11px] truncate">
                    {meetingUrl}
                  </span>
                </div>
                <button
                  onClick={() => handleJoinMeeting(meetingUrl)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition shrink-0"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open in {activeRoom.platform === 'zoom' ? 'Zoom' : 'Meet'}</span>
                </button>
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
