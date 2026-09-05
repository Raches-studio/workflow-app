import { getSupabaseClient } from '../lib/supabase';
import { 
  Client, 
  Project, 
  Task, 
  TimeLog, 
  TaskStatus, 
  UserProfile, 
  UserRole, 
  ApprovalStatus, 
  Invoice, 
  InvoiceStatus,
  PaymentSettings,
  PaymentProvider
} from '../types';

// ==========================================
// Database Row Type Definitions
// ==========================================

export interface DBProfile {
  id: string;
  full_name: string;
  business_name: string | null;
  email: string;
  role: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DBPaymentSettings {
  id: string;
  user_id: string;
  active_provider: string;
  paypal_email: string | null;
  paypal_client_id: string | null;
  paystack_public_key: string | null;
  paystack_secret_key: string | null;
  flutterwave_public_key: string | null;
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
  routing_or_sort_code: string | null;
  swift_bic: string | null;
  payment_instructions: string | null;
  custom_payment_url: string | null;
  is_configured: boolean;
  created_at?: string;
  updated_at?: string;
}

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
  portal_token: string | null;
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
  contract_total: number | null;
  milestones: any;
  retainer_monthly_fee: number | null;
  retainer_hours_cap: number | null;
  retainer_overtime_rate: number | null;
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
  approval_status: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface DBInvoice {
  id: string;
  user_id: string;
  client_id: string;
  client_name: string;
  client_email: string | null;
  client_company: string | null;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  payment_terms_days: number;
  notes: string | null;
  items: any;
  created_at: string;
  updated_at: string;
}

// Active user session cache to guarantee RLS conformance
let activeAuthUserId: string | null = null;

export function setActiveAuthUserId(id: string | null): void {
  activeAuthUserId = id;
}

export function getActiveAuthUserId(): string | null {
  return activeAuthUserId;
}

// ==========================================
// Type Mappers (camelCase <-> snake_case)
// ==========================================

export function mapProfileFromDB(row: DBProfile): UserProfile {
  return {
    id: row.id,
    fullName: row.full_name || '',
    businessName: row.business_name || undefined,
    email: row.email || '',
    role: (row.role as UserRole) || 'admin',
    avatarUrl: row.avatar_url || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

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
    portalToken: row.portal_token || undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapClientToDB(client: Client, userIdOverride?: string): DBClient {
  const finalUserId = userIdOverride || (client.userId && client.userId !== 'user-default' ? client.userId : (activeAuthUserId || 'user-default'));
  return {
    id: client.id,
    user_id: finalUserId,
    name: client.name,
    email: client.email || null,
    phone: client.phone || null,
    company: client.company || null,
    currency: client.currency || 'USD',
    hourly_rate: client.hourlyRate != null ? client.hourlyRate : null,
    payment_terms_days: client.paymentTermsDays || 14,
    portal_token: client.portalToken || null,
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
    contractTotal: row.contract_total != null ? Number(row.contract_total) : undefined,
    milestones: Array.isArray(row.milestones) ? row.milestones : [],
    retainerMonthlyFee: row.retainer_monthly_fee != null ? Number(row.retainer_monthly_fee) : undefined,
    retainerHoursCap: row.retainer_hours_cap != null ? Number(row.retainer_hours_cap) : undefined,
    retainerOvertimeRate: row.retainer_overtime_rate != null ? Number(row.retainer_overtime_rate) : undefined,
    budgetHours: row.budget_hours != null ? Number(row.budget_hours) : undefined,
    budgetAmount: row.budget_amount != null ? Number(row.budget_amount) : undefined,
    deadline: row.deadline || undefined,
    status: (row.status as any) || 'active',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapProjectToDB(project: Project, userIdOverride?: string): DBProject {
  const finalUserId = userIdOverride || (project.userId && project.userId !== 'user-default' ? project.userId : (activeAuthUserId || 'user-default'));
  return {
    id: project.id,
    user_id: finalUserId,
    client_id: project.clientId,
    name: project.name,
    description: project.description || null,
    billing_type: project.billingType,
    rate: project.rate,
    contract_total: project.contractTotal != null ? project.contractTotal : null,
    milestones: project.milestones || [],
    retainer_monthly_fee: project.retainerMonthlyFee != null ? project.retainerMonthlyFee : null,
    retainer_hours_cap: project.retainerHoursCap != null ? project.retainerHoursCap : null,
    retainer_overtime_rate: project.retainerOvertimeRate != null ? project.retainerOvertimeRate : null,
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

export function mapTaskToDB(task: Task, userIdOverride?: string): DBTask {
  const finalUserId = userIdOverride || (task.userId && task.userId !== 'user-default' ? task.userId : (activeAuthUserId || 'user-default'));
  return {
    id: task.id,
    user_id: finalUserId,
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
    approvalStatus: (row.approval_status as ApprovalStatus) || 'draft',
    submittedAt: row.submitted_at || undefined,
    reviewedAt: row.reviewed_at || undefined,
    reviewedBy: row.reviewed_by || undefined,
    rejectionReason: row.rejection_reason || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTimeLogToDB(timeLog: TimeLog, userIdOverride?: string): DBTimeLog {
  const finalUserId = userIdOverride || (timeLog.userId && timeLog.userId !== 'user-default' ? timeLog.userId : (activeAuthUserId || 'user-default'));
  return {
    id: timeLog.id,
    user_id: finalUserId,
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
    approval_status: timeLog.approvalStatus || 'draft',
    submitted_at: timeLog.submittedAt || null,
    reviewed_at: timeLog.reviewedAt || null,
    reviewed_by: timeLog.reviewedBy || null,
    rejection_reason: timeLog.rejectionReason || null,
    created_at: timeLog.createdAt || new Date().toISOString(),
    updated_at: timeLog.updatedAt || new Date().toISOString(),
  };
}

export function mapInvoiceFromDB(row: DBInvoice): Invoice {
  return {
    id: row.id,
    userId: row.user_id,
    clientId: row.client_id,
    clientName: row.client_name,
    clientEmail: row.client_email || undefined,
    clientCompany: row.client_company || undefined,
    invoiceNumber: row.invoice_number,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    status: (row.status as InvoiceStatus) || 'draft',
    subtotal: Number(row.subtotal) || 0,
    taxRate: Number(row.tax_rate) || 0,
    taxAmount: Number(row.tax_amount) || 0,
    totalAmount: Number(row.total_amount) || 0,
    currency: row.currency || 'USD',
    paymentTermsDays: row.payment_terms_days ?? 14,
    notes: row.notes || undefined,
    items: Array.isArray(row.items) ? row.items : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapInvoiceToDB(invoice: Invoice, userIdOverride?: string): DBInvoice {
  const finalUserId = userIdOverride || (invoice.userId && invoice.userId !== 'user-default' ? invoice.userId : (activeAuthUserId || 'user-default'));
  return {
    id: invoice.id,
    user_id: finalUserId,
    client_id: invoice.clientId,
    client_name: invoice.clientName,
    client_email: invoice.clientEmail || null,
    client_company: invoice.clientCompany || null,
    invoice_number: invoice.invoiceNumber,
    issue_date: invoice.issueDate,
    due_date: invoice.dueDate,
    status: invoice.status,
    subtotal: invoice.subtotal,
    tax_rate: invoice.taxRate,
    tax_amount: invoice.taxAmount,
    total_amount: invoice.totalAmount,
    currency: invoice.currency,
    payment_terms_days: invoice.paymentTermsDays,
    notes: invoice.notes || null,
    items: invoice.items,
    created_at: invoice.createdAt || new Date().toISOString(),
    updated_at: invoice.updatedAt || new Date().toISOString(),
  };
}

export function mapPaymentSettingsFromDB(row: DBPaymentSettings): PaymentSettings {
  return {
    id: row.id,
    userId: row.user_id,
    activeProvider: (row.active_provider as PaymentProvider) || 'paypal',
    paypalEmail: row.paypal_email || undefined,
    paypalClientId: row.paypal_client_id || undefined,
    paystackPublicKey: row.paystack_public_key || undefined,
    paystackSecretKey: row.paystack_secret_key || undefined,
    flutterwavePublicKey: row.flutterwave_public_key || undefined,
    bankName: row.bank_name || undefined,
    accountName: row.account_name || undefined,
    accountNumber: row.account_number || undefined,
    routingOrSortCode: row.routing_or_sort_code || undefined,
    swiftBic: row.swift_bic || undefined,
    paymentInstructions: row.payment_instructions || undefined,
    customPaymentUrl: row.custom_payment_url || undefined,
    isConfigured: row.is_configured ?? false,
    updatedAt: row.updated_at,
  };
}

export function mapPaymentSettingsToDB(settings: PaymentSettings, userIdOverride?: string): DBPaymentSettings {
  const finalUserId = userIdOverride || (settings.userId && settings.userId !== 'user-default' ? settings.userId : (activeAuthUserId || 'user-default'));
  return {
    id: settings.id || `ps-${finalUserId}`,
    user_id: finalUserId,
    active_provider: settings.activeProvider || 'paypal',
    paypal_email: settings.paypalEmail || null,
    paypal_client_id: settings.paypalClientId || null,
    paystack_public_key: settings.paystackPublicKey || null,
    paystack_secret_key: settings.paystackSecretKey || null,
    flutterwave_public_key: settings.flutterwavePublicKey || null,
    bank_name: settings.bankName || null,
    account_name: settings.accountName || null,
    account_number: settings.accountNumber || null,
    routing_or_sort_code: settings.routingOrSortCode || null,
    swift_bic: settings.swiftBic || null,
    payment_instructions: settings.paymentInstructions || null,
    custom_payment_url: settings.customPaymentUrl || null,
    is_configured: settings.isConfigured ?? false,
    updated_at: new Date().toISOString(),
  };
}

// ==========================================
// Data Fetching & Sync Services
// ==========================================

export class SupabaseService {
  /**
   * Fetch all clients, projects, tasks, timeLogs, and invoices for authenticated user
   */
  public static async fetchAllData(userId?: string): Promise<{
    clients: Client[];
    projects: Project[];
    tasks: Task[];
    timeLogs: TimeLog[];
    invoices: Invoice[];
  } | null> {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      const [clientsRes, projectsRes, tasksRes, logsRes, invoicesRes] = await Promise.all([
        client.from('clients').select('*').order('created_at', { ascending: false }),
        client.from('projects').select('*').order('created_at', { ascending: false }),
        client.from('tasks').select('*').order('order_index', { ascending: true }),
        client.from('time_logs').select('*').order('start_time', { ascending: false }),
        client.from('invoices').select('*').order('issue_date', { ascending: false }),
      ]);

      if (clientsRes.error || projectsRes.error || tasksRes.error || logsRes.error) {
        const err = clientsRes.error || projectsRes.error || tasksRes.error || logsRes.error;
        console.warn('[Supabase] Failed to fetch data from Supabase:', err?.message);
        return null;
      }

      const clients = (clientsRes.data || []).map(mapClientFromDB);
      const projects = (projectsRes.data || []).map(mapProjectFromDB);
      const tasks = (tasksRes.data || []).map(mapTaskFromDB);
      const timeLogs = (logsRes.data || []).map(mapTimeLogFromDB);
      const invoices = (invoicesRes.data || []).map(mapInvoiceFromDB);

      return {
        clients: userId ? clients.filter(c => !c.userId || c.userId === userId) : clients,
        projects: userId ? projects.filter(p => !p.userId || p.userId === userId) : projects,
        tasks: userId ? tasks.filter(t => !t.userId || t.userId === userId) : tasks,
        timeLogs: userId ? timeLogs.filter(l => !l.userId || l.userId === userId) : timeLogs,
        invoices: userId ? invoices.filter(i => !i.userId || i.userId === userId) : invoices,
      };
    } catch (err) {
      console.warn('[Supabase] Network error during fetchAllData:', err);
      return null;
    }
  }

  // --- USER PROFILE SERVICES ---
  public static async getProfile(userId: string): Promise<UserProfile | null> {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('[Supabase] Error fetching profile:', error.message);
        return null;
      }
      return data ? mapProfileFromDB(data) : null;
    } catch (err) {
      console.warn('[Supabase] Network error fetching profile:', err);
      return null;
    }
  }

  public static async upsertProfile(profile: Partial<UserProfile> & { id: string; email: string }): Promise<UserProfile | null> {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      const payload: Record<string, any> = {
        id: profile.id,
        email: profile.email,
        updated_at: new Date().toISOString(),
      };
      if (profile.fullName !== undefined) payload.full_name = profile.fullName;
      if (profile.businessName !== undefined) payload.business_name = profile.businessName;
      if (profile.role !== undefined) payload.role = profile.role;
      if (profile.avatarUrl !== undefined) payload.avatar_url = profile.avatarUrl;

      const { data, error } = await client
        .from('profiles')
        .upsert(payload)
        .select()
        .maybeSingle();

      if (error) {
        console.warn('[Supabase] Error upserting profile:', error.message);
        return null;
      }
      return data ? mapProfileFromDB(data) : null;
    } catch (err) {
      console.warn('[Supabase] Network error upserting profile:', err);
      return null;
    }
  }

  // --- CLIENT CRUD ---
  public static async insertClient(clientData: Client, userId?: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;
    try {
      const dbRow = mapClientToDB(clientData, userId);
      const { error } = await client.from('clients').insert([dbRow]);
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
  public static async insertProject(projectData: Project, userId?: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;
    try {
      const dbRow = mapProjectToDB(projectData, userId);
      const { error } = await client.from('projects').insert([dbRow]);
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
      if (updates.contractTotal !== undefined) dbUpdates.contract_total = updates.contractTotal ?? null;
      if (updates.milestones !== undefined) dbUpdates.milestones = updates.milestones;
      if (updates.retainerMonthlyFee !== undefined) dbUpdates.retainer_monthly_fee = updates.retainerMonthlyFee ?? null;
      if (updates.retainerHoursCap !== undefined) dbUpdates.retainer_hours_cap = updates.retainerHoursCap ?? null;
      if (updates.retainerOvertimeRate !== undefined) dbUpdates.retainer_overtime_rate = updates.retainerOvertimeRate ?? null;
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
  public static async insertTask(taskData: Task, userId?: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;
    try {
      const dbRow = mapTaskToDB(taskData, userId);
      const { error } = await client.from('tasks').insert([dbRow]);
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
  public static async insertTimeLog(logData: TimeLog, userId?: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;
    try {
      const dbRow = mapTimeLogToDB(logData, userId);
      const { error } = await client.from('time_logs').insert([dbRow]);
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

  // --- INVOICE CRUD ---
  public static async insertInvoice(invoiceData: Invoice, userId?: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;
    try {
      const dbRow = mapInvoiceToDB(invoiceData, userId);
      const { error } = await client.from('invoices').insert([dbRow]);
      if (error) console.error('[Supabase] Error inserting invoice:', error);
      return !error;
    } catch (err) {
      console.error('[Supabase] Error inserting invoice:', err);
      return false;
    }
  }

  public static async updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;
    try {
      const { error } = await client
        .from('invoices')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) console.error('[Supabase] Error updating invoice status:', error);
      return !error;
    } catch (err) {
      console.error('[Supabase] Error updating invoice status:', err);
      return false;
    }
  }

  public static async deleteInvoice(id: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;
    try {
      const { error } = await client.from('invoices').delete().eq('id', id);
      if (error) console.error('[Supabase] Error deleting invoice:', error);
      return !error;
    } catch (err) {
      console.error('[Supabase] Error deleting invoice:', err);
      return false;
    }
  }

  // --- BATCH SEEDING ---
  /**
   * Sync/push local data into Supabase scoped to the authenticated user
   */
  public static async seedLocalDataToSupabase(data: {
    clients: Client[];
    projects: Project[];
    tasks: Task[];
    timeLogs: TimeLog[];
    invoices?: Invoice[];
  }, userId?: string): Promise<{ success: boolean; message: string }> {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, message: 'Supabase client is not configured.' };
    }

    try {
      // 1. Insert clients
      if (data.clients.length > 0) {
        const { error: cErr } = await client
          .from('clients')
          .upsert(data.clients.map(c => mapClientToDB(c, userId)));
        if (cErr) throw new Error(`Clients sync failed: ${cErr.message}`);
      }

      // 2. Insert projects
      if (data.projects.length > 0) {
        const { error: pErr } = await client
          .from('projects')
          .upsert(data.projects.map(p => mapProjectToDB(p, userId)));
        if (pErr) throw new Error(`Projects sync failed: ${pErr.message}`);
      }

      // 3. Insert tasks
      if (data.tasks.length > 0) {
        const { error: tErr } = await client
          .from('tasks')
          .upsert(data.tasks.map(t => mapTaskToDB(t, userId)));
        if (tErr) throw new Error(`Tasks sync failed: ${tErr.message}`);
      }

      // 4. Insert time logs
      if (data.timeLogs.length > 0) {
        const { error: lErr } = await client
          .from('time_logs')
          .upsert(data.timeLogs.map(l => mapTimeLogToDB(l, userId)));
        if (lErr) throw new Error(`Time logs sync failed: ${lErr.message}`);
      }

      // 5. Insert invoices if present
      if (data.invoices && data.invoices.length > 0) {
        const { error: iErr } = await client
          .from('invoices')
          .upsert(data.invoices.map(i => mapInvoiceToDB(i, userId)));
        if (iErr) console.warn('Invoices sync notice (table may need creation):', iErr.message);
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

  // --- PAYMENT SETTINGS CRUD ---
  public static async getPaymentSettings(userId?: string): Promise<PaymentSettings | null> {
    const client = getSupabaseClient();
    if (!client) return null;
    const targetUserId = userId || activeAuthUserId;
    if (!targetUserId) return null;

    try {
      const { data, error } = await client
        .from('payment_settings')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (error) {
        console.warn('[Supabase] Payment settings fetch warning:', error.message);
        return null;
      }
      return data ? mapPaymentSettingsFromDB(data) : null;
    } catch (err) {
      console.warn('[Supabase] Network error fetching payment settings:', err);
      return null;
    }
  }

  public static async savePaymentSettings(settings: PaymentSettings, userId?: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;
    const finalUserId = userId || activeAuthUserId;

    try {
      const dbRow = mapPaymentSettingsToDB(settings, finalUserId || undefined);
      const { error } = await client.from('payment_settings').upsert(dbRow);
      if (error) console.error('[Supabase] Error saving payment settings:', error);
      return !error;
    } catch (err) {
      console.error('[Supabase] Error saving payment settings:', err);
      return false;
    }
  }

  // --- TIME LOG APPROVAL SERVICES ---
  public static async updateTimeLogApproval(
    logId: string, 
    status: ApprovalStatus, 
    reviewedBy?: string, 
    rejectionReason?: string
  ): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;

    try {
      const updates: Record<string, any> = {
        approval_status: status,
        updated_at: new Date().toISOString(),
      };
      if (status === 'submitted') {
        updates.submitted_at = new Date().toISOString();
      } else if (status === 'approved') {
        updates.reviewed_at = new Date().toISOString();
        updates.reviewed_by = reviewedBy || 'Admin';
        updates.rejection_reason = null;
      } else if (status === 'rejected') {
        updates.reviewed_at = new Date().toISOString();
        updates.reviewed_by = reviewedBy || 'Admin';
        updates.rejection_reason = rejectionReason || 'Requires revision';
      }

      const { error } = await client.from('time_logs').update(updates).eq('id', logId);
      if (error) console.error('[Supabase] Error updating log approval:', error);
      return !error;
    } catch (err) {
      console.error('[Supabase] Error updating log approval:', err);
      return false;
    }
  }

  public static async updateTimeLogsBatchApproval(
    logIds: string[], 
    status: ApprovalStatus, 
    reviewedBy?: string, 
    rejectionReason?: string
  ): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client || logIds.length === 0) return false;

    try {
      const updates: Record<string, any> = {
        approval_status: status,
        updated_at: new Date().toISOString(),
      };
      if (status === 'submitted') {
        updates.submitted_at = new Date().toISOString();
      } else if (status === 'approved') {
        updates.reviewed_at = new Date().toISOString();
        updates.reviewed_by = reviewedBy || 'Admin';
        updates.rejection_reason = null;
      } else if (status === 'rejected') {
        updates.reviewed_at = new Date().toISOString();
        updates.reviewed_by = reviewedBy || 'Admin';
        updates.rejection_reason = rejectionReason || 'Requires revision';
      }

      const { error } = await client.from('time_logs').update(updates).in('id', logIds);
      if (error) console.error('[Supabase] Error updating batch approval:', error);
      return !error;
    } catch (err) {
      console.error('[Supabase] Error updating batch approval:', err);
      return false;
    }
  }

  // --- CLIENT PORTAL PUBLIC QUERIES ---
  public static async getPortalData(portalToken: string): Promise<{
    client: Client;
    projects: Project[];
    timeLogs: TimeLog[];
    invoices: Invoice[];
    paymentSettings: PaymentSettings | null;
  } | null> {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      // 1. Fetch Client by portal token
      const { data: clientData, error: clientErr } = await client
        .from('clients')
        .select('*')
        .eq('portal_token', portalToken)
        .maybeSingle();

      if (clientErr || !clientData) {
        return null;
      }

      const mappedClient = mapClientFromDB(clientData);

      // 2. Fetch Client's Projects, Approved TimeLogs, Invoices, and PaymentSettings in parallel
      const [projRes, logsRes, invRes, payRes] = await Promise.all([
        client.from('projects').select('*').eq('client_id', mappedClient.id),
        client.from('time_logs').select('*').eq('client_id', mappedClient.id).eq('approval_status', 'approved'),
        client.from('invoices').select('*').eq('client_id', mappedClient.id),
        client.from('payment_settings').select('*').eq('user_id', mappedClient.userId).maybeSingle(),
      ]);

      const projects = (projRes.data || []).map(mapProjectFromDB);
      const timeLogs = (logsRes.data || []).map(mapTimeLogFromDB);
      const invoices = (invRes.data || []).map(mapInvoiceFromDB);
      const paymentSettings = payRes.data ? mapPaymentSettingsFromDB(payRes.data) : null;

      return {
        client: mappedClient,
        projects,
        timeLogs,
        invoices,
        paymentSettings,
      };
    } catch (err) {
      console.warn('[Supabase] Error loading portal data:', err);
      return null;
    }
  }
}
