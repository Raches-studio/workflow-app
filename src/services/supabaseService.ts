// src/services/supabaseService.ts
import { getSupabaseClient } from '../lib/supabase';
import { Client, Project, Task, TimeLog, TaskStatus } from '../types';

// ==========================================
// Database Row Type Definitions
// ==========================================

export interface DBClient {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  currency: string;
  hourly_rate: number | null;
  payment_terms_days: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DBProject {
  id: string;
  user_id: string;
  client_id: string;
  name: string;
  description: string | null;
  billing_type: string;
  rate: number;
  budget_hours: number | null;
  budget_amount: number | null;
  deadline: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DBTask {
  id: string;
  user_id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  estimated_hours: number | null;
  due_date: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface DBTimeLog {
  id: string;
  user_id: string;
  client_id: string;
  project_id: string;
  task_id: string | null;
  description: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  is_billable: boolean;
  hourly_rate: number;
  is_invoiced: boolean;
  invoice_id: string | null;
  created_at: string;
  updated_at: string;
}

// ==========================================
// Type Mappers (camelCase <-> snake_case)
// ==========================================

export function mapClientFromDB(row: DBClient): Client {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email || '',
    phone: row.phone || undefined,
    company: row.company || undefined,
    currency: row.currency || 'USD',
    hourlyRate: row.hourly_rate != null ? Number(row.hourly_rate) : undefined,
    paymentTermsDays: row.payment_terms_days ?? 14,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapClientToDB(client: Client): DBClient {
  return {
    id: client.id,
    user_id: client.userId || 'user-default',
    name: client.name,
    email: client.email || null,
    phone: client.phone || null,
    company: client.company || null,
    currency: client.currency || 'USD',
    hourly_rate: client.hourlyRate != null ? client.hourlyRate : null,
    payment_terms_days: client.paymentTermsDays || 14,
    notes: client.notes || null,
    created_at: client.createdAt || new Date().toISOString(),
    updated_at: client.updatedAt || new Date().toISOString(),
  };
}

export function mapProjectFromDB(row: DBProject): Project {
  return {
    id: row.id,
    userId: row.user_id,
    clientId: row.client_id,
    name: row.name,
    description: row.description || undefined,
    billingType: (row.billing_type as any) || 'hourly',
    rate: Number(row.rate) || 0,
    budgetHours: row.budget_hours != null ? Number(row.budget_hours) : undefined,
    budgetAmount: row.budget_amount != null ? Number(row.budget_amount) : undefined,
    deadline: row.deadline || undefined,
    status: (row.status as any) || 'active',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapProjectToDB(project: Project): DBProject {
  return {
    id: project.id,
    user_id: project.userId || 'user-default',
    client_id: project.clientId,
    name: project.name,
    description: project.description || null,
    billing_type: project.billingType,
    rate: project.rate,
    budget_hours: project.budgetHours != null ? project.budgetHours : null,
    budget_amount: project.budgetAmount != null ? project.budgetAmount : null,
    deadline: project.deadline || null,
    status: project.status,
    created_at: project.createdAt || new Date().toISOString(),
    updated_at: project.updatedAt || new Date().toISOString(),
  };
}

export function mapTaskFromDB(row: DBTask): Task {
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    title: row.title,
    description: row.description || undefined,
    status: (row.status as any) || 'todo',
    priority: (row.priority as any) || 'medium',
    estimatedHours: row.estimated_hours != null ? Number(row.estimated_hours) : undefined,
    dueDate: row.due_date || undefined,
    orderIndex: row.order_index ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTaskToDB(task: Task): DBTask {
  return {
    id: task.id,
    user_id: task.userId || 'user-default',
    project_id: task.projectId,
    title: task.title,
    description: task.description || null,
    status: task.status,
    priority: task.priority,
    estimated_hours: task.estimatedHours != null ? task.estimatedHours : null,
    due_date: task.dueDate || null,
    order_index: task.orderIndex ?? 0,
    created_at: task.createdAt || new Date().toISOString(),
    updated_at: task.updatedAt || new Date().toISOString(),
  };
}

export function mapTimeLogFromDB(row: DBTimeLog): TimeLog {
  return {
    id: row.id,
    userId: row.user_id,
    clientId: row.client_id,
    projectId: row.project_id,
    taskId: row.task_id || undefined,
    description: row.description || '',
    startTime: row.start_time,
    endTime: row.end_time,
    durationSeconds: Number(row.duration_seconds) || 0,
    isBillable: !!row.is_billable,
    hourlyRate: Number(row.hourly_rate) || 0,
    isInvoiced: !!row.is_invoiced,
    invoiceId: row.invoice_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTimeLogToDB(timeLog: TimeLog): DBTimeLog {
  return {
    id: timeLog.id,
    user_id: timeLog.userId || 'user-default',
    client_id: timeLog.clientId,
    project_id: timeLog.projectId,
    task_id: timeLog.taskId || null,
    description: timeLog.description,
    start_time: timeLog.startTime,
    end_time: timeLog.endTime,
    duration_seconds: timeLog.durationSeconds,
    is_billable: timeLog.isBillable,
    hourly_rate: timeLog.hourlyRate,
    is_invoiced: timeLog.isInvoiced,
    invoice_id: timeLog.invoiceId || null,
    created_at: timeLog.createdAt || new Date().toISOString(),
    updated_at: timeLog.updatedAt || new Date().toISOString(),
  };
}

// ==========================================
// Data Fetching & Sync Services
// ==========================================

export class SupabaseService {
  /**
   * Fetch all clients, projects, tasks, and timeLogs from Supabase
   */
  public static async fetchAllData(): Promise<{
    clients: Client[];
    projects: Project[];
    tasks: Task[];
    timeLogs: TimeLog[];
  } | null> {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      const [clientsRes, projectsRes, tasksRes, logsRes] = await Promise.all([
        client.from('clients').select('*').order('created_at', { ascending: false }),
        client.from('projects').select('*').order('created_at', { ascending: false }),
        client.from('tasks').select('*').order('order_index', { ascending: true }),
        client.from('time_logs').select('*').order('start_time', { ascending: false }),
      ]);

      if (clientsRes.error || projectsRes.error || tasksRes.error || logsRes.error) {
        const err = clientsRes.error || projectsRes.error || tasksRes.error || logsRes.error;
        console.warn('[Supabase] Failed to fetch data from Supabase:', err?.message);
        return null;
      }

      return {
        clients: (clientsRes.data || []).map(mapClientFromDB),
        projects: (projectsRes.data || []).map(mapProjectFromDB),
        tasks: (tasksRes.data || []).map(mapTaskFromDB),
        timeLogs: (logsRes.data || []).map(mapTimeLogFromDB),
      };
    } catch (err) {
      console.warn('[Supabase] Network error during fetchAllData:', err);
      return null;
    }
  }

  // --- CLIENT CRUD ---
  public static async insertClient(clientData: Client): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;
    try {
      const { error } = await client.from('clients').insert([mapClientToDB(clientData)]);
      if (error) console.error('[Supabase] Error inserting client:', error);
      return !error;
    } catch (err) {
      console.error('[Supabase] Error inserting client:', err);
      return false;
    }
  }

  public static async updateClient(id: string, updates: Partial<Client>): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;
    try {
      const dbUpdates: Partial<DBClient> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone ?? null;
      if (updates.company !== undefined) dbUpdates.company = updates.company ?? null;
      if (updates.currency !== undefined) dbUpdates.currency = updates.currency;
      if (updates.hourlyRate !== undefined) dbUpdates.hourly_rate = updates.hourlyRate ?? null;
      if (updates.paymentTermsDays !== undefined) dbUpdates.payment_terms_days = updates.paymentTermsDays;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes ?? null;

      const { error } = await client.from('clients').update(dbUpdates).eq('id', id);
      if (error) console.error('[Supabase] Error updating client:', error);
      return !error;
    } catch (err) {
      console.error('[Supabase] Error updating client:', err);
      return false;
    }
  }

  public static async deleteClient(id: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;
    try {
      const { error } = await client.from('clients').delete().eq('id', id);
      if (error) console.error('[Supabase] Error deleting client:', error);
      return !error;
    } catch (err) {
      console.error('[Supabase] Error deleting client:', err);
      return false;
    }
  }

  // --- PROJECT CRUD ---
  public static async insertProject(projectData: Project): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;
    try {
      const { error } = await client.from('projects').insert([mapProjectToDB(projectData)]);
      if (error) console.error('[Supabase] Error inserting project:', error);
      return !error;
    } catch (err) {
      console.error('[Supabase] Error inserting project:', err);
      return false;
    }
  }

  public static async updateProject(id: string, updates: Partial<Project>): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;
    try {
      const dbUpdates: Partial<DBProject> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description ?? null;
      if (updates.billingType !== undefined) dbUpdates.billing_type = updates.billingType;
      if (updates.rate !== undefined) dbUpdates.rate = updates.rate;
      if (updates.budgetHours !== undefined) dbUpdates.budget_hours = updates.budgetHours ?? null;
      if (updates.budgetAmount !== undefined) dbUpdates.budget_amount = updates.budgetAmount ?? null;
      if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline ?? null;
      if (updates.status !== undefined) dbUpdates.status = updates.status;

      const { error } = await client.from('projects').update(dbUpdates).eq('id', id);
      if (error) console.error('[Supabase] Error updating project:', error);
      return !error;
    } catch (err) {
      console.error('[Supabase] Error updating project:', err);
      return false;
    }
  }

  public static async deleteProject(id: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;
    try {
      const { error } = await client.from('projects').delete().eq('id', id);
      if (error) console.error('[Supabase] Error deleting project:', error);
      return !error;
    } catch (err) {
      console.error('[Supabase] Error deleting project:', err);
      return false;
    }
  }

  // --- TASK CRUD ---
  public static async insertTask(taskData: Task): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;
    try {
      const { error } = await client.from('tasks').insert([mapTaskToDB(taskData)]);
      if (error) console.error('[Supabase] Error inserting task:', error);
      return !error;
    } catch (err) {
      console.error('[Supabase] Error inserting task:', err);
      return false;
    }
  }

  public static async updateTaskStatus(id: string, status: TaskStatus): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;
    try {
      const { error } = await client.from('tasks').update({
        status,
        updated_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) console.error('[Supabase] Error updating task status:', error);
      return !error;
    } catch (err) {
      console.error('[Supabase] Error updating task status:', err);
      return false;
    }
  }

  public static async deleteTask(id: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;
    try {
      const { error } = await client.from('tasks').delete().eq('id', id);
      if (error) console.error('[Supabase] Error deleting task:', error);
      return !error;
    } catch (err) {
      console.error('[Supabase] Error deleting task:', err);
      return false;
    }
  }

  // --- TIME LOG CRUD ---
  public static async insertTimeLog(logData: TimeLog): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;
    try {
      const { error } = await client.from('time_logs').insert([mapTimeLogToDB(logData)]);
      if (error) console.error('[Supabase] Error inserting time log:', error);
      return !error;
    } catch (err) {
      console.error('[Supabase] Error inserting time log:', err);
      return false;
    }
  }

  public static async deleteTimeLog(id: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;
    try {
      const { error } = await client.from('time_logs').delete().eq('id', id);
      if (error) console.error('[Supabase] Error deleting time log:', error);
      return !error;
    } catch (err) {
      console.error('[Supabase] Error deleting time log:', err);
      return false;
    }
  }

  public static async markTimeLogsInvoiced(logIds: string[], invoiceId: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client || logIds.length === 0) return false;
    try {
      const { error } = await client
        .from('time_logs')
        .update({
          is_invoiced: true,
          invoice_id: invoiceId,
          updated_at: new Date().toISOString(),
        })
        .in('id', logIds);
      if (error) console.error('[Supabase] Error marking time logs invoiced:', error);
      return !error;
    } catch (err) {
      console.error('[Supabase] Error marking time logs invoiced:', err);
      return false;
    }
  }

  // --- BATCH SEEDING ---
  /**
   * Sync/push local data into Supabase (useful for initial project setup or migrating local state)
   */
  public static async seedLocalDataToSupabase(data: {
    clients: Client[];
    projects: Project[];
    tasks: Task[];
    timeLogs: TimeLog[];
  }): Promise<{ success: boolean; message: string }> {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, message: 'Supabase client is not configured.' };
    }

