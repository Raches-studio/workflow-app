// src/types/index.ts

export type BillingType = 'hourly' | 'fixed_fee' | 'retainer' | 'non_billable';
export type ProjectStatus = 'lead' | 'active' | 'on_hold' | 'completed' | 'archived';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TimerStatus = 'idle' | 'running' | 'paused';

export interface Client {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  currency: string; // e.g. 'USD', 'EUR', 'GBP'
  hourlyRate?: number; // default client hourly rate fallback
  paymentTermsDays: number; // e.g. 14, 30
  portalToken?: string; // unique token for secure client portal access
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  amount: number;
  percentage?: number;
  dueDate?: string;
  status: 'pending' | 'invoiced' | 'paid';
  invoiceId?: string;
  createdAt?: string;
}

export interface Project {
  id: string;
  userId: string;
  clientId: string;
  name: string;
  description?: string;
  billingType: BillingType;
  rate: number; // hourly rate fallback
  // Fixed-fee fields
  contractTotal?: number;
  milestones?: ProjectMilestone[];
  // Retainer fields
  retainerMonthlyFee?: number;
  retainerHoursCap?: number;
  retainerOvertimeRate?: number;
  // General budget & deadlines
  budgetHours?: number;
  budgetAmount?: number;
  deadline?: string; // ISO string YYYY-MM-DD
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  userId: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  estimatedHours?: number;
  dueDate?: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export type ApprovalStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface TimeLog {
  id: string;
  userId: string;
  clientId: string;
  projectId: string;
  taskId?: string;
  description: string;
  startTime: string; // ISO timestamp
  endTime: string;   // ISO timestamp
  durationSeconds: number;
  isBillable: boolean;
  hourlyRate: number;
  isInvoiced: boolean;
  invoiceId?: string;
  // Phase 3: Approval Workflows
  approvalStatus: ApprovalStatus;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveTimer {
  id: string;
  projectId: string;
  taskId?: string;
  description: string;
  startTime: number; // epoch ms when started
  pausedDurationMs: number; // total accumulated pause duration
  lastPausedTime?: number; // epoch ms when paused
  isBillable: boolean;
  status: TimerStatus;
}

// Input DTOs
export interface CreateClientDTO {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  currency?: string;
  hourlyRate?: number;
  paymentTermsDays?: number;
  portalToken?: string;
  notes?: string;
}

export interface CreateProjectDTO {
  clientId: string;
  name: string;
  description?: string;
  billingType: BillingType;
  rate: number;
  contractTotal?: number;
  milestones?: ProjectMilestone[];
  retainerMonthlyFee?: number;
  retainerHoursCap?: number;
  retainerOvertimeRate?: number;
  budgetHours?: number;
  budgetAmount?: number;
  deadline?: string;
  status?: ProjectStatus;
}

export interface CreateTimeLogDTO {
  projectId: string;
  taskId?: string;
  description: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  isBillable: boolean;
  hourlyRate?: number;
}

// ==========================================
// Invoicing Engine Types
// ==========================================

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export interface InvoiceLineItem {
  id: string;
  type: 'hourly_log' | 'milestone' | 'retainer' | 'custom';
  description: string;
  quantity: number; // e.g. hours or 1
  unitPrice: number; // rate or fee
  amount: number; // quantity * unitPrice
  timeLogId?: string;
  milestoneId?: string;
  projectId?: string;
}

export interface Invoice {
  id: string;
  userId: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientCompany?: string;
  invoiceNumber: string; // e.g. "INV-1001"
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  status: InvoiceStatus;
  items: InvoiceLineItem[];
  subtotal: number;
  taxRate: number; // e.g. 10 (%)
  taxAmount: number;
  totalAmount: number;
  currency: string;
  paymentTermsDays: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceDTO {
  clientId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  currency?: string;
  paymentTermsDays?: number;
  notes?: string;
  status?: InvoiceStatus;
}

// AI Work Assistant Types
export type AIMessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface AIToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface TaskBreakdownItem {
  title: string;
  description?: string;
  estimatedHours: number;
  priority: TaskPriority;
}

export interface EmailDraftResult {
  recipient: string;
  subject: string;
  body: string;
  tone: 'friendly' | 'firm' | 'formal' | 'concise';
}

export interface DataInsightResult {
  summary: string;
  totalHours: number;
  totalEarnings: number;
  period: string;
  logsCount: number;
  projectBreakdown?: { projectName: string; hours: number; amount: number }[];
}

export interface AIMessage {
  id: string;
  role: AIMessageRole;
  content: string;
  timestamp: string;
  imageUrl?: string; // Optional user-attached screenshot or design image
  toolCalls?: AIToolCall[];
  actionType?: 'task_breakdown' | 'client_communication' | 'data_insight' | 'troubleshooting' | 'general';
  actionData?: {
    tasks?: TaskBreakdownItem[];
    email?: EmailDraftResult;
    insight?: DataInsightResult;
  };
}

export type UserRole = 'admin' | 'manager' | 'member';

export interface CurrentAppContext {
  currentPage: 'tracker' | 'projects' | 'invoices' | 'approvals' | 'portal';
  activeProjectId?: string;
  activeProjectName?: string;
  activeTaskId?: string;
  activeTaskTitle?: string;
  activeTaskDescription?: string;
  isTimerRunning?: boolean;
}

// ==========================================
// Authentication & User Profile Types
// ==========================================

export interface UserProfile {
  id: string; // matches auth.users.id
  fullName: string;
  businessName?: string;
  email: string;
  role: UserRole; // 'admin' | 'manager' | 'member' (default: 'admin')
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  fullName: string;
  email: string;
  password: string;
  businessName?: string;
}

// ==========================================
// Multi-Gateway Payment Settings Types
// ==========================================

export type PaymentProvider = 'paypal' | 'paystack' | 'flutterwave' | 'bank_transfer' | 'custom_link';

export interface PaymentSettings {
  id?: string;
  userId?: string;
  activeProvider: PaymentProvider;
  // PayPal
  paypalEmail?: string;
  paypalClientId?: string;
  // Paystack
  paystackPublicKey?: string;
  paystackSecretKey?: string;
  // Flutterwave
  flutterwavePublicKey?: string;
  // Manual Bank Transfer
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  routingOrSortCode?: string;
  swiftBic?: string;
  paymentInstructions?: string;
  // Custom Payment Link (Stripe, Wise, etc.)
  customPaymentUrl?: string;
  isConfigured: boolean;
  updatedAt?: string;
}



