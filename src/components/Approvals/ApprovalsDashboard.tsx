// src/components/Approvals/ApprovalsDashboard.tsx
import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  CheckCheck, 
  AlertTriangle, 
  Search, 
  User
} from 'lucide-react';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { useAuthStore } from '../../store/useAuthStore';
import { TimeLog, ApprovalStatus } from '../../types';
import { formatDurationHuman, formatCurrency } from '../../utils/formatters';

export const ApprovalsDashboard: React.FC = () => {
  const { timeLogs, projects, clients, reviewTimeLog, reviewBatchTimeLogs } = useWorkflowStore();
  const { profile } = useAuthStore();

  const [statusFilter, setStatusFilter] = useState<'all' | ApprovalStatus>('submitted');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);

  // Rejection modal state
  const [rejectingLog, setRejectingLog] = useState<TimeLog | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Please clarify work performed and assign to correct task.');

  const reviewerName = profile?.fullName || profile?.role === 'manager' ? 'Project Manager' : 'Admin Reviewer';

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return timeLogs.filter((log) => {
      if (statusFilter !== 'all' && log.approvalStatus !== statusFilter) return false;
      if (projectFilter !== 'all' && log.projectId !== projectFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const descMatch = log.description.toLowerCase().includes(query);
        const userMatch = (log.userId || '').toLowerCase().includes(query);
        if (!descMatch && !userMatch) return false;
      }
      return true;
    });
  }, [timeLogs, statusFilter, projectFilter, searchQuery]);

  // Summary KPIs
  const pendingLogs = useMemo(() => timeLogs.filter((l) => l.approvalStatus === 'submitted'), [timeLogs]);
  const approvedLogs = useMemo(() => timeLogs.filter((l) => l.approvalStatus === 'approved'), [timeLogs]);
  const rejectedLogs = useMemo(() => timeLogs.filter((l) => l.approvalStatus === 'rejected'), [timeLogs]);

  const pendingHours = Number((pendingLogs.reduce((sum, l) => sum + l.durationSeconds, 0) / 3600).toFixed(1));
  const approvedHours = Number((approvedLogs.reduce((sum, l) => sum + l.durationSeconds, 0) / 3600).toFixed(1));

  // Batch actions
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedLogIds(filteredLogs.map((l) => l.id));
    } else {
      setSelectedLogIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedLogIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleApproveBatch = () => {
    if (selectedLogIds.length === 0) return;
    reviewBatchTimeLogs(selectedLogIds, 'approved', undefined, reviewerName);
    setSelectedLogIds([]);
  };

  const handleApproveAllPending = () => {
    const ids = pendingLogs.map((l) => l.id);
    if (ids.length === 0) return;
    reviewBatchTimeLogs(ids, 'approved', undefined, reviewerName);
    setSelectedLogIds([]);
  };

  const handleConfirmRejection = () => {
    if (!rejectingLog) return;
    reviewTimeLog(rejectingLog.id, 'rejected', rejectionReason, reviewerName);
    setRejectingLog(null);
    setRejectionReason('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-indigo-500/10 border border-emerald-200/60 dark:border-emerald-800/40">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-sky-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
            <CheckCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Timesheet Approvals
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Admin & Manager Portal
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review, approve, or reject logged hours before locking them for invoice billing.
            </p>
          </div>
        </div>

        {pendingLogs.length > 0 && (
          <button
            type="button"
            onClick={handleApproveAllPending}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 active:scale-95 transition"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Approve All Pending ({pendingLogs.length})</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          onClick={() => setStatusFilter('submitted')}
          className={`p-5 rounded-2xl border transition cursor-pointer ${
            statusFilter === 'submitted'
              ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700 shadow-sm ring-2 ring-amber-400/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400 font-semibold uppercase">
            <span>Pending Review</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {pendingLogs.length} <span className="text-xs font-normal text-slate-400">entries ({pendingHours}h)</span>
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('approved')}
          className={`p-5 rounded-2xl border transition cursor-pointer ${
            statusFilter === 'approved'
              ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 shadow-sm ring-2 ring-emerald-400/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-semibold uppercase">
            <span>Approved & Locked</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {approvedLogs.length} <span className="text-xs font-normal text-slate-400">entries ({approvedHours}h)</span>
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('rejected')}
          className={`p-5 rounded-2xl border transition cursor-pointer ${
            statusFilter === 'rejected'
              ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-400 dark:border-rose-700 shadow-sm ring-2 ring-rose-400/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-rose-700 dark:text-rose-400 font-semibold uppercase">
            <span>Changes Requested</span>
            <XCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {rejectedLogs.length} <span className="text-xs font-normal text-slate-400">entries</span>
          </div>
        </div>
      </div>

      {/* Filter & Batch Actions Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        
        {/* Left: Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Pending Approval Only</option>
            <option value="approved">Approved Logs</option>
            <option value="rejected">Rejected / Changes Requested</option>
            <option value="draft">Draft Logs</option>
          </select>

          {/* Project filter */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Search box */}
          <div className="relative flex-1 min-w-[160px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search description or member..."
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Right: Batch Action Buttons */}
        {selectedLogIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">
              {selectedLogIds.length} selected:
            </span>
            <button
              type="button"
              onClick={handleApproveBatch}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition active:scale-95 flex items-center gap-1.5"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Approve Selected</span>
            </button>
          </div>
        )}

      </div>

      {/* Review Table */}
      {filteredLogs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 text-xs">
          No time logs match the selected filters.
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedLogIds.length > 0 && selectedLogIds.length === filteredLogs.length}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 dark:border-slate-700 text-sky-600 focus:ring-sky-500"
                    />
                  </th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Project & Client</th>
                  <th className="py-3 px-4">Work Description</th>
                  <th className="py-3 px-4 text-right">Hours</th>
                  <th className="py-3 px-4 text-right">Billable Value</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Review Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredLogs.map((log) => {
                  const proj = projects.find((p) => p.id === log.projectId);
                  const client = clients.find((c) => c.id === log.clientId);
                  const hours = log.durationSeconds / 3600;
                  const rate = log.hourlyRate || proj?.rate || 0;
                  const amount = hours * rate;
                  const isSelected = selectedLogIds.includes(log.id);

                  return (
                    <tr 
                      key={log.id} 
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition ${
                        isSelected ? 'bg-sky-50/40 dark:bg-sky-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(log.id)}
                          className="rounded border-slate-300 dark:border-slate-700 text-sky-600 focus:ring-sky-500"
                        />
                      </td>

                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(log.startTime).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.userId === 'user-default' ? 'Team Member' : log.userId}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{proj?.name || 'Project'}</div>
                        <div className="text-[10px] text-slate-400">{client?.name || 'Client'}</div>
                      </td>

                      <td className="py-3 px-4 max-w-xs text-slate-600 dark:text-slate-300">
                        <div className="truncate">{log.description}</div>
                        {log.rejectionReason && (
                          <div className="text-[11px] text-rose-500 font-semibold mt-0.5 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Reason: {log.rejectionReason}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {formatDurationHuman(log.durationSeconds)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {log.isBillable ? formatCurrency(amount, client?.currency) : 'Non-billable'}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          log.approvalStatus === 'approved'
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : log.approvalStatus === 'submitted'
                            ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 animate-pulse'
                            : log.approvalStatus === 'rejected'
                            ? 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                        }`}>
                          {log.approvalStatus}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {log.approvalStatus !== 'approved' && (
                            <button
                              type="button"
                              onClick={() => reviewTimeLog(log.id, 'approved', undefined, reviewerName)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 transition"
                              title="Approve Log"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}

                          {log.approvalStatus !== 'rejected' && (
                            <button
                              type="button"
                              onClick={() => setRejectingLog(log)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 transition"
                              title="Request Changes / Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rejection Feedback Modal */}
      {rejectingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Request Timesheet Revision
                </h4>
                <p className="text-xs text-slate-500">
                  Provide feedback to the member on why this log was returned.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 text-xs space-y-1 text-slate-600 dark:text-slate-400">
              <div><strong>Task:</strong> {rejectingLog.description}</div>
              <div><strong>Duration:</strong> {formatDurationHuman(rejectingLog.durationSeconds)}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Feedback & Reason for Revision *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="Explain the required correction..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingLog(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20 active:scale-95 transition"
              >
                Return to Member
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ApprovalsDashboard;
