// src/components/SmartWorkplace/CalendarScheduleView.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Video, 
  Zap, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  ExternalLink, 
  Copy, 
  Check, 
  X,
  Link2,
  Bell
} from 'lucide-react';
import { useSmartWorkplaceStore } from '../../store/useSmartWorkplaceStore';
import { useToastStore } from '../../store/useToastStore';
import { CalendarEvent } from './mockSmartHubData';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const CalendarScheduleView: React.FC = () => {
  const { 
    calendarEvents, 
    calendarViewMode, 
    setCalendarViewMode,
    addCalendarEvent,
    markCalendarEventCompleted,
    launchFocusForCalendarEvent,
    isSprintRunning
  } = useSmartWorkplaceStore();

  const { showSuccess, showReminder } = useToastStore();

  const [copiedEventId, setCopiedEventId] = useState<string | null>(null);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // New Event Form State
  const [newType, setNewType] = useState<'meeting' | 'focus_block' | 'deadline'>('meeting');
  const [newTitle, setNewTitle] = useState('');
  const [newDayOfWeek, setNewDayOfWeek] = useState<number>(1);
  const [newStartTime, setNewStartTime] = useState('11:00 AM');
  const [newEndTime, setNewEndTime] = useState('11:45 AM');
  const [newDuration, setNewDuration] = useState(45);
  const [newUrl, setNewUrl] = useState('https://meet.google.com/new-sync-room');
  const [newProject, setNewProject] = useState('Brand Identity & Web Portal');
  const [newDesc, setNewDesc] = useState('');

  // Copy link handler
  const handleCopyLink = (url: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedEventId(id);
      showSuccess('Invite Link Copied! 📋', 'Meeting URL copied to clipboard.');
      setTimeout(() => setCopiedEventId(null), 2500);
    }
  };

  // Join call handler
  const handleJoinCall = (url?: string) => {
    const targetUrl = url || 'https://meet.google.com/qmv-rtza-jkh';
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  // Trigger simulated 5-minute reminder alert for testing
  const handleSimulateMeetingAlert = () => {
    showReminder({
      title: 'Sprint Architecture Sync in 5m',
      message: 'Join David Sterling and the engineering team on Google Meet.',
      category: 'meeting',
      platform: 'google_meet',
      meetingUrl: 'https://meet.google.com/qmv-rtza-jkh',
      onJoin: () => handleJoinCall('https://meet.google.com/qmv-rtza-jkh'),
      onSnooze: () => showSuccess('Reminder Snoozed ⏰', 'We will alert you again in 5 minutes.'),
    });
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    let platform: 'google_meet' | 'zoom' | 'custom' | undefined = undefined;
    if (newType === 'meeting') {
      if (newUrl.includes('meet.google.com')) platform = 'google_meet';
      else if (newUrl.includes('zoom.us')) platform = 'zoom';
      else platform = 'custom';
    }

    addCalendarEvent({
      title: newTitle.trim(),
      type: newType,
      date: newDayOfWeek === 1 ? 'Today' : newDayOfWeek === 2 ? 'Tomorrow' : DAYS_OF_WEEK[newDayOfWeek - 1] || 'Upcoming',
      dayOfWeek: newDayOfWeek,
      startTime: newStartTime,
      endTime: newEndTime,
      durationMinutes: newDuration,
      platform,
      meetingUrl: newType === 'meeting' ? newUrl.trim() : undefined,
      projectName: newProject,
      description: newDesc.trim(),
      isCompleted: false,
    });

    setNewTitle('');
    setNewDesc('');
    setIsAddEventModalOpen(false);
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* Top Command Center Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-[#161920]/80 border border-white/10 backdrop-blur-xl shadow-2xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shadow-inner">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Productivity Command Center & Calendar</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase">
                  Live
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Unified schedule for Google Meet/Zoom syncs, project deadlines, and Focus Sprint blocks
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Switcher & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          
          {/* Quick Demo: Trigger 5m Meeting Alert */}
          <button
            onClick={handleSimulateMeetingAlert}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-semibold transition active:scale-95"
            title="Simulate 5-minute pre-meeting reminder notification"
          >
            <Bell className="w-3.5 h-3.5 text-sky-400 animate-bounce" />
            <span>Test 5m Reminder</span>
          </button>

          {/* Week / Month Switcher Tabs */}
          <div className="flex items-center p-1 rounded-2xl bg-black/40 border border-white/10">
            <button
              onClick={() => setCalendarViewMode('week')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                calendarViewMode === 'week'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Week View
            </button>
            <button
              onClick={() => setCalendarViewMode('month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                calendarViewMode === 'month'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Month View
            </button>
          </div>

          {/* Add Event Action */}
          <button
            onClick={() => setIsAddEventModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white text-xs font-semibold shadow-md shadow-orange-500/30 transition active:scale-95 border border-orange-400/30"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Slot</span>
          </button>
        </div>
      </div>

      {/* View Switcher: Weekly vs Monthly */}
      {calendarViewMode === 'week' ? (
        /* WEEKLY DETAILED SCHEDULE GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3.5">
          {DAYS_OF_WEEK.map((dayName, idx) => {
            const dayNum = idx + 1;
            const isToday = dayNum === 1; // Monday represents today
            const dayEvents = calendarEvents.filter((e) => e.dayOfWeek === dayNum);

            return (
              <div 
                key={dayName}
                className={`flex flex-col min-h-[520px] rounded-3xl p-3.5 border transition-all duration-300 ${
                  isToday
                    ? 'bg-[#181C24] border-orange-500/40 shadow-xl shadow-orange-500/5 ring-1 ring-orange-500/20'
                    : 'bg-[#14171E]/80 border-white/10 hover:border-white/20'
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {dayName.substring(0, 3)}
                    </div>
                    <div className="text-sm font-extrabold font-mono text-white mt-0.5">
                      {14 + idx} <span className="text-[10px] text-slate-500 font-normal">Sep</span>
                    </div>
                  </div>

                  {isToday ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-orange-500 text-white uppercase tracking-wider shadow-sm shadow-orange-500/30">
                      Today
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono">
                      {dayEvents.length} slots
                    </span>
                  )}
                </div>

                {/* Day Events Container */}
                <div className="flex-1 space-y-2.5 overflow-y-auto">
                  {dayEvents.map((event) => {
                    const isMeeting = event.type === 'meeting';
                    const isFocus = event.type === 'focus_block';

                    return (
                      <motion.div
                        key={event.id}
                        whileHover={{ y: -2 }}
                        onClick={() => {
                          if (isFocus) {
                            launchFocusForCalendarEvent(event);
                          } else {
                            setSelectedEvent(event);
                          }
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isFocus
                            ? event.isCompleted
                              ? 'bg-emerald-500/[0.06] border-emerald-500/30 opacity-75'
                              : 'bg-gradient-to-br from-orange-500/15 via-orange-500/5 to-transparent border-orange-500/35 hover:border-orange-500/60 shadow-sm'
                            : isMeeting
                            ? 'bg-sky-500/[0.08] border-sky-500/30 hover:border-sky-500/50'
                            : 'bg-amber-500/[0.08] border-amber-500/30 hover:border-amber-500/50'
                        }`}
                      >
                        {/* Event Category & Badge */}
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            {isFocus ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-orange-400">
                                <Zap className="w-3 h-3 fill-orange-400" />
                                <span>{event.durationMinutes}m Focus Block</span>
                              </span>
                            ) : isMeeting ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-sky-300">
                                <Video className="w-3 h-3 text-sky-400" />
                                <span>{event.platform === 'zoom' ? 'Zoom Call' : 'Google Meet'}</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400">
                                <AlertCircle className="w-3 h-3 text-amber-400" />
                                <span>Project Deadline</span>
                              </span>
                            )}

                            {isFocus && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markCalendarEventCompleted(event.id);
                                }}
                                className="text-slate-400 hover:text-white"
                                title={event.isCompleted ? 'Mark Active' : 'Mark Completed'}
                              >
                                {event.isCompleted ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
                                ) : (
                                  <div className="w-3.5 h-3.5 rounded-full border border-orange-500/40" />
                                )}
                              </button>
                            )}
                          </div>

                          {/* Event Title */}
                          <h4 className={`text-xs font-semibold leading-snug tracking-tight ${
                            event.isCompleted ? 'line-through text-slate-400' : 'text-white'
                          }`}>
                            {event.title}
                          </h4>

                          {/* Time & Project Context */}
                          <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-400">
                            <Clock className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                            <span className="font-mono">{event.startTime}</span>
                            <span>•</span>
                            <span className="truncate">{event.projectName}</span>
                          </div>
                        </div>

                        {/* Interactive Direct Action Strip */}
                        <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                          {isMeeting && event.meetingUrl ? (
                            <>
                              <button
                                onClick={() => handleCopyLink(event.meetingUrl!, event.id)}
                                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                                title="Copy Invite Link"
                              >
                                {copiedEventId === event.id ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>

                              <button
                                onClick={() => handleJoinCall(event.meetingUrl)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-[10px] shadow-sm transition active:scale-95"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                                <span>Join Call</span>
                              </button>
                            </>
                          ) : isFocus ? (
                            <>
                              <span className={`text-[9px] font-bold uppercase tracking-wider ${
                                event.isCompleted ? 'text-emerald-400' : 'text-orange-400'
                              }`}>
                                {event.isCompleted ? 'Completed' : 'Scheduled'}
                              </span>

                              <button
                                onClick={() => launchFocusForCalendarEvent(event)}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold text-[10px] transition active:scale-95 ${
                                  isSprintRunning
                                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/40'
                                    : 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30'
                                }`}
                              >
                                <Zap className="w-2.5 h-2.5 fill-current" />
                                <span>Launch Focus</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-amber-300 font-semibold">
                              Cutoff Due
                            </span>
                          )}
                        </div>

                      </motion.div>
                    );
                  })}

                  {dayEvents.length === 0 && (
                    <div className="h-40 flex flex-col items-center justify-center text-center p-2 rounded-2xl bg-white/[0.01] border border-dashed border-white/5 text-slate-600 text-xs">
                      <span>No events</span>
                      <button
                        onClick={() => {
                          setNewDayOfWeek(dayNum);
                          setIsAddEventModalOpen(true);
                        }}
                        className="mt-1 text-[10px] text-orange-400/80 hover:text-orange-400 font-semibold"
                      >
                        + Add block
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* MONTHLY CALENDAR GRID MATRIX */
        <div className="p-6 rounded-3xl bg-[#161920]/80 border border-white/10 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white">September 2026</span>
              <span className="text-xs text-slate-400 font-mono">Q3 Sprint Cycle</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} className="text-center py-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {d.substring(0, 3)}
              </div>
            ))}

            {Array.from({ length: 35 }).map((_, i) => {
              const dayNum = i - 1; // Start from previous month offset
              const isCurrentMonth = dayNum > 0 && dayNum <= 30;
              const matchingDayOfWeek = (i % 7) + 1;
              const matchingEvents = calendarEvents.filter((e) => e.dayOfWeek === matchingDayOfWeek);

              return (
                <div
                  key={i}
                  className={`min-h-[90px] p-2 rounded-2xl border transition-all flex flex-col justify-between ${
                    dayNum === 14
                      ? 'bg-orange-500/10 border-orange-500/40 ring-1 ring-orange-500/20'
                      : isCurrentMonth
                      ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/15'
                      : 'bg-transparent border-transparent opacity-30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-mono font-bold ${dayNum === 14 ? 'text-orange-400' : 'text-slate-400'}`}>
                      {isCurrentMonth ? dayNum : ''}
                    </span>
                    {dayNum === 14 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                    )}
                  </div>

                  {/* Micro event indicators in cell */}
                  {isCurrentMonth && (
                    <div className="space-y-1 my-1">
                      {matchingEvents.slice(0, 2).map((evt) => (
                        <div
                          key={evt.id}
                          onClick={() => {
                            if (evt.type === 'focus_block') launchFocusForCalendarEvent(evt);
                            else setSelectedEvent(evt);
                          }}
                          className={`px-1.5 py-0.5 rounded-md text-[9px] font-semibold truncate cursor-pointer ${
                            evt.type === 'focus_block'
                              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                              : evt.type === 'meeting'
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {evt.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Schedule Event / Focus Block / Sync */}
      <AnimatePresence>
        {isAddEventModalOpen && (
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
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">Schedule Calendar Slot</h3>
                    <p className="text-xs text-slate-400">Add meeting call, Focus Block, or deadline</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsAddEventModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="py-4 space-y-3.5">
                {/* Type Switcher */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Event Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewType('meeting')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${
                        newType === 'meeting'
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                          : 'bg-white/5 border-white/10 text-slate-400'
                      }`}
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Meeting Call</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewType('focus_block')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${
                        newType === 'focus_block'
                          ? 'bg-orange-500/20 text-orange-300 border-orange-500/50'
                          : 'bg-white/5 border-white/10 text-slate-400'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Focus Block</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewType('deadline')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${
                        newType === 'deadline'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-white/5 border-white/10 text-slate-400'
                      }`}
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Deadline</span>
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Deep Focus: Biometric Security V2"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                {/* Day & Duration Selection */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Day of Week
                    </label>
                    <select
                      value={newDayOfWeek}
                      onChange={(e) => setNewDayOfWeek(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      {DAYS_OF_WEEK.map((d, i) => (
                        <option key={d} value={i + 1}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={180}
                      value={newDuration}
                      onChange={(e) => setNewDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {/* Start & End Time Inputs */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Start Time
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 11:00 AM"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      End Time
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 11:45 AM"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {/* If meeting, URL input */}
                {newType === 'meeting' && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Meeting Link (Google Meet / Zoom URL)
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        required
                        placeholder="https://meet.google.com/... or https://zoom.us/..."
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                      <Link2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                    </div>
                  </div>
                )}

                {/* Project */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Related Project
                  </label>
                  <select
                    value={newProject}
                    onChange={(e) => setNewProject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="Brand Identity & Web Portal">Brand Identity & Web Portal</option>
                    <option value="Mobile Crypto Wallet MVP">Mobile Crypto Wallet MVP</option>
                    <option value="Internal Platform Tooling">Internal Platform Tooling</option>
                    <option value="Cloud Security Grid">Cloud Security Grid</option>
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Description / Agenda
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of deliverables or discussion agenda..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsAddEventModalOpen(false)}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-md transition"
                  >
                    Save to Schedule
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: View Details for Meeting or Deadline */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-3xl p-6 bg-[#161920] border border-white/15 shadow-2xl text-white"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
                    {selectedEvent.type === 'meeting' ? <Video className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </div>
                  <h4 className="text-sm font-semibold">{selectedEvent.title}</h4>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="py-4 space-y-2.5 text-xs text-slate-300">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Project</span>
                  <span className="text-white font-medium">{selectedEvent.projectName}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Scheduled Time</span>
                  <span className="text-white font-mono">{selectedEvent.startTime} - {selectedEvent.endTime}</span>
                </div>
                {selectedEvent.description && (
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Agenda</span>
                    <p className="text-slate-400 leading-relaxed mt-0.5">{selectedEvent.description}</p>
                  </div>
                )}
                {selectedEvent.meetingUrl && (
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Meeting URL</span>
                    <span className="text-sky-300 font-mono text-[11px] break-all">{selectedEvent.meetingUrl}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                {selectedEvent.meetingUrl && (
                  <button
                    onClick={() => handleJoinCall(selectedEvent.meetingUrl)}
                    className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Join Meeting Now</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