    try {
      // 1. Insert clients
      if (data.clients.length > 0) {
        const { error: cErr } = await client
          .from('clients')
          .upsert(data.clients.map(mapClientToDB));
        if (cErr) throw new Error(`Clients sync failed: ${cErr.message}`);
      }

      // 2. Insert projects
      if (data.projects.length > 0) {
        const { error: pErr } = await client
          .from('projects')
          .upsert(data.projects.map(mapProjectToDB));
        if (pErr) throw new Error(`Projects sync failed: ${pErr.message}`);
      }

      // 3. Insert tasks
      if (data.tasks.length > 0) {
        const { error: tErr } = await client
          .from('tasks')
          .upsert(data.tasks.map(mapTaskToDB));
        if (tErr) throw new Error(`Tasks sync failed: ${tErr.message}`);
      }

      // 4. Insert time logs
      if (data.timeLogs.length > 0) {
        const { error: lErr } = await client
          .from('time_logs')
          .upsert(data.timeLogs.map(mapTimeLogToDB));
        if (lErr) throw new Error(`Time logs sync failed: ${lErr.message}`);
      }

      return {
        success: true,
        message: `Successfully synced ${data.clients.length} clients, ${data.projects.length} projects, ${data.tasks.length} tasks, and ${data.timeLogs.length} time logs to Supabase!`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Error syncing data to Supabase.',
      };
    }
  }
}
