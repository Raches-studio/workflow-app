// src/store/useWorkflowStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Client, 
  Project, 
  Task, 
  TimeLog, 
  CreateClientDTO, 
  CreateProjectDTO, 
  CreateTimeLogDTO, 
  TaskStatus,
  ProjectMilestone,
  Invoice,
  InvoiceStatus,
  CreateInvoiceDTO
} from '../types';
import { 
  INITIAL_CLIENTS, 
  INITIAL_PROJECTS, 
  INITIAL_TASKS, 
  INITIAL_TIMELOGS,
  INITIAL_INVOICES
} from '../mockData/initialData';
import { SupabaseService, getActiveAuthUserId } from '../services/supabaseService';
import { getSupabaseConfig, testSupabaseConnection } from '../lib/supabase';

export type SupabaseConnectionStatus = 'idle' | 'checking' | 'connected' | 'error' | 'unconfigured';

export interface ProjectMetrics {
  totalLoggedSeconds: number;
  totalLoggedHours: number;
  billableAmount: number;
  budgetHours: number;
  budgetPercentUsed: number;
  isOverBudget: boolean;
  // Fixed fee contract metrics
  contractTotal: number;
  loggedHoursValue: number;
  profitMarginAmount: number;
  profitMarginPercent: number;
  // Retainer metrics
  currentMonthHours: number;
  retainerHoursCap: number;
  retainerPercentUsed: number;
  isRetainerOverCap: boolean;
  retainerOverCapHours: number;
}

interface WorkflowState {
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  timeLogs: TimeLog[];
  invoices: Invoice[];

  // Supabase cloud status
  supabaseStatus: SupabaseConnectionStatus;
  supabaseMessage?: string;
  isSyncing: boolean;

  // Supabase Actions
  initSupabaseSync: () => Promise<void>;
  syncLocalDataToCloud: () => Promise<{ success: boolean; message: string }>;
  setSupabaseStatus: (status: SupabaseConnectionStatus, message?: string) => void;
  resetUserData: () => void;
  loadSampleData: () => void;

  // Client CRUD
  addClient: (dto: CreateClientDTO) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  // Project CRUD
  addProject: (dto: CreateProjectDTO) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addProjectMilestone: (projectId: string, milestone: Omit<ProjectMilestone, 'id' | 'status'>) => void;
  deleteProjectMilestone: (projectId: string, milestoneId: string) => void;

  // Task CRUD
  addTask: (projectId: string, title: string, estimatedHours?: number, dueDate?: string) => Task;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  deleteTask: (taskId: string) => void;

  // Time Log Operations
  addTimeLog: (dto: CreateTimeLogDTO) => TimeLog;
  deleteTimeLog: (id: string) => void;
  markTimeLogsInvoiced: (logIds: string[], invoiceId: string) => void;

  // Invoice Operations
  createInvoice: (dto: CreateInvoiceDTO) => Invoice;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => void;
  deleteInvoice: (id: string) => void;

