// src/components/Projects/ClientProjectManager.tsx
import React, { useState } from 'react';
import { 
  Briefcase, 
  Users, 
  Plus, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  Trash2, 
  Flower2,
  TrendingUp,
  Layers,
  AlertCircle,
  X,
  Globe,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { useAuthStore } from '../../store/useAuthStore';
import { CreateClientDTO, CreateProjectDTO, ProjectMilestone } from '../../types';
import { formatCurrency, formatDate, isOverdue } from '../../utils/formatters';

interface ClientProjectManagerProps {
  onGetUnstuck?: (taskTitle: string, taskDesc?: string, projectName?: string) => void;
}

export function ClientProjectManager({ onGetUnstuck }: ClientProjectManagerProps = {}) {
  const { 
    clients, 
    projects, 
    addClient, 
    deleteClient, 
    addProject, 
    deleteProject, 
    addProjectMilestone,
    deleteProjectMilestone,
    getProjectMetrics,
    getTasksByProject,
    regenerateClientPortalToken
  } = useWorkflowStore();
  const { profile } = useAuthStore();
  const isMember = profile?.role === 'member';

  const [activeTab, setActiveTab] = useState<'projects' | 'clients'>('projects');
  const [showClientModal, setShowClientModal] = useState<boolean>(false);
  const [showProjectModal, setShowProjectModal] = useState<boolean>(false);
  const [copiedClientId, setCopiedClientId] = useState<string | null>(null);

  // Quick inline add milestone modal
  const [activeMilestoneProjectId, setActiveMilestoneProjectId] = useState<string | null>(null);
  const [inlineMilestoneTitle, setInlineMilestoneTitle] = useState('');
  const [inlineMilestoneAmount, setInlineMilestoneAmount] = useState<number>(1000);
  const [inlineMilestoneDueDate, setInlineMilestoneDueDate] = useState('');

  // New Client Form State
  const [newClient, setNewClient] = useState<CreateClientDTO>({
    name: '',
    email: '',
    company: '',
    currency: 'USD',
    hourlyRate: 85,
    paymentTermsDays: 14,
  });

  // New Project Form State
  const [newProject, setNewProject] = useState<CreateProjectDTO>({
    clientId: clients[0]?.id || '',
    name: '',
    description: '',
    billingType: 'hourly',
    rate: 95,
    contractTotal: 5000,
    retainerMonthlyFee: 2500,
    retainerHoursCap: 25,
    retainerOvertimeRate: 110,
    budgetHours: 40,
    deadline: '',
  });

  // Draft Milestones for Fixed-Fee Projects
  const [draftMilestones, setDraftMilestones] = useState<Array<{ title: string; amount: number; percentage?: number; dueDate?: string }>>([
    { title: 'Project Kickoff & Discovery Deposit', amount: 2500, percentage: 50 },
    { title: 'Final Handover & Launch Delivery', amount: 2500, percentage: 50 },
  ]);

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name || !newClient.email) return;
    addClient(newClient);
    setNewClient({
      name: '',
      email: '',
      company: '',
      currency: 'USD',
      hourlyRate: 85,
      paymentTermsDays: 14,
    });
    setShowClientModal(false);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name || !newProject.clientId) return;

    let compiledMilestones: ProjectMilestone[] | undefined = undefined;
    if (newProject.billingType === 'fixed_fee' && draftMilestones.length > 0) {
      compiledMilestones = draftMilestones.map((m, idx) => ({
        id: `ms-${Date.now()}-${idx}`,
        title: m.title,
        amount: m.amount,
        percentage: m.percentage,
        dueDate: m.dueDate,
        status: 'pending',
      }));
    }

    addProject({
      ...newProject,
      milestones: compiledMilestones,
    });

    setNewProject({
      clientId: clients[0]?.id || '',
      name: '',
      description: '',
      billingType: 'hourly',
      rate: 95,
      contractTotal: 5000,
      retainerMonthlyFee: 2500,
      retainerHoursCap: 25,
      retainerOvertimeRate: 110,
      budgetHours: 40,
      deadline: '',
    });
    setShowProjectModal(false);
  };

  const handleAddInlineMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMilestoneProjectId || !inlineMilestoneTitle.trim() || inlineMilestoneAmount <= 0) return;

    addProjectMilestone(activeMilestoneProjectId, {
      title: inlineMilestoneTitle.trim(),
      amount: inlineMilestoneAmount,
      dueDate: inlineMilestoneDueDate || undefined,
    });

    setActiveMilestoneProjectId(null);
    setInlineMilestoneTitle('');
    setInlineMilestoneAmount(1000);
    setInlineMilestoneDueDate('');
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* --- TOP CONTROL & TAB SWITCHER --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition ${
              activeTab === 'projects'
                ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Projects ({projects.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('clients')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition ${
              activeTab === 'clients'
                ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Clients ({clients.length})</span>
          </button>
        </div>

        {/* Create Action Button (Hidden for Member role) */}
        {!isMember && (
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'projects') {
                setNewProject({
                  clientId: clients[0]?.id || '',
                  name: '',
                  description: '',
                  billingType: 'hourly',
                  rate: 95,
                  contractTotal: 5000,
                  retainerMonthlyFee: 2500,
                  retainerHoursCap: 25,
                  retainerOvertimeRate: 110,
                  budgetHours: 40,
                  deadline: '',
                });
                setShowProjectModal(true);
              } else {
                setShowClientModal(true);
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-sky-500 via-indigo-600 to-violet-600 hover:from-sky-600 hover:to-indigo-700 text-white shadow-md shadow-sky-500/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>{activeTab === 'projects' ? 'New Project' : 'New Client'}</span>
          </button>
        )}
      </div>

      {/* --- TAB 1: PROJECTS LIST --- */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => {
            const client = clients.find((c) => c.id === proj.clientId);
            const metrics = getProjectMetrics(proj.id);
            const overdue = isOverdue(proj.deadline);

            return (
              <div
                key={proj.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition space-y-4"
              >
                <div>
                  {/* Card Header: Client & Billing Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-0.5 rounded-full border border-sky-200/60 dark:border-sky-800/60 truncate max-w-[150px]">
                      {client?.name || 'Client'}
                    </span>
                    
                    {/* Billing Model Badge */}
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                      proj.billingType === 'fixed_fee'
                        ? 'bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800'
                        : proj.billingType === 'retainer'
                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    }`}>
                      {proj.billingType === 'fixed_fee' ? 'Fixed Fee' : proj.billingType === 'retainer' ? 'Retainer' : 'Hourly'}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-2.5 leading-snug">
                    {proj.name}
                  </h3>
                  {proj.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {proj.description}
                    </p>
                  )}

                  {/* --- PRICING INTELLIGENCE STRIP --- */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
                    
                    {/* 1. HOURLY MODEL */}
                    {proj.billingType === 'hourly' && (
                      <div className="space-y-2">
                        {!isMember && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                              Rate:
                            </span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              {formatCurrency(proj.rate, client?.currency)}/hr
                            </span>
                          </div>
                        )}

                        {proj.budgetHours && (
                          <div>
                            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                              <span>Budget Burn: {metrics.totalLoggedHours}h / {proj.budgetHours}h</span>
                              <span className={metrics.isOverBudget ? 'text-rose-500 font-bold' : ''}>
                                {metrics.budgetPercentUsed}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  metrics.isOverBudget ? 'bg-rose-500' : 'bg-sky-500'
                                }`}
                                style={{ width: `${Math.min(metrics.budgetPercentUsed, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 2. FIXED-FEE MODEL: Milestones & Internal Profit Margin (Hidden for Member) */}
                    {proj.billingType === 'fixed_fee' && (
                      <div className="space-y-2.5">
                        {!isMember && (
                          <>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">Contract Total:</span>
                              <span className="font-mono font-bold text-slate-900 dark:text-white">
                                {formatCurrency(metrics.contractTotal, client?.currency)}
                              </span>
                            </div>

                            {/* Internal Profit Margin Pill */}
                            <div className={`p-2 rounded-xl border text-xs flex items-center justify-between ${
                              metrics.profitMarginPercent >= 30
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                                : metrics.profitMarginPercent >= 0
                                ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                                : 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                            }`}>
                              <span className="flex items-center gap-1 font-semibold text-[11px]">
                                <TrendingUp className="w-3.5 h-3.5" />
                                Profit Margin:
                              </span>
                              <span className="font-mono font-bold">
                                {formatCurrency(metrics.profitMarginAmount, client?.currency)} ({metrics.profitMarginPercent}%)
                              </span>
                            </div>
                          </>
                        )}

                        {/* Milestones list */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                            <span className="flex items-center gap-1">
                              <Layers className="w-3 h-3 text-violet-500" />
                              Milestones ({proj.milestones?.length || 0})
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMilestoneProjectId(proj.id);
                                setInlineMilestoneTitle('');
                                setInlineMilestoneAmount(1000);
                              }}
                              className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline"
                            >
                              + Add Milestone
                            </button>
                          </div>

                          {proj.milestones && proj.milestones.length > 0 && (
                            <div className="space-y-1 max-h-24 overflow-y-auto pr-1 text-[11px]">
                              {proj.milestones.map((ms) => {
                                const statusPill: Record<string, string> = {
                                  paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
                                  invoiced: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
                                  pending: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
                                };

                                return (
                                  <div
                                    key={ms.id}
                                    className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                                  >
                                    <div className="flex items-center gap-1.5 truncate">
                                      <span className="truncate">{ms.title}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                      <span className="font-mono font-bold">{formatCurrency(ms.amount)}</span>
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${statusPill[ms.status] || statusPill.pending}`}>
                                        {ms.status}
                                      </span>
                                      {ms.status === 'pending' && (
                                        <button
                                          type="button"
                                          onClick={() => deleteProjectMilestone(proj.id, ms.id)}
                                          className="text-slate-400 hover:text-rose-500 transition ml-0.5"
                                          title="Delete Milestone"
                                        >
                                          <X className="w-3 h-3" />
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
                    )}

                    {/* 3. RETAINER MODEL: Monthly Fee & Utilization Cap */}
                    {proj.billingType === 'retainer' && (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Monthly Retainer:</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {formatCurrency(proj.retainerMonthlyFee || proj.rate, client?.currency)} / mo
                          </span>
                        </div>

                        {/* Monthly Capacity Progress */}
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                            <span>
                              Month Utilization: <strong>{metrics.currentMonthHours}h</strong> / {metrics.retainerHoursCap}h cap
                            </span>
                            <span className={metrics.isRetainerOverCap ? 'text-rose-500 font-bold' : ''}>
                              {metrics.retainerPercentUsed}%
                            </span>
                          </div>

                          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                metrics.isRetainerOverCap
                                  ? 'bg-rose-500'
                                  : metrics.retainerPercentUsed > 80
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(metrics.retainerPercentUsed, 100)}%` }}
                            />
                          </div>

                          {metrics.isRetainerOverCap && (
                            <div className="mt-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>+{metrics.retainerOverCapHours}h overtime billed at {formatCurrency(proj.retainerOvertimeRate || 100)}/hr</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Deadline Indicator */}
                  {proj.deadline && (
                    <div className={`mt-3 flex items-center gap-1.5 text-xs font-medium ${
                      overdue ? 'text-rose-500 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {overdue ? <AlertTriangle className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
                      <span>Deadline: {formatDate(proj.deadline)} {overdue && '(Overdue)'}</span>
                    </div>
                  )}

                  {/* Active Tasks & Rachel Get Unstuck */}
                  {(() => {
                    const projTasks = getTasksByProject(proj.id);
                    if (projTasks.length === 0) return null;
                    return (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-semibold uppercase text-slate-400">
                          <span>Active Tasks ({projTasks.length})</span>
                          <span className="text-sky-500 lowercase">rachel ready</span>
                        </div>
                        {projTasks.slice(0, 2).map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs border border-slate-100 dark:border-slate-800"
                          >
                            <span className="truncate max-w-[150px] font-medium text-slate-700 dark:text-slate-300">
                              {task.title}
                            </span>
                            {onGetUnstuck && (
                              <button
                                type="button"
                                onClick={() => onGetUnstuck(task.title, task.description, proj.name)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 transition shrink-0"
                                title="Send task to Rachel for instant troubleshooting"
                              >
                                <Flower2 className="w-3 h-3 text-sky-500" />
                                <span>Get Unstuck</span>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Card Bottom: Delete Action (Hidden for Member) */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>{metrics.totalLoggedHours}h total logged</span>
                  {!isMember && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete project "${proj.name}"?`)) {
                          deleteProject(proj.id);
                        }
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- TAB 2: CLIENTS LIST --- */}
      {activeTab === 'clients' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clients.map((client) => {
            const clientProjs = projects.filter((p) => p.clientId === client.id);

            return (
              <div
                key={client.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {client.company || 'Independent'}
                    </span>
                    {!isMember && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete client "${client.name}" and associated projects?`)) {
                            deleteClient(client.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 transition"
                        title="Delete Client"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-2">
                    {client.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {client.email}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    {!isMember ? (
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Default Rate</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {client.hourlyRate ? `${formatCurrency(client.hourlyRate, client.currency)}/hr` : 'Custom'}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Currency</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {client.currency || 'USD'}
                        </span>
                      </div>
                    )}

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Terms</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Net {client.paymentTermsDays} Days
                      </span>
                    </div>
                  </div>

                  {/* Client Portal Link Strip */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-sky-500" />
                        Client Portal Link
                      </span>
                      {!isMember && (
                        <button
                          type="button"
                          onClick={() => regenerateClientPortalToken(client.id)}
                          className="text-[10px] text-slate-400 hover:text-sky-600"
                          title="Rotate secure token"
                        >
                          Rotate Token
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        readOnly
                        value={`${window.location.origin}/portal/${client.portalToken || 'cp_' + client.id}`}
                        className="flex-1 px-2.5 py-1 text-[10px] font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 truncate"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const url = `${window.location.origin}/portal/${client.portalToken || 'cp_' + client.id}`;
                          navigator.clipboard.writeText(url);
                          setCopiedClientId(client.id);
                          setTimeout(() => setCopiedClientId(null), 2000);
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Copy Portal Link"
                      >
                        {copiedClientId === client.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const url = `/portal/${client.portalToken || 'cp_' + client.id}`;
                          window.open(url, '_blank');
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40"
                        title="Open Client Portal in New Tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Projects ({clientProjs.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {clientProjs.map((p) => (
                        <span
                          key={p.id}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]"
                        >
                          {p.name}
                        </span>
                      ))}
                      {clientProjs.length === 0 && (
                        <span className="text-xs text-slate-400 italic">No projects yet</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- MODAL: INLINE ADD MILESTONE --- */}
      {activeMilestoneProjectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-violet-500" />
                <span>Add Project Milestone</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveMilestoneProjectId(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddInlineMilestone} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Milestone Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design Approval / Beta Deliverable"
                  value={inlineMilestoneTitle}
                  onChange={(e) => setInlineMilestoneTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Amount ($) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={inlineMilestoneAmount || ''}
                    onChange={(e) => setInlineMilestoneAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={inlineMilestoneDueDate}
                    onChange={(e) => setInlineMilestoneDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveMilestoneProjectId(null)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-violet-600 text-white hover:bg-violet-500 shadow-sm"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: CREATE CLIENT --- */}
      {showClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Add New Client</h3>
            <p className="text-xs text-slate-500 mt-0.5">Manage contact info and default billing conditions.</p>

            <form onSubmit={handleCreateClient} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  placeholder="e.g. Jessica Alba"
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Company Name</label>
                <input
                  type="text"
                  value={newClient.company}
                  onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                  placeholder="e.g. Acme Studio"
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  placeholder="contact@company.com"
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Default Rate ($/hr)</label>
                  <input
                    type="number"
                    value={newClient.hourlyRate}
                    onChange={(e) => setNewClient({ ...newClient, hourlyRate: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Payment Terms</label>
                  <select
                    value={newClient.paymentTermsDays}
                    onChange={(e) => setNewClient({ ...newClient, paymentTermsDays: parseInt(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value={7}>Net 7 Days</option>
                    <option value={14}>Net 14 Days</option>
                    <option value={30}>Net 30 Days</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowClientModal(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-sky-600 text-white hover:bg-sky-500 shadow-sm"
                >
                  Create Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: CREATE PROJECT (Flexible Pricing Models) --- */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-lg shadow-2xl my-8">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Create New Project</h3>
            <p className="text-xs text-slate-500 mt-0.5">Select a flexible billing model: Hourly, Fixed-Fee, or Retainer.</p>

            <form onSubmit={handleCreateProject} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Client *</label>
                <select
                  required
                  value={newProject.clientId}
                  onChange={(e) => {
                    const selected = clients.find((c) => c.id === e.target.value);
                    setNewProject({
                      ...newProject,
                      clientId: e.target.value,
                      rate: selected?.hourlyRate || newProject.rate,
                    });
                  }}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.company || 'Direct'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brand Redesign & Web App"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Billing Type Selector (Hourly / Fixed Fee / Retainer) */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                  Pricing & Billing Model *
                </label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  {(['hourly', 'fixed_fee', 'retainer'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewProject({ ...newProject, billingType: type })}
                      className={`py-2 text-xs font-semibold rounded-lg capitalize transition ${
                        newProject.billingType === type
                          ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                      }`}
                    >
                      {type === 'fixed_fee' ? 'Fixed-Fee' : type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Pricing Inputs Based on Selected Billing Type */}
              {newProject.billingType === 'hourly' && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Rate ($ / Hour)</label>
                    <input
                      type="number"
                      value={newProject.rate}
                      onChange={(e) => setNewProject({ ...newProject, rate: parseFloat(e.target.value) || 0 })}
                      className="w-full mt-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Budget Hours (Cap)</label>
                    <input
                      type="number"
                      placeholder="e.g. 50"
                      value={newProject.budgetHours || ''}
                      onChange={(e) => setNewProject({ ...newProject, budgetHours: parseFloat(e.target.value) || undefined })}
                      className="w-full mt-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
              )}

              {newProject.billingType === 'fixed_fee' && (
                <div className="space-y-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Contract Total ($)</label>
                      <input
                        type="number"
                        value={newProject.contractTotal || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setNewProject({ ...newProject, contractTotal: val });
                          // Auto split 50/50
                          setDraftMilestones([
                            { title: 'Project Kickoff Deposit', amount: Math.round(val * 0.5), percentage: 50 },
                            { title: 'Final Delivery & Handover', amount: Math.round(val * 0.5), percentage: 50 },
                          ]);
                        }}
                        className="w-full mt-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Team Cost Rate ($/hr)</label>
                      <input
                        type="number"
                        value={newProject.rate}
                        onChange={(e) => setNewProject({ ...newProject, rate: parseFloat(e.target.value) || 0 })}
                        title="Used to compute internal profit margin against logged hours"
                        className="w-full mt-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  {/* Initial Milestones Setup */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center justify-between">
                      <span>Milestones ({draftMilestones.length})</span>
                      <span className="text-[10px] text-slate-400">50% Deposit / 50% Launch</span>
                    </div>
                    <div className="space-y-1.5">
                      {draftMilestones.map((m, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            value={m.title}
                            onChange={(e) => {
                              const updated = [...draftMilestones];
                              updated[idx].title = e.target.value;
                              setDraftMilestones(updated);
                            }}
                            className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                          />
                          <input
                            type="number"
                            value={m.amount}
                            onChange={(e) => {
                              const updated = [...draftMilestones];
                              updated[idx].amount = parseFloat(e.target.value) || 0;
                              setDraftMilestones(updated);
                            }}
                            className="w-24 px-2 py-1 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {newProject.billingType === 'retainer' && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Monthly Fee ($ / mo)</label>
                    <input
                      type="number"
                      value={newProject.retainerMonthlyFee || ''}
                      onChange={(e) => setNewProject({ ...newProject, retainerMonthlyFee: parseFloat(e.target.value) || 0 })}
                      className="w-full mt-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Monthly Hours Cap</label>
                    <input
                      type="number"
                      value={newProject.retainerHoursCap || ''}
                      onChange={(e) => setNewProject({ ...newProject, retainerHoursCap: parseFloat(e.target.value) || 0 })}
                      className="w-full mt-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Target Deadline</label>
                <input
                  type="date"
                  value={newProject.deadline}
                  onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-sky-600 text-white hover:bg-sky-500 shadow-sm"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default ClientProjectManager;
