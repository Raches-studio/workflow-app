// src/components/SmartWorkplace/MeetingsView.tsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, 
  Plus, 
  ExternalLink, 
  Copy, 
  Check, 
  Link2, 
  Clock, 
  X, 
  Share2, 
  Sparkles,
  PhoneCall
} from 'lucide-react';
import { useSmartWorkplaceStore } from '../../store/useSmartWorkplaceStore';
import { useToastStore } from '../../store/useToastStore';

export const MeetingsView: React.FC = () => {
  const { 
    meetingRooms, 
    addMeetingRoom, 
    setActiveMeetingId, 
    setMeetingModalOpen 
  } = useSmartWorkplaceStore();

  const { showSuccess } = useToastStore();

  const [platformFilter, setPlatformFilter] = useState<'all' | 'google_meet' | 'zoom' | 'live'>('all');
  const [copiedRoomId, setCopiedRoomId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Meeting Form State
  const [title, setTitle] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [platform, setPlatform] = useState<'google_meet' | 'zoom' | 'custom'>('google_meet');
  const [category, setCategory] = useState('Studio Alpha');
  const [scheduledTime, setScheduledTime] = useState('Today, 2:30 PM');
  const [topic, setTopic] = useState('');

  // Copy meeting URL to clipboard
  const handleCopyLink = (url: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedRoomId(id);
      showSuccess('Invite Link Copied! 📋', 'Meeting URL copied to clipboard.');
      setTimeout(() => setCopiedRoomId(null), 2500);
    }
  };

  // Direct join in new tab
  const handleJoinCall = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Submit custom meeting
  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !meetingUrl.trim()) return;

    let detectedPlatform = platform;
    if (meetingUrl.includes('meet.google.com')) detectedPlatform = 'google_meet';
    else if (meetingUrl.includes('zoom.us')) detectedPlatform = 'zoom';

    addMeetingRoom({
      title: title.trim(),
      category,
      topic: topic.trim() || 'Team Project Discussion',
      meetingUrl: meetingUrl.trim(),
      platform: detectedPlatform,
      scheduledTime,
    });

    setTitle('');
    setMeetingUrl('');
    setTopic('');
    setIsAddModalOpen(false);
  };

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return meetingRooms.filter((room) => {
      if (platformFilter === 'live') return room.status === 'live';
      if (platformFilter === 'google_meet') return room.platform === 'google_meet';
      if (platformFilter === 'zoom') return room.platform === 'zoom';
      return true;
    });
  }, [meetingRooms, platformFilter]);

  const liveRoomsCount = meetingRooms.filter((r) => r.status === 'live').length;
  const meetCount = meetingRooms.filter((r) => r.platform === 'google_meet').length;
  const zoomCount = meetingRooms.filter((r) => r.platform === 'zoom').length;

  return (
    <div className="space-y-6 select-none">
      
      {/* Top Header Command Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-[#161920]/80 border border-white/10 backdrop-blur-xl shadow-2xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500/20 to-emerald-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shadow-inner">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Calls & Meetings Command Center</span>
                {liveRoomsCount > 0 && (
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    {liveRoomsCount} Live Now
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Launch, schedule, and join Google Meet and Zoom conferences with one-click access
              </p>
            </div>
          </div>
        </div>

        {/* Action Button Strip */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white text-xs font-semibold shadow-md shadow-orange-500/30 transition active:scale-95 border border-orange-400/30"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Call Link</span>
          </button>
        </div>
      </div>

      {/* Platform & Status Filter Tabs */}
      <div className="flex items-center justify-between gap-4 pb-2 overflow-x-auto border-b border-white/5">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPlatformFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              platformFilter === 'all'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white bg-white/[0.02]'
            }`}
          >
            All Calls ({meetingRooms.length})
          </button>

          <button
            onClick={() => setPlatformFilter('live')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              platformFilter === 'live'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white bg-white/[0.02]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>Live Calls ({liveRoomsCount})</span>
          </button>

          <button
            onClick={() => setPlatformFilter('google_meet')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              platformFilter === 'google_meet'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white bg-white/[0.02]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Google Meet ({meetCount})</span>
          </button>

          <button
            onClick={() => setPlatformFilter('zoom')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              platformFilter === 'zoom'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white bg-white/[0.02]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span>Zoom Video ({zoomCount})</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-orange-400" />
          <span>Active Grid Synchronization</span>
        </div>
      </div>

      {/* Grid of Meeting Room Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence mode="popLayout">
          {filteredRooms.map((room) => {
            const url = room.meetingUrl || 'https://meet.google.com/qmv-rtza-jkh';
            const isGoogleMeet = room.platform === 'google_meet';
            const isZoom = room.platform === 'zoom';
            const isLive = room.status === 'live';

            return (
              <motion.div
                key={room.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative rounded-3xl overflow-hidden bg-[#161920]/80 border border-white/10 backdrop-blur-xl shadow-2xl hover:border-white/20 transition-all group flex flex-col justify-between"
              >
                {/* Visual Preview Header */}
                <div className="relative h-44 w-full overflow-hidden">
                  <img
                    src={room.previewImageUrl}
                    alt={room.title}
                    className="w-full h-full object-cover brightness-90 group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#161920] via-black/40 to-black/60 pointer-events-none" />

                  {/* Badges on Top */}
                  <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between gap-2 z-10">
                    {/* Platform Badge */}
                    {isGoogleMeet ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/30 border border-emerald-500/40 backdrop-blur-md text-[11px] font-bold text-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Google Meet
                      </span>
                    ) : isZoom ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-500/30 border border-sky-500/40 backdrop-blur-md text-[11px] font-bold text-sky-200">
                        <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                        Zoom Video
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-500/30 border border-orange-500/40 backdrop-blur-md text-[11px] font-bold text-orange-200">
                        WorkHub Sync
                      </span>
                    )}

                    {/* Status Pill */}
                    {isLive ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/30 border border-rose-500/40 backdrop-blur-md text-[11px] font-bold text-rose-200">
                        <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                        LIVE CALL
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/60 border border-white/15 backdrop-blur-md text-[10px] font-semibold text-slate-300">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {room.scheduledTime || 'Upcoming'}
                      </span>
                    )}
                  </div>

                  {/* Room Category */}
                  <div className="absolute bottom-3 left-3.5 z-10 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-300 bg-black/60 px-2 py-0.5 rounded-lg border border-white/10 backdrop-blur-md">
                    <Video className="w-3 h-3 text-orange-400" />
                    <span>{room.category}</span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                      {room.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                      {room.topic}
                    </p>

                    {/* URL Pill Display */}
                    <div className="mt-3 p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs text-slate-300">
                      <div className="flex items-center gap-1.5 min-w-0 pr-2">
                        <Link2 className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                        <span className="font-mono text-[11px] truncate text-slate-400">
                          {url}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopyLink(url, room.id)}
                        className="text-slate-400 hover:text-white p-1 rounded transition"
                        title="Copy link"
                      >
                        {copiedRoomId === room.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Participants & In-Room Counter */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {room.participants.map((p, i) => (
                          <img
                            key={i}
                            src={p.avatarUrl}
                            alt={p.name}
                            title={p.name}
                            className="inline-block h-6 w-6 rounded-full ring-2 ring-[#161920] object-cover"
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {room.participantCount} in room
                      </span>
                    </div>

                    <span className="text-emerald-400 font-mono text-[11px]">
                      {room.duration}
                    </span>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-2 flex items-center gap-2">
                    {/* Copy Link Button */}
                    <button
                      onClick={() => handleCopyLink(url, room.id)}
                      className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-semibold transition flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      {copiedRoomId === room.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-300 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    {/* Join Call Direct Button */}
                    <button
                      onClick={() => handleJoinCall(url)}
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white text-xs font-bold shadow-md shadow-orange-500/30 transition flex items-center justify-center gap-1.5 active:scale-95 border border-orange-400/30"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Join Call</span>
                    </button>

                    {/* In-App Simulation Preview */}
                    <button
                      onClick={() => {
                        setActiveMeetingId(room.id);
                        setMeetingModalOpen(true);
                      }}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition"
                      title="Preview In-App Meeting Screen"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredRooms.length === 0 && (
        <div className="p-12 text-center rounded-3xl bg-white/[0.02] border border-white/5 text-slate-500 text-sm">
          No calls found matching this platform filter.
        </div>
      )}

      {/* Modal: + Add Call Link */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-3xl p-6 bg-[#161920] border border-white/15 shadow-2xl text-white overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">Add New Call & Meeting Link</h3>
                    <p className="text-xs text-slate-400">Attach Google Meet or Zoom URL</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateMeeting} className="py-4 space-y-3.5">
                {/* Platform Selector */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Platform
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setPlatform('google_meet');
                        if (!meetingUrl) setMeetingUrl('https://meet.google.com/qmv-rtza-jkh');
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${
                        platform === 'google_meet'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-white/5 border-white/10 text-slate-400'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>Google Meet</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPlatform('zoom');
                        if (!meetingUrl) setMeetingUrl('https://zoom.us/j/8492048591');
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${
                        platform === 'zoom'
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                          : 'bg-white/5 border-white/10 text-slate-400'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-sky-400" />
                      <span>Zoom Video</span>
                    </button>
                  </div>
                </div>

                {/* Meeting Title */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Meeting Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Q3 Architecture Sync & Demo"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                {/* Custom URL */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Meeting URL (Google Meet / Zoom)
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      required
                      placeholder="https://meet.google.com/... or https://zoom.us/j/..."
                      value={meetingUrl}
                      onChange={(e) => setMeetingUrl(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                    <Share2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                  </div>
                </div>

                {/* Room Category & Scheduled Time */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Room Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      <option value="Studio Alpha">Studio Alpha</option>
                      <option value="Executive Suite">Executive Suite</option>
                      <option value="Dev Lounge">Dev Lounge</option>
                      <option value="Client Portal">Client Portal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Scheduled Time
                    </label>
                    <input
                      type="text"
                      placeholder="Today, 3:30 PM"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {/* Agenda / Topic */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Agenda / Topic
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Short agenda for participants..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-md transition"
                  >
                    Save & Create Call
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
