// src/components/TimeTracker/TimeTracker.tsx
import { useEffect, useState, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  DollarSign, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  Tag, 
  Trash2,
  Flower2,
  Send,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { useTimerStore } from '../../store/useTimerStore';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatDuration, formatDurationHuman, formatCurrency } from '../../utils/formatters';
import { Task } from '../../types';

interface TimeTrackerProps {
  onGetUnstuck?: (taskTitle: string, taskDesc?: string) => void;
}

export function TimeTracker({ onGetUnstuck }: TimeTrackerProps = {}) {
  const {
    status,
    projectId,
    taskId,
    description,
    isBillable,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    discardTimer,
    setProject,
    setTask,
    setDescription,
    setIsBillable,
    getElapsedSeconds,
  } = useTimerStore();

  const { 
    projects, 
    clients, 
    tasks, 
    timeLogs, 
    deleteTimeLog, 
    submitTimesheetForApproval 
  } = useWorkflowStore();
  const { profile } = useAuthStore();
  const isMember = profile?.role === 'member';

  // Local state to re-render tick every second when running
  const [seconds, setSeconds] = useState<number>(0);

  useEffect(() => {
    // Initial sync
    setSeconds(getElapsedSeconds());

    if (status === 'running') {
      const interval = setInterval(() => {
        setSeconds(getElapsedSeconds());
      }, 500); // 500ms keeps UI responsive and precise
      return () => clearInterval(interval);
    }
  }, [status, getElapsedSeconds]);

  // Selected project details
  const selectedProject = useMemo(() => {
    return projects.find((p) => p.id === projectId);
  }, [projects, projectId]);

  const selectedClient = useMemo(() => {
    if (!selectedProject) return null;
    return clients.find((c) => c.id === selectedProject.clientId);
  }, [clients, selectedProject]);

  const availableTasks = useMemo(() => {
    if (!projectId) return [];
    return tasks.filter((t) => t.projectId === projectId);
  }, [tasks, projectId]);

  // Real-time live earnings for this session
  const currentSessionEarnings = useMemo(() => {
    if (!isBillable || !selectedProject) return 0;
    const hours = seconds / 3600;
    const rate = selectedProject.rate || selectedClient?.hourlyRate || 0;
    return hours * rate;
  }, [seconds, isBillable, selectedProject, selectedClient]);

  // Handler to start or prompt
  const handleStart = () => {
    if (!projectId && projects.length > 0) {
      // Default to first active project if none chosen
      startTimer({
        projectId: projects[0].id,
        taskId,
        description,
        isBillable,
      });
    } else if (projectId) {
      startTimer({
        projectId,
        taskId,
        description,
        isBillable,
      });
    }
  };

  const handleStop = () => {
    const result = stopTimer();
    if (result) {
      setSeconds(0);
    }
  };

  const handleDiscard = () => {
    if (window.confirm('Are you sure you want to discard this tracking session?')) {
      discardTimer();
      setSeconds(0);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* --- HERO TIMER INTERACTION CARD --- */}
      <div className={`p-6 md:p-8 rounded-2xl border transition-all shadow-sm ${
        status === 'running' 
          ? 'bg-gradient-to-b from-indigo-50/40 to-white dark:from-indigo-950/20 dark:to-slate-900 border-indigo-500/40 shadow-indigo-500/5' 
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          {/* Left: Input & Selectors */}
          <div className="flex-1 w-full space-y-4">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                status === 'running'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                  : status === 'paused'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {status === 'running' && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                {status === 'paused' && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                {status === 'idle' && <span className="w-2 h-2 rounded-full bg-slate-400" />}
                {status.toUpperCase()}
              </span>

              {selectedClient && (
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  {selectedClient.name} ({selectedClient.company || 'Direct'})
                </span>
              )}
            </div>

            {/* Task Description Input */}
            <div>
              <input
                type="text"
                placeholder="What are you working on right now?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-base md:text-lg font-medium bg-transparent border-0 border-b border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-0 px-0 py-2 placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-slate-100 transition"
              />
            </div>

            {/* Dropdowns row */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {/* Project Select */}
              <div className="flex-1 min-w-[200px]">
                <select
                  value={projectId}
                  onChange={(e) => {
                    setProject(e.target.value);
                    setTask(''); // Reset task when project changes
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">Select Project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.billingType === 'hourly' ? (isMember ? 'Hourly' : `$${p.rate}/hr`) : 'Fixed'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Task Select */}
              <div className="flex-1 min-w-[180px]">
                <select
                  value={taskId}
                  onChange={(e) => setTask(e.target.value)}
                  disabled={!projectId || availableTasks.length === 0}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 disabled:opacity-50 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">
                    {availableTasks.length === 0 ? 'No open tasks' : 'Select Task (Optional)'}
                  </option>
                  {availableTasks.map((t: Task) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Billable Toggle */}
              <button
                type="button"
                onClick={() => setIsBillable(!isBillable)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition ${
                  isBillable
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                {isBillable ? 'Billable' : 'Non-Billable'}
              </button>

              {/* Get Unstuck with Rachel (Raches) Button */}
              <button
                type="button"
                onClick={() => {
                  const selectedTaskObj = tasks.find((t) => t.id === taskId);
                  const title = selectedTaskObj?.title || description || (selectedProject ? `Work on ${selectedProject.name}` : 'Current Task');
                  const desc = selectedTaskObj?.description || description;
                  if (onGetUnstuck) {
                    onGetUnstuck(title, desc);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition shadow-sm"
                title="Send current task context to Rachel for instant troubleshooting"
              >
                <Flower2 className="w-3.5 h-3.5 text-sky-500" />
                <span>Get Unstuck 🌸</span>
              </button>
            </div>
          </div>

          {/* Right: Big Digital Clock & Controls */}
          <div className="flex flex-col items-center lg:items-end w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
            {/* Live Timer Display */}
            <div className="font-mono text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {formatDuration(seconds)}
            </div>

            {/* Live Earnings readout (hidden for Member role) */}
            <div className="h-6 mt-1">
              {!isMember && isBillable && selectedProject && seconds > 0 && (
                <span className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">
                  +{formatCurrency(currentSessionEarnings, selectedClient?.currency || 'USD')} accrued
                </span>
              )}
              {isMember && selectedProject && seconds > 0 && (
                <span className="text-xs font-medium text-slate-400">
                  Logging time for {selectedProject.name}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-3">
              {status === 'idle' ? (
                <button
                  type="button"
                  onClick={handleStart}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20 transition active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Timer</span>
                </button>
              ) : (
                <>
                  {status === 'running' ? (
                    <button
                      type="button"
                      onClick={pauseTimer}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      title="Pause Timer"
                    >
                      <Pause className="w-4 h-4" />
                      <span>Pause</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={resumeTimer}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 transition"
                      title="Resume Timer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Resume</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleStop}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-medium text-white bg-rose-600 hover:bg-rose-500 shadow-sm shadow-rose-500/20 transition active:scale-95"
                    title="Stop and Save to Time Logs"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>Stop & Log</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDiscard}
                    className="p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                    title="Discard Session"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- MEMBER TIMESHEET SUBMISSION BANNER --- */}
      {(() => {
        const draftLogs = timeLogs.filter((l) => l.approvalStatus === 'draft');
        const draftHours = Number((draftLogs.reduce((sum, l) => sum + l.durationSeconds, 0) / 3600).toFixed(1));
        if (draftLogs.length === 0) return null;

        return (
          <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-white">
                  {draftLogs.length} Draft Time Logs ({draftHours}h) Ready for Review
                </span>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Submit your weekly timesheet to team managers for approval.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => submitTimesheetForApproval(draftLogs.map((l) => l.id))}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Timesheet for Approval</span>
            </button>
          </div>
        );
      })()}

      {/* --- RECENT TIME LOGS STREAM --- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              Recent Time Logs & Timesheets
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tracked sessions, verification status, and submission history.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500">
            Total Logs: {timeLogs.length}
          </span>
        </div>

        {timeLogs.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
            <Clock className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm text-slate-500">No time tracked yet. Hit Start Timer above to begin!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            {timeLogs.map((log) => {
              const project = projects.find((p) => p.id === log.projectId);
              const client = clients.find((c) => c.id === log.clientId);
              const task = tasks.find((t) => t.id === log.taskId);
              const isApproved = log.approvalStatus === 'approved';

              return (
                <div 
                  key={log.id} 
                  className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 mt-0.5">
                      <Tag className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          {project?.name || 'Project'}
                        </span>
                        {client && (
                          <span className="text-xs text-slate-400">
                            • {client.name}
                          </span>
                        )}
                        {task && (
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {task.title}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {log.description}
                      </p>

                      {/* Rejection feedback notice if rejected */}
                      {log.approvalStatus === 'rejected' && (
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>Correction Needed: {log.rejectionReason}</span>
                          <button
                            type="button"
                            onClick={() => submitTimesheetForApproval([log.id])}
                            className="ml-2 underline hover:text-rose-700"
                          >
                            Re-submit
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 self-end sm:self-center">
                    
                    {/* Approval Status Badge */}
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      log.approvalStatus === 'approved'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                        : log.approvalStatus === 'submitted'
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 animate-pulse'
                        : log.approvalStatus === 'rejected'
                        ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}>
                      {log.approvalStatus}
                    </span>

                    {/* Billable / Financials (Hidden for Member) */}
                    <div className="flex items-center gap-1.5 text-xs">
                      {!isMember && (
                        log.isBillable ? (
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                            ${((log.durationSeconds / 3600) * log.hourlyRate).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-400">Non-billable</span>
                        )
                      )}

                      {/* Invoiced Status */}
                      {log.isInvoiced ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Invoiced
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-500">
                          Unbilled
                        </span>
                      )}
                    </div>

                    {/* Duration Tabular */}
                    <div className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {formatDurationHuman(log.durationSeconds)}
                    </div>

                    {/* Submit Draft Button */}
                    {log.approvalStatus === 'draft' && (
                      <button
                        type="button"
                        onClick={() => submitTimesheetForApproval([log.id])}
                        className="px-2 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 text-[11px] font-semibold border border-sky-200 dark:border-sky-800 hover:bg-sky-100"
                        title="Submit this log for review"
                      >
                        Submit
                      </button>
                    )}

                    {/* Unstuck button */}
                    {onGetUnstuck && (
                      <button
                        type="button"
                        onClick={() => onGetUnstuck(task?.title || log.description, `Session under ${project?.name}: ${log.description}`)}
                        className="text-sky-500 hover:text-sky-600 p-1.5 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-950/40 transition"
                        title="Troubleshoot / Review with Rachel"
                      >
                        <Flower2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Delete button (Disabled/Locked if approved) */}
                    {isApproved ? (
                      <span className="p-1.5 text-slate-300 dark:text-slate-600" title="Approved hours are locked">
                        <Lock className="w-4 h-4" />
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => deleteTimeLog(log.id)}
                        className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                        title="Delete log"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