  // Analytics & Derived Queries
  getClient: (id: string) => Client | undefined;
  getProject: (id: string) => Project | undefined;
  getProjectsByClient: (clientId: string) => Project[];
  getTasksByProject: (projectId: string) => Task[];
  getTimeLogsByProject: (projectId: string) => TimeLog[];
  getProjectMetrics: (projectId: string) => ProjectMetrics;
  getUnbilledSummary: () => {
    unbilledSeconds: number;
    unbilledHours: number;
    unbilledTotalAmount: number;
    unbilledLogsCount: number;
  };
}

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set, get) => ({
      clients: INITIAL_CLIENTS,
      projects: INITIAL_PROJECTS,
      tasks: INITIAL_TASKS,
      timeLogs: INITIAL_TIMELOGS,
      invoices: INITIAL_INVOICES,

      // Cloud status
      supabaseStatus: 'idle',
      supabaseMessage: undefined,
      isSyncing: false,

      setSupabaseStatus: (status: SupabaseConnectionStatus, message?: string) => {
        set({ supabaseStatus: status, supabaseMessage: message });
      },

      /**
       * Reset local state on user sign out to prevent cross-user data leakage
       */
      resetUserData: () => {
        set({
          clients: [],
          projects: [],
          tasks: [],
          timeLogs: [],
          invoices: [],
          supabaseStatus: 'idle',
          supabaseMessage: undefined,
          isSyncing: false,
        });
      },

      /**
       * Helper to populate sample data for demonstration / onboarding
       */
      loadSampleData: () => {
        const currentUserId = getActiveAuthUserId() || 'user-default';
        set({
          clients: INITIAL_CLIENTS.map((c) => ({ ...c, userId: currentUserId })),
          projects: INITIAL_PROJECTS.map((p) => ({ ...p, userId: currentUserId })),
          tasks: INITIAL_TASKS.map((t) => ({ ...t, userId: currentUserId })),
          timeLogs: INITIAL_TIMELOGS.map((l) => ({ ...l, userId: currentUserId })),
          invoices: INITIAL_INVOICES.map((i) => ({ ...i, userId: currentUserId })),
        });
      },

      /**
       * Connect and sync with Supabase for the authenticated user
       */
      initSupabaseSync: async () => {
        const config = getSupabaseConfig();
        if (!config.isConfigured) {
          set({
            supabaseStatus: 'unconfigured',
            supabaseMessage: 'Supabase credentials not configured yet. Running in local storage mode.',
          });
          return;
        }

        set({ supabaseStatus: 'checking', isSyncing: true });

        const testRes = await testSupabaseConnection();
        if (!testRes.success) {
          set({
            supabaseStatus: 'error',
            supabaseMessage: testRes.message,
            isSyncing: false,
          });
          return;
        }

        const currentUserId = getActiveAuthUserId();

        // Fetch cloud data for active authenticated user
        const cloudData = await SupabaseService.fetchAllData(currentUserId || undefined);
        if (cloudData) {
          const hasCloudRecords = 
            cloudData.clients.length > 0 || 
            cloudData.projects.length > 0 || 
            cloudData.tasks.length > 0 || 
            cloudData.timeLogs.length > 0 ||
            cloudData.invoices.length > 0;

          if (hasCloudRecords) {
            set({
              clients: cloudData.clients,
              projects: cloudData.projects,
              tasks: cloudData.tasks,
              timeLogs: cloudData.timeLogs,
              invoices: cloudData.invoices || [],
              supabaseStatus: 'connected',
              supabaseMessage: `Synced ${cloudData.projects.length} projects, ${cloudData.clients.length} clients, and ${cloudData.invoices.length} invoices from Supabase.`,
              isSyncing: false,
            });
            return;
          } else {
            // First time or empty database for this user
            set({
              clients: [],
              projects: [],
              tasks: [],
              timeLogs: [],
              invoices: [],
              supabaseStatus: 'connected',
              supabaseMessage: 'Connected to Supabase cloud. Workspace ready for your clients and projects.',
              isSyncing: false,
            });
            return;
          }
        }

        set({
          supabaseStatus: 'connected',
          supabaseMessage: testRes.message,
          isSyncing: false,
        });
      },

      /**
       * Manually push existing local data to Supabase under authenticated user
       */
      syncLocalDataToCloud: async () => {
        set({ isSyncing: true });
        const { clients, projects, tasks, timeLogs, invoices } = get();
        const currentUserId = getActiveAuthUserId() || undefined;
        const res = await SupabaseService.seedLocalDataToSupabase({
          clients,
          projects,
          tasks,
          timeLogs,
          invoices,
        }, currentUserId);

        if (res.success) {
          set({
            supabaseStatus: 'connected',
            supabaseMessage: res.message,
            isSyncing: false,
          });
        } else {
          set({
            supabaseStatus: 'error',
            supabaseMessage: res.message,
            isSyncing: false,
          });
        }
        return res;
      },

      // --- CLIENT CRUD ---
      addClient: (dto: CreateClientDTO) => {
        const currentUserId = getActiveAuthUserId() || 'user-default';
        const newClient: Client = {
          id: `client-${Date.now()}`,
          userId: currentUserId,
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          company: dto.company,
          currency: dto.currency || 'USD',
          hourlyRate: dto.hourlyRate,
          paymentTermsDays: dto.paymentTermsDays || 14,
          notes: dto.notes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({ clients: [newClient, ...state.clients] }));

        if (get().supabaseStatus === 'connected') {
          SupabaseService.insertClient(newClient, currentUserId).catch((err) =>
            console.error('[Supabase Sync Error]', err)
          );
        }

        return newClient;
      },

      updateClient: (id: string, updates: Partial<Client>) => {
        set((state) => ({
          clients: state.clients.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
          ),
        }));

        if (get().supabaseStatus === 'connected') {
          SupabaseService.updateClient(id, updates).catch((err) =>
            console.error('[Supabase Sync Error]', err)
          );
        }
      },

      deleteClient: (id: string) => {
        set((state) => ({
          clients: state.clients.filter((c) => c.id !== id),
          projects: state.projects.filter((p) => p.clientId !== id),
        }));

        if (get().supabaseStatus === 'connected') {
          SupabaseService.deleteClient(id).catch((err) =>
            console.error('[Supabase Sync Error]', err)
          );
        }
      },

      // --- PROJECT CRUD ---
      addProject: (dto: CreateProjectDTO) => {
        const currentUserId = getActiveAuthUserId() || 'user-default';
        const client = get().clients.find((c) => c.id === dto.clientId);
        const newProject: Project = {
          id: `proj-${Date.now()}`,
          userId: currentUserId,
          clientId: dto.clientId,
          name: dto.name,
          description: dto.description,
          billingType: dto.billingType,
          rate: dto.rate || client?.hourlyRate || 0,
          contractTotal: dto.contractTotal,
          milestones: dto.milestones || [],
          retainerMonthlyFee: dto.retainerMonthlyFee,
          retainerHoursCap: dto.retainerHoursCap,
          retainerOvertimeRate: dto.retainerOvertimeRate,
          budgetHours: dto.budgetHours,
          budgetAmount: dto.budgetAmount,
          deadline: dto.deadline,
          status: dto.status || 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({ projects: [newProject, ...state.projects] }));

        if (get().supabaseStatus === 'connected') {
          SupabaseService.insertProject(newProject, currentUserId).catch((err) =>
            console.error('[Supabase Sync Error]', err)
          );
        }

        return newProject;
      },

      updateProject: (id: string, updates: Partial<Project>) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        }));

        if (get().supabaseStatus === 'connected') {
          SupabaseService.updateProject(id, updates).catch((err) =>
            console.error('[Supabase Sync Error]', err)
          );
        }
      },

      deleteProject: (id: string) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          tasks: state.tasks.filter((t) => t.projectId !== id),
          timeLogs: state.timeLogs.filter((tl) => tl.projectId !== id),
        }));

        if (get().supabaseStatus === 'connected') {
          SupabaseService.deleteProject(id).catch((err) =>
            console.error('[Supabase Sync Error]', err)
          );
        }
      },

      addProjectMilestone: (projectId: string, milestone: Omit<ProjectMilestone, 'id' | 'status'>) => {
        const newMilestone: ProjectMilestone = {
          id: `ms-${Date.now()}`,
          ...milestone,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id === projectId) {
              const updatedMilestones = [...(p.milestones || []), newMilestone];
              return { ...p, milestones: updatedMilestones, updatedAt: new Date().toISOString() };
            }
            return p;
          }),
        }));

        const project = get().projects.find((p) => p.id === projectId);
        if (project && get().supabaseStatus === 'connected') {
          SupabaseService.updateProject(projectId, { milestones: project.milestones });
        }
      },

      deleteProjectMilestone: (projectId: string, milestoneId: string) => {
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id === projectId) {
              const updatedMilestones = (p.milestones || []).filter((m) => m.id !== milestoneId);
              return { ...p, milestones: updatedMilestones, updatedAt: new Date().toISOString() };
            }
            return p;
          }),
        }));

        const project = get().projects.find((p) => p.id === projectId);
        if (project && get().supabaseStatus === 'connected') {
          SupabaseService.updateProject(projectId, { milestones: project.milestones });
        }
      },

      // --- TASK CRUD ---
      addTask: (projectId: string, title: string, estimatedHours?: number, dueDate?: string) => {
        const currentUserId = getActiveAuthUserId() || 'user-default';
        const projectTasks = get().tasks.filter((t) => t.projectId === projectId);
        const newTask: Task = {
          id: `task-${Date.now()}`,
          userId: currentUserId,
          projectId,
          title,
          status: 'todo',
          priority: 'medium',
          estimatedHours,
          dueDate,
          orderIndex: projectTasks.length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({ tasks: [...state.tasks, newTask] }));

        if (get().supabaseStatus === 'connected') {
          SupabaseService.insertTask(newTask, currentUserId).catch((err) =>
            console.error('[Supabase Sync Error]', err)
          );
        }

        return newTask;
      },

      updateTaskStatus: (taskId: string, status: TaskStatus) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, status, updatedAt: new Date().toISOString() } : t
          ),
        }));

        if (get().supabaseStatus === 'connected') {
          SupabaseService.updateTaskStatus(taskId, status).catch((err) =>
            console.error('[Supabase Sync Error]', err)
          );
        }
      },

      deleteTask: (taskId: string) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== taskId),
        }));

        if (get().supabaseStatus === 'connected') {
          SupabaseService.deleteTask(taskId).catch((err) =>
            console.error('[Supabase Sync Error]', err)
          );
        }
      },

      // --- TIME LOG CRUD ---
      addTimeLog: (dto: CreateTimeLogDTO) => {
        const currentUserId = getActiveAuthUserId() || 'user-default';
        const project = get().projects.find((p) => p.id === dto.projectId);
        const client = project ? get().clients.find((c) => c.id === project.clientId) : undefined;
        
        const rate = dto.hourlyRate ?? project?.rate ?? client?.hourlyRate ?? 0;

        const newLog: TimeLog = {
          id: `log-${Date.now()}`,
          userId: currentUserId,
          clientId: project?.clientId || 'unassigned',
          projectId: dto.projectId,
          taskId: dto.taskId,
          description: dto.description || 'Logged work session',
          startTime: dto.startTime,
          endTime: dto.endTime,
          durationSeconds: dto.durationSeconds,
          isBillable: dto.isBillable,
          hourlyRate: rate,
          isInvoiced: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({ timeLogs: [newLog, ...state.timeLogs] }));

        if (get().supabaseStatus === 'connected') {
          SupabaseService.insertTimeLog(newLog, currentUserId).catch((err) =>
            console.error('[Supabase Sync Error]', err)
          );
        }

        return newLog;
      },

      deleteTimeLog: (id: string) => {
        set((state) => ({
          timeLogs: state.timeLogs.filter((tl) => tl.id !== id),
        }));

        if (get().supabaseStatus === 'connected') {
          SupabaseService.deleteTimeLog(id).catch((err) =>
            console.error('[Supabase Sync Error]', err)
          );
        }
      },

      markTimeLogsInvoiced: (logIds: string[], invoiceId: string) => {
        set((state) => ({
          timeLogs: state.timeLogs.map((tl) =>
            logIds.includes(tl.id)
              ? { ...tl, isInvoiced: true, invoiceId, updatedAt: new Date().toISOString() }
              : tl
          ),
        }));

        if (get().supabaseStatus === 'connected') {
          SupabaseService.markTimeLogsInvoiced(logIds, invoiceId).catch((err) =>
            console.error('[Supabase Sync Error]', err)
          );
        }
      },

      // --- INVOICE CRUD ---
      createInvoice: (dto: CreateInvoiceDTO) => {
        const currentUserId = getActiveAuthUserId() || 'user-default';
        const client = get().clients.find((c) => c.id === dto.clientId);

        const newInvoice: Invoice = {
          id: `inv-${Date.now()}`,
          userId: currentUserId,
          clientId: dto.clientId,
          clientName: client?.name || 'Valued Client',
          clientEmail: client?.email,
          clientCompany: client?.company,
          invoiceNumber: dto.invoiceNumber,
          issueDate: dto.issueDate,
          dueDate: dto.dueDate,
          status: dto.status || 'draft',
          items: dto.items,
          subtotal: dto.subtotal,
          taxRate: dto.taxRate,
          taxAmount: dto.taxAmount,
          totalAmount: dto.totalAmount,
          currency: dto.currency || client?.currency || 'USD',
          paymentTermsDays: dto.paymentTermsDays || client?.paymentTermsDays || 14,
          notes: dto.notes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // 1. Mark selected time logs as invoiced
        const logIdsToInvoice = dto.items
          .filter((item) => item.type === 'hourly_log' && item.timeLogId)
          .map((item) => item.timeLogId as string);

        if (logIdsToInvoice.length > 0) {
          get().markTimeLogsInvoiced(logIdsToInvoice, newInvoice.id);
        }

        // 2. Mark selected project milestones as invoiced
        const milestoneItems = dto.items.filter((item) => item.type === 'milestone' && item.milestoneId);
        if (milestoneItems.length > 0) {
          set((state) => ({
            projects: state.projects.map((p) => {
              if (!p.milestones || p.milestones.length === 0) return p;
              let hasChanges = false;
              const updatedMilestones = p.milestones.map((m) => {
                const match = milestoneItems.find((item) => item.milestoneId === m.id);
                if (match) {
                  hasChanges = true;
                  return { ...m, status: 'invoiced' as const, invoiceId: newInvoice.id };
                }
                return m;
              });
              return hasChanges ? { ...p, milestones: updatedMilestones, updatedAt: new Date().toISOString() } : p;
            }),
          }));

          // Sync updated projects to Supabase
          if (get().supabaseStatus === 'connected') {
            milestoneItems.forEach((item) => {
              if (item.projectId) {
                const p = get().projects.find((proj) => proj.id === item.projectId);
                if (p) SupabaseService.updateProject(p.id, { milestones: p.milestones });
              }
            });
          }
        }

        // 3. Add invoice to store
        set((state) => ({ invoices: [newInvoice, ...state.invoices] }));

        if (get().supabaseStatus === 'connected') {
          SupabaseService.insertInvoice(newInvoice, currentUserId).catch((err) =>
            console.error('[Supabase Sync Error]', err)
          );
        }

        return newInvoice;
      },

      updateInvoiceStatus: (id: string, status: InvoiceStatus) => {
        set((state) => {
          const invoice = state.invoices.find((i) => i.id === id);
          const updatedInvoices = state.invoices.map((inv) =>
            inv.id === id ? { ...inv, status, updatedAt: new Date().toISOString() } : inv
          );

          // If marked paid, also mark linked milestones as paid
          let updatedProjects = state.projects;
          if (status === 'paid' && invoice) {
            const milestoneIds = invoice.items
              .filter((item) => item.type === 'milestone' && item.milestoneId)
              .map((item) => item.milestoneId);

            if (milestoneIds.length > 0) {
              updatedProjects = state.projects.map((p) => {
                if (!p.milestones) return p;
                return {
                  ...p,
                  milestones: p.milestones.map((m) =>
                    milestoneIds.includes(m.id) ? { ...m, status: 'paid' as const } : m
                  ),
                };
              });
            }
          }

          return {
            invoices: updatedInvoices,
            projects: updatedProjects,
          };
        });

        if (get().supabaseStatus === 'connected') {
          SupabaseService.updateInvoiceStatus(id, status).catch((err) =>
            console.error('[Supabase Sync Error]', err)
          );
        }
      },

      deleteInvoice: (id: string) => {
        const invoice = get().invoices.find((i) => i.id === id);
        if (!invoice) return;

        // Revert time logs and milestones back to unbilled
        const logIds = invoice.items
          .filter((item) => item.type === 'hourly_log' && item.timeLogId)
          .map((item) => item.timeLogId as string);

        const milestoneIds = invoice.items
          .filter((item) => item.type === 'milestone' && item.milestoneId)
          .map((item) => item.milestoneId);

        set((state) => ({
          invoices: state.invoices.filter((inv) => inv.id !== id),
          timeLogs: state.timeLogs.map((tl) =>
            logIds.includes(tl.id) ? { ...tl, isInvoiced: false, invoiceId: undefined } : tl
          ),
          projects: state.projects.map((p) => {
            if (!p.milestones) return p;
            return {
              ...p,
              milestones: p.milestones.map((m) =>
                milestoneIds.includes(m.id) ? { ...m, status: 'pending' as const, invoiceId: undefined } : m
              ),
            };
          }),
        }));

        if (get().supabaseStatus === 'connected') {
          SupabaseService.deleteInvoice(id).catch((err) =>
            console.error('[Supabase Sync Error]', err)
          );
        }
      },

      // --- ANALYTICS & QUERIES ---
      getClient: (id: string) => get().clients.find((c) => c.id === id),
      getProject: (id: string) => get().projects.find((p) => p.id === id),
      getProjectsByClient: (clientId: string) =>
        get().projects.filter((p) => p.clientId === clientId),
      getTasksByProject: (projectId: string) =>
        get().tasks.filter((t) => t.projectId === projectId),
      getTimeLogsByProject: (projectId: string) =>
        get().timeLogs.filter((tl) => tl.projectId === projectId),

      getProjectMetrics: (projectId: string): ProjectMetrics => {
        const logs = get().timeLogs.filter((tl) => tl.projectId === projectId);
        const project = get().projects.find((p) => p.id === projectId);
        const client = project ? get().clients.find((c) => c.id === project.clientId) : undefined;

        const totalLoggedSeconds = logs.reduce((sum, log) => sum + log.durationSeconds, 0);
        const totalLoggedHours = Number((totalLoggedSeconds / 3600).toFixed(2));

        const effectiveHourlyRate = project?.rate || client?.hourlyRate || 85;

        // Value of logged team hours
        const loggedHoursValue = totalLoggedHours * effectiveHourlyRate;

        // Fixed-Fee Profit Margin calculation
        const contractTotal = project?.contractTotal || project?.budgetAmount || (project?.billingType === 'fixed_fee' ? project?.rate : 0) || 0;
        const profitMarginAmount = contractTotal - loggedHoursValue;
        const profitMarginPercent = contractTotal > 0 ? (profitMarginAmount / contractTotal) * 100 : 0;

        // Retainer Monthly Tracking
        const now = new Date();
        const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const currentMonthLogs = logs.filter((l) => l.startTime.startsWith(currentYearMonth));
        const currentMonthSeconds = currentMonthLogs.reduce((sum, l) => sum + l.durationSeconds, 0);
        const currentMonthHours = Number((currentMonthSeconds / 3600).toFixed(2));
        const retainerHoursCap = project?.retainerHoursCap || project?.budgetHours || 0;
        const retainerPercentUsed = retainerHoursCap > 0 ? (currentMonthHours / retainerHoursCap) * 100 : 0;
        const isRetainerOverCap = retainerHoursCap > 0 && currentMonthHours > retainerHoursCap;
        const retainerOverCapHours = Math.max(0, currentMonthHours - retainerHoursCap);

        // General billable amount
        const billableAmount = logs
          .filter((l) => l.isBillable)
          .reduce((sum, log) => {
            const hours = log.durationSeconds / 3600;
            return sum + hours * (log.hourlyRate || effectiveHourlyRate);
          }, 0);

        const budgetHours = project?.budgetHours || 0;
        const budgetPercentUsed = budgetHours > 0 ? (totalLoggedHours / budgetHours) * 100 : 0;
        const isOverBudget = budgetHours > 0 && totalLoggedHours > budgetHours;

        return {
          totalLoggedSeconds,
          totalLoggedHours,
          billableAmount: Math.round(billableAmount * 100) / 100,
          budgetHours,
          budgetPercentUsed: Math.min(Math.round(budgetPercentUsed), 100),
          isOverBudget,
          // Fixed-fee contract metrics
          contractTotal,
          loggedHoursValue: Math.round(loggedHoursValue * 100) / 100,
          profitMarginAmount: Math.round(profitMarginAmount * 100) / 100,
          profitMarginPercent: Math.round(profitMarginPercent * 10) / 10,
          // Retainer metrics
          currentMonthHours,
          retainerHoursCap,
          retainerPercentUsed: Math.min(Math.round(retainerPercentUsed), 100),
          isRetainerOverCap,
          retainerOverCapHours,
        };
      },

      getUnbilledSummary: () => {
        const unbilledLogs = get().timeLogs.filter((l) => l.isBillable && !l.isInvoiced);
        const projects = get().projects;

        let unbilledSeconds = 0;
        let unbilledTotalAmount = 0;

        unbilledLogs.forEach((log) => {
          unbilledSeconds += log.durationSeconds;
          const project = projects.find((p) => p.id === log.projectId);
          const rate = log.hourlyRate || project?.rate || 0;
          unbilledTotalAmount += (log.durationSeconds / 3600) * rate;
        });

        return {
          unbilledSeconds,
          unbilledHours: Number((unbilledSeconds / 3600).toFixed(1)),
          unbilledTotalAmount: Math.round(unbilledTotalAmount * 100) / 100,
          unbilledLogsCount: unbilledLogs.length,
        };
      },
    }),
    {
      name: 'workerhub_workflow_storage',
      partialize: (state) => ({
        clients: state.clients,
        projects: state.projects,
        tasks: state.tasks,
        timeLogs: state.timeLogs,
        invoices: state.invoices,
      }),
    }
  )
);
