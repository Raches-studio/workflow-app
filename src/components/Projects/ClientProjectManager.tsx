import React, { useState } from 'react';
import { 
  Briefcase, 
  Users, 
  Plus, 
  Calendar, 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  Trash2, 
  Flower2
} from 'lucide-react';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { BillingType, CreateClientDTO, CreateProjectDTO } from '../../types';
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
    getProjectMetrics,
    getTasksByProject
  } = useWorkflowStore();

  const [activeTab, setActiveTab] = useState<'projects' | 'clients'>('projects');
  const [showClientModal, setShowClientModal] = useState<boolean>(false);
  const [showProjectModal, setShowProjectModal] = useState<boolean>(false);

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
    budgetHours: 40,
    deadline: '',
  });

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
    addProject(newProject);
    setNewProject({
      clientId: clients[0]?.id || '',
      name: '',
      description: '',
      billingType: 'hourly',
      rate: 95,
      budgetHours: 40,
      deadline: '',
    });
    setShowProjectModal(false);
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
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
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
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Clients ({clients.length})</span>
          </button>
        </div>

        {/* Action Button */}
        <div>
          {activeTab === 'projects' ? (
            <button
              type="button"
              onClick={() => setShowProjectModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowClientModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Client</span>
            </button>
          )}
        </div>
      </div>

      {/* --- TAB 1: PROJECTS GRID --- */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => {
            const client = clients.find((c) => c.id === proj.clientId);
            const metrics = getProjectMetrics(proj.id);
            const overdue = isOverdue(proj.deadline);

            return (
              <div
                key={proj.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                <div>
                  {/* Card Header: Client & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded-full">
                      {client?.name || 'Unknown Client'}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      {proj.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-3">
                    {proj.name}
                  </h3>
                  {proj.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {proj.description}
                    </p>
                  )}

                  {/* Billing Details Strip */}
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold">
                        {proj.billingType === 'hourly' 
                          ? `${formatCurrency(proj.rate, client?.currency)}/hr` 
                          : `${formatCurrency(proj.rate, client?.currency)} Fixed`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{metrics.totalLoggedHours}h logged</span>
                    </div>
                  </div>

                  {/* Budget Burn Progress Bar */}
                  {proj.budgetHours && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span>Budget Burn: {metrics.totalLoggedHours}h / {proj.budgetHours}h</span>
                        <span className={metrics.isOverBudget ? 'text-rose-500 font-bold' : ''}>
                          {metrics.budgetPercentUsed}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            metrics.isOverBudget ? 'bg-rose-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${Math.min(metrics.budgetPercentUsed, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Deadline Indicator */}
                  {proj.deadline && (
                    <div className={`mt-3 flex items-center gap-1.5 text-xs font-medium ${
                      overdue ? 'text-rose-500 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {overdue ? <AlertTriangle className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
                      <span>Deadline: {formatDate(proj.deadline)} {overdue && '(Overdue)'}</span>
                    </div>
                  )}

                  {/* Tasks List & Get Unstuck Action */}
                  {(() => {
                    const projTasks = getTasksByProject(proj.id);
                    if (projTasks.length === 0) return null;
                    return (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-semibold uppercase text-slate-400">
                          <span>Active Tasks ({projTasks.length})</span>
                          <span className="text-sky-500 lowercase">rachel ready</span>
                        </div>
                        {projTasks.slice(0, 3).map((task) => (
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
                                <span>Unstuck 🌸</span>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Footer Controls */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
                    Est. Value: {formatCurrency(metrics.billableAmount, client?.currency)}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteProject(proj.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition"
                    title="Delete Project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- TAB 2: CLIENTS DIRECTORY --- */}
      {activeTab === 'clients' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((c) => {
            const clientProjects = projects.filter((p) => p.clientId === c.id);
            return (
              <div
                key={c.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg text-slate-900 dark:text-slate-100">
                      {c.name}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                      {c.currency}
                    </span>
                  </div>

                  {c.company && (
                    <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mt-0.5">
                      {c.company}
                    </p>
                  )}

                  <div className="mt-3 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <p>Email: <span className="text-slate-800 dark:text-slate-200">{c.email}</span></p>
                    {c.phone && <p>Phone: <span className="text-slate-800 dark:text-slate-200">{c.phone}</span></p>}
                    <p>Default Rate: <span className="font-semibold text-slate-800 dark:text-slate-200">${c.hourlyRate || 0}/hr</span></p>
                    <p>Payment Terms: <span className="text-slate-800 dark:text-slate-200">Net {c.paymentTermsDays} days</span></p>
                  </div>

                  {c.notes && (
                    <p className="text-xs italic text-slate-400 mt-3 border-t border-slate-100 dark:border-slate-800 pt-2">
                      "{c.notes}"
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    {clientProjects.length} Active {clientProjects.length === 1 ? 'Project' : 'Projects'}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteClient(c.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition"
                    title="Delete Client"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- MODAL 1: ADD CLIENT --- */}
      {showClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Add New Client</h3>
            <p className="text-xs text-slate-500 mt-0.5">Register client details and billing terms.</p>

            <form onSubmit={handleCreateClient} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Client Name *</label>
                <input
                  type="text"
                  required
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  placeholder="e.g. Jessica Alba"
                  className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Company Name</label>
                <input
                  type="text"
                  value={newClient.company}
                  onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                  placeholder="e.g. Acme Studio"
                  className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
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
                  className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Default Rate ($/hr)</label>
                  <input
                    type="number"
                    value={newClient.hourlyRate}
                    onChange={(e) => setNewClient({ ...newClient, hourlyRate: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Payment Terms</label>
                  <select
                    value={newClient.paymentTermsDays}
                    onChange={(e) => setNewClient({ ...newClient, paymentTermsDays: parseInt(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
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
                  className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
                >
                  Create Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: ADD PROJECT --- */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-lg shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Create New Project</h3>
            <p className="text-xs text-slate-500 mt-0.5">Assign to client, configure rate and target deadline.</p>

            <form onSubmit={handleCreateProject} className="mt-4 space-y-3">
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
                  className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
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
                  className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Billing Type</label>
                  <select
                    value={newProject.billingType}
                    onChange={(e) => setNewProject({ ...newProject, billingType: e.target.value as BillingType })}
                    className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="hourly">Hourly Billing</option>
                    <option value="fixed_fee">Fixed-Fee Lump Sum</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {newProject.billingType === 'hourly' ? 'Rate ($ / Hour)' : 'Total Project Fee ($)'}
                  </label>
                  <input
                    type="number"
                    value={newProject.rate}
                    onChange={(e) => setNewProject({ ...newProject, rate: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Budget Hours (Cap)</label>
                  <input
                    type="number"
                    placeholder="e.g. 50"
                    value={newProject.budgetHours || ''}
                    onChange={(e) => setNewProject({ ...newProject, budgetHours: parseFloat(e.target.value) || undefined })}
                    className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Target Deadline</label>
                  <input
                    type="date"
                    value={newProject.deadline}
                    onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
