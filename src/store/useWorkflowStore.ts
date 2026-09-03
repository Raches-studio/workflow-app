// src/store/useWorkflowStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  Client, 
  Project, 
  Task, 
  TimeLog, 
  CreateClientDTO, 
  CreateProjectDTO, 
  CreateTimeLogDTO,
  TaskStatus
} from '../types';
import { 
  INITIAL_CLIENTS, 
  INITIAL_PROJECTS, 
  INITIAL_TASKS, 
  INITIAL_TIMELOGS 
} from '../mockData/initialData';

interface WorkflowState {
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  timeLogs: TimeLog[];

  // Client CRUD
  addClient: (dto: CreateClientDTO) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  // Project CRUD
  addProject: (dto: CreateProjectDTO) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Task CRUD
  addTask: (projectId: string, title: string, estimatedHours?: number, dueDate?: string) => Task;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  deleteTask: (taskId: string) => void;

  // Time Log Operations
  addTimeLog: (dto: CreateTimeLogDTO) => TimeLog;
  deleteTimeLog: (id: string) => void;
  markTimeLogsInvoiced: (logIds: string[], invoiceId: string) => void;

  // Analytics & Derived Queries
  getClient: (id: string) => Client | undefined;
  getProject: (id: string) => Project | undefined;
  getProjectsByClient: (clientId: string) => Project[];
  getTasksByProject: (projectId: string) => Task[];
  getTimeLogsByProject: (projectId: string) => TimeLog[];
  getProjectMetrics: (projectId: string) => {
    totalLoggedSeconds: number;
    totalLoggedHours: number;
    billableAmount: number;
    budgetHours: number;
    budgetPercentUsed: number;
    isOverBudget: boolean;
  };
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

      // --- CLIENT CRUD ---
      addClient: (dto: CreateClientDTO) => {
        const newClient: Client = {
          id: `client-${Date.now()}`,
          userId: 'user-default',
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
        return newClient;
      },

      updateClient: (id: string, updates: Partial<Client>) => {
        set((state) => ({
          clients: state.clients.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
          ),
        }));
      },

      deleteClient: (id: string) => {
        set((state) => ({
          clients: state.clients.filter((c) => c.id !== id),
          // Cascade or retain projects depending on policy - here we flag/filter
          projects: state.projects.filter((p) => p.clientId !== id),
        }));
      },

      // --- PROJECT CRUD ---
      addProject: (dto: CreateProjectDTO) => {
        const client = get().clients.find((c) => c.id === dto.clientId);
        const newProject: Project = {
          id: `proj-${Date.now()}`,
          userId: 'user-default',
          clientId: dto.clientId,
          name: dto.name,
          description: dto.description,
          billingType: dto.billingType,
          rate: dto.rate || client?.hourlyRate || 0,
          budgetHours: dto.budgetHours,
          budgetAmount: dto.budgetAmount,
          deadline: dto.deadline,
          status: dto.status || 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({ projects: [newProject, ...state.projects] }));
        return newProject;
      },

      updateProject: (id: string, updates: Partial<Project>) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      deleteProject: (id: string) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          tasks: state.tasks.filter((t) => t.projectId !== id),
          timeLogs: state.timeLogs.filter((tl) => tl.projectId !== id),
        }));
      },

      // --- TASK CRUD ---
      addTask: (projectId: string, title: string, estimatedHours?: number, dueDate?: string) => {
        const projectTasks = get().tasks.filter((t) => t.projectId === projectId);
        const newTask: Task = {
          id: `task-${Date.now()}`,
          userId: 'user-default',
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
        return newTask;
      },

      updateTaskStatus: (taskId: string, status: TaskStatus) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, status, updatedAt: new Date().toISOString() } : t
          ),
        }));
      },

      deleteTask: (taskId: string) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== taskId),
        }));
      },

      // --- TIME LOG CRUD ---
      addTimeLog: (dto: CreateTimeLogDTO) => {
        const project = get().projects.find((p) => p.id === dto.projectId);
        const client = project ? get().clients.find((c) => c.id === project.clientId) : undefined;
        
        // Determine applicable hourly rate
        const rate = dto.hourlyRate ?? project?.rate ?? client?.hourlyRate ?? 0;

        const newLog: TimeLog = {
          id: `log-${Date.now()}`,
          userId: 'user-default',
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
        return newLog;
      },

      deleteTimeLog: (id: string) => {
        set((state) => ({
          timeLogs: state.timeLogs.filter((tl) => tl.id !== id),
        }));
      },

      markTimeLogsInvoiced: (logIds: string[], invoiceId: string) => {
        set((state) => ({
          timeLogs: state.timeLogs.map((tl) =>
            logIds.includes(tl.id)
              ? { ...tl, isInvoiced: true, invoiceId, updatedAt: new Date().toISOString() }
              : tl
          ),
        }));
      },

      // --- SELECTORS & ANALYTICS ---
      getClient: (id: string) => get().clients.find((c) => c.id === id),
      getProject: (id: string) => get().projects.find((p) => p.id === id),
      getProjectsByClient: (clientId: string) => get().projects.filter((p) => p.clientId === clientId),
      getTasksByProject: (projectId: string) => get().tasks.filter((t) => t.projectId === projectId),
      getTimeLogsByProject: (projectId: string) => get().timeLogs.filter((tl) => tl.projectId === projectId),

      getProjectMetrics: (projectId: string) => {
        const project = get().projects.find((p) => p.id === projectId);
        const logs = get().timeLogs.filter((tl) => tl.projectId === projectId);

        const totalLoggedSeconds = logs.reduce((acc, l) => acc + l.durationSeconds, 0);
        const totalLoggedHours = parseFloat((totalLoggedSeconds / 3600).toFixed(2));

        let billableAmount = 0;
        if (project?.billingType === 'fixed_fee') {
          billableAmount = project.rate;
        } else {
          billableAmount = logs
            .filter((l) => l.isBillable)
            .reduce((acc, l) => acc + (l.durationSeconds / 3600) * l.hourlyRate, 0);
        }

        const budgetHours = project?.budgetHours || 0;
        const budgetPercentUsed = budgetHours > 0 
          ? Math.min(Math.round((totalLoggedHours / budgetHours) * 100), 999) 
          : 0;

        return {
          totalLoggedSeconds,
          totalLoggedHours,
          billableAmount: Math.round(billableAmount * 100) / 100,
          budgetHours,
          budgetPercentUsed,
          isOverBudget: budgetHours > 0 && totalLoggedHours > budgetHours,
        };
      },

      getUnbilledSummary: () => {
        const unbilled = get().timeLogs.filter((l) => !l.isInvoiced && l.isBillable);
        const unbilledSeconds = unbilled.reduce((acc, l) => acc + l.durationSeconds, 0);
        const unbilledHours = parseFloat((unbilledSeconds / 3600).toFixed(2));
        const unbilledTotalAmount = unbilled.reduce(
          (acc, l) => acc + (l.durationSeconds / 3600) * l.hourlyRate,
          0
        );

        return {
          unbilledSeconds,
          unbilledHours,
          unbilledTotalAmount: Math.round(unbilledTotalAmount * 100) / 100,
          unbilledLogsCount: unbilled.length,
        };
      },
    }),
    {
      name: 'workflow-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
