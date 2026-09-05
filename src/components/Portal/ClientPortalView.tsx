// src/components/Portal/ClientPortalView.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Briefcase, 
  Clock, 
  Receipt, 
  Download, 
  CreditCard, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  FileText, 
  Check, 
  Copy, 
  Moon, 
  Sun 
} from 'lucide-react';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { SupabaseService } from '../../services/supabaseService';
import { Client, Project, TimeLog, Invoice, PaymentSettings } from '../../types';
import { formatDurationHuman, formatCurrency, formatDate } from '../../utils/formatters';
import { generatePaymentUrl, getProviderLabel } from '../../utils/paymentLinks';
import { generateInvoicePDF } from '../../utils/pdfGenerator';

interface ClientPortalViewProps {
  portalToken: string;
  onExitPortal?: () => void;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({ portalToken, onExitPortal }) => {
  const store = useWorkflowStore();
  const [activeTab, setActiveTab] = useState<'projects' | 'timesheets' | 'invoices'>('projects');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [bankModalInvoice, setBankModalInvoice] = useState<Invoice | null>(null);
  const [bankWireConfirmed, setBankWireConfirmed] = useState<boolean>(false);

  // Cloud loading state
  const [isLoadingCloud, setIsLoadingCloud] = useState<boolean>(false);
  const [cloudPortalData, setCloudPortalData] = useState<{
    client: Client;
    projects: Project[];
    timeLogs: TimeLog[];
    invoices: Invoice[];
    paymentSettings: PaymentSettings | null;
  } | null>(null);

  // 1. First check local store for client with portalToken
  const localClient = useMemo(() => {
    return store.clients.find((c) => c.portalToken === portalToken);
  }, [store.clients, portalToken]);

  // 2. If not found locally or if cloud is connected, attempt Supabase lookup
  useEffect(() => {
    let isMounted = true;
    if (!localClient) {
      setIsLoadingCloud(true);
      SupabaseService.getPortalData(portalToken).then((data) => {
        if (isMounted) {
          if (data) setCloudPortalData(data);
          setIsLoadingCloud(false);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [portalToken, localClient]);

  // Derive active client
  const client: Client | undefined = localClient || cloudPortalData?.client;

  // Derive client-scoped projects
  const clientProjects: Project[] = useMemo(() => {
    if (localClient) {
      return store.projects.filter((p) => p.clientId === localClient.id);
    }
    return cloudPortalData?.projects || [];
  }, [localClient, store.projects, cloudPortalData]);

  // Derive approved time logs
  const clientTimeLogs: TimeLog[] = useMemo(() => {
    if (localClient) {
      return store.timeLogs.filter((l) => l.clientId === localClient.id && l.approvalStatus === 'approved');
    }
    return cloudPortalData?.timeLogs || [];
  }, [localClient, store.timeLogs, cloudPortalData]);

  // Derive client invoices
  const clientInvoices: Invoice[] = useMemo(() => {
    if (localClient) {
      return store.invoices.filter((i) => i.clientId === localClient.id);
    }
    return cloudPortalData?.invoices || [];
  }, [localClient, store.invoices, cloudPortalData]);

  // Active payment settings
  const activePaymentSettings: PaymentSettings = useMemo(() => {
    return cloudPortalData?.paymentSettings || store.paymentSettings;
  }, [cloudPortalData, store.paymentSettings]);

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // --- 404 / INVALID TOKEN STATE ---
  if (!isLoadingCloud && !client) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Client Portal Not Found
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            This secure client portal link may be invalid, expired, or revoked. Please contact your account manager for an updated access link.
          </p>
          <div className="pt-2 font-mono text-[10px] text-slate-400">
            Token: {portalToken}
          </div>
          {onExitPortal && (
            <button
              onClick={onExitPortal}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Return to Homepage
            </button>
          )}
        </div>
      </div>
    );
  }

  // --- LOADING STATE ---
  if (isLoadingCloud) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading secure client portal...</p>
        </div>
      </div>
    );
  }

  // Calculate high-level client summary metrics
  const totalApprovedHours = Number(
    (clientTimeLogs.reduce((sum, l) => sum + l.durationSeconds, 0) / 3600).toFixed(1)
  );
  const outstandingInvoices = clientInvoices.filter((i) => i.status !== 'paid');
  const totalOutstandingAmount = outstandingInvoices.reduce((sum, i) => sum + i.totalAmount, 0);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} transition-colors font-sans`}>
      
      {/* Top Client Portal Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand & Client Identification */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-sky-500/20">
              {client?.name[0] || 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  {client?.company || client?.name}
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Client Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Secure Client Dashboard & Project Hub
              </p>
            </div>
          </div>

          {/* Navigation Pill Strip */}
          <nav className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('projects')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'projects'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Projects ({clientProjects.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('timesheets')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'timesheets'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Timesheets ({totalApprovedHours}h)</span>
            </button>

            <button
              onClick={() => setActiveTab('invoices')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'invoices'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Invoices ({clientInvoices.length})</span>
            </button>
          </nav>

          {/* Right Action: Theme toggle, Exit */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {onExitPortal && (
              <button
                onClick={onExitPortal}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Exit Portal
              </button>
            )}
          </div>

        </div>

        {/* Mobile Navigation Strip */}
        <div className="flex sm:hidden items-center justify-between gap-1 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-lg transition ${
              activeTab === 'projects'
                ? 'bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 font-bold'
                : 'text-slate-500'
            }`}
          >
            Projects
          </button>
          <button
            onClick={() => setActiveTab('timesheets')}
            className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-lg transition ${
              activeTab === 'timesheets'
                ? 'bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 font-bold'
                : 'text-slate-500'
            }`}
          >
            Hours ({totalApprovedHours}h)
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-lg transition ${
              activeTab === 'invoices'
                ? 'bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 font-bold'
                : 'text-slate-500'
            }`}
          >
            Invoices ({clientInvoices.length})
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-8">
        
        {/* Top KPI Metrics Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold">Active Projects</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {clientProjects.length}
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold">Approved Work Hours</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 font-mono">
                {totalApprovedHours}h
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${
              totalOutstandingAmount > 0
                ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                : 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            }`}>
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold">Outstanding Due</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 font-mono">
                {formatCurrency(totalOutstandingAmount, client?.currency)}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* TAB 1: PROJECTS & MILESTONES               */}
        {/* ========================================== */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Project Deliverables & Milestones
                </h3>
                <p className="text-xs text-slate-500">
                  Track project status, sprint roadmaps, and completed deliverables.
                </p>
              </div>
            </div>

            {clientProjects.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 text-xs">
                No active projects assigned to your portal account yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {clientProjects.map((proj) => {
                  const milestones = proj.milestones || [];
                  const completedMilestones = milestones.filter((m) => m.status === 'paid' || m.status === 'invoiced');
                  const progressPct = milestones.length > 0 
                    ? Math.round((completedMilestones.length / milestones.length) * 100)
                    : 0;

                  return (
                    <div
                      key={proj.id}
                      className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 hover:border-slate-300 dark:hover:border-slate-700 transition"
                    >
                      {/* Project Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                            {proj.billingType === 'fixed_fee' ? 'Fixed Scope' : proj.billingType === 'retainer' ? 'Monthly Retainer' : 'Time & Materials'}
                          </span>
                          <h4 className="text-base font-bold text-slate-900 dark:text-white mt-2">
                            {proj.name}
                          </h4>
                          {proj.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {proj.description}
                            </p>
                          )}
                        </div>

                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          proj.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                        }`}>
                          {proj.status}
                        </span>
                      </div>

                      {/* Milestones Progress Bar (if fixed fee) */}
                      {milestones.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>Milestone Delivery</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{progressPct}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 transition-all duration-300"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Milestones Checklist */}
                      {milestones.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Key Milestones
                          </span>
                          <div className="space-y-2">
                            {milestones.map((m) => (
                              <div
                                key={m.id}
                                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 text-xs"
                              >
                                <div className="flex items-center gap-2.5">
                                  {m.status === 'paid' ? (
                                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                                      <Check className="w-3 h-3 stroke-[3]" />
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-700 shrink-0" />
                                  )}
                                  <span className={`font-semibold ${m.status === 'paid' ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
                                    {m.title}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {m.dueDate && (
                                    <span className="text-[11px] text-slate-400">
                                      {formatDate(m.dueDate)}
                                    </span>
                                  )}
                                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                    m.status === 'paid'
                                      ? 'bg-emerald-50 text-emerald-600'
                                      : m.status === 'invoiced'
                                      ? 'bg-sky-50 text-sky-600'
                                      : 'bg-slate-100 text-slate-500'
                                  }`}>
                                    {m.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Project Meta Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                        {proj.deadline && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>Target Launch: <strong>{formatDate(proj.deadline)}</strong></span>
                          </div>
                        )}
                        {proj.budgetHours && (
                          <div>
                            Allocated Budget: <strong>{proj.budgetHours} hrs</strong>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 2: APPROVED TIMESHEETS                */}
        {/* ========================================== */}
        {activeTab === 'timesheets' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Approved Work Sessions & Timesheets
                </h3>
                <p className="text-xs text-slate-500">
                  Detailed transparency into hours logged and verified for your account.
                </p>
              </div>
              <div className="text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-3 py-1.5 rounded-xl border border-sky-200 dark:border-sky-800">
                Total Verified: {totalApprovedHours} Hours
              </div>
            </div>

            {clientTimeLogs.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 text-xs">
                No approved timesheets recorded yet for this billing period.
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Date & Time</th>
                        <th className="py-3 px-4">Project</th>
                        <th className="py-3 px-4">Work Description</th>
                        <th className="py-3 px-4 text-right">Duration</th>
                        <th className="py-3 px-4 text-right">Verification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {clientTimeLogs.map((log) => {
                        const proj = clientProjects.find((p) => p.id === log.projectId);
                        return (
                          <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                            <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                              {new Date(log.startTime).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                              {proj?.name || 'Assigned Project'}
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                              {log.description}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                              {formatDurationHuman(log.durationSeconds)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="w-3 h-3" />
                                Approved
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 3: INVOICES & PAYMENTS                */}
        {/* ========================================== */}
        {activeTab === 'invoices' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Invoices & Direct Checkout
                </h3>
                <p className="text-xs text-slate-500">
                  Download official PDF tax invoices or pay immediately via credit card, PayPal, or bank wire.
                </p>
              </div>
            </div>

            {clientInvoices.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 text-xs">
                No invoices have been issued for your account yet.
              </div>
            ) : (
              <div className="space-y-4">
                {clientInvoices.map((inv) => {
                  const payUrl = generatePaymentUrl(inv, activePaymentSettings);
                  const isPaid = inv.status === 'paid';
                  const isWireProvider = activePaymentSettings?.activeProvider === 'bank_transfer';

                  return (
                    <div
                      key={inv.id}
                      className={`p-6 rounded-2xl border shadow-sm transition space-y-4 ${
                        isPaid
                          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                          : 'bg-white dark:bg-slate-900 border-sky-300 dark:border-sky-800/80 ring-1 ring-sky-500/10'
                      }`}
                    >
                      {/* Top row: Invoice #, Date, Status */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-base text-slate-900 dark:text-white">
                                {inv.invoiceNumber}
                              </span>
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                isPaid
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                  : inv.status === 'overdue'
                                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                  : 'bg-sky-50 text-sky-600 border border-sky-200'
                              }`}>
                                {inv.status}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              Issued: {inv.issueDate} • Due: <strong>{inv.dueDate}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Amount Due */}
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-semibold text-slate-400">Total Balance</span>
                          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                            {formatCurrency(inv.totalAmount, inv.currency)}
                          </div>
                        </div>
                      </div>

                      {/* Line Items Summary */}
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800/70 space-y-2 text-xs">
                        <div className="font-semibold text-slate-700 dark:text-slate-300">
                          Billed Deliverables ({inv.items.length} items):
                        </div>
                        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                          {inv.items.map((item, idx) => (
                            <li key={idx} className="py-1.5 flex justify-between items-center text-slate-600 dark:text-slate-400">
                              <span className="truncate pr-2">{item.description}</span>
                              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 shrink-0">
                                {formatCurrency(item.amount, inv.currency)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Actions Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        {/* Download PDF Button */}
                        <button
                          type="button"
                          onClick={() => generateInvoicePDF(inv, null, activePaymentSettings, window.location.href)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                        >
                          <Download className="w-3.5 h-3.5 text-sky-500" />
                          <span>Download PDF Invoice</span>
                        </button>

                        {/* Pay Now or Paid Confirmation */}
                        {isPaid ? (
                          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Payment Received & Settled</span>
                          </div>
                        ) : isWireProvider ? (
                          <button
                            type="button"
                            onClick={() => {
                              setBankModalInvoice(inv);
                              setBankWireConfirmed(false);
                            }}
                            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-sky-500/20 active:scale-95 transition"
                          >
                            <Building2 className="w-4 h-4" />
                            <span>View Wire Transfer Details</span>
                          </button>
                        ) : payUrl ? (
                          <a
                            href={payUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-600 to-violet-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-sky-500/20 active:scale-95 transition"
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>Pay Online ({getProviderLabel(activePaymentSettings.activeProvider)})</span>
                          </a>
                        ) : null}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>

      {/* --- BANK WIRE DETAILS MODAL --- */}
      {bankModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Direct Bank Transfer Details
                  </h4>
                  <p className="text-xs text-slate-500">
                    For Invoice {bankModalInvoice.invoiceNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBankModalInvoice(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-2">
                {[
                  { label: 'Beneficiary Name', val: activePaymentSettings.accountName || 'WorkerHub Studio LLC' },
                  { label: 'Bank Name', val: activePaymentSettings.bankName || 'Silicon Valley Bank' },
                  { label: 'Account / IBAN', val: activePaymentSettings.accountNumber || '9876543210' },
                  { label: 'Routing / Sort Code', val: activePaymentSettings.routingOrSortCode || '121000358' },
                  { label: 'SWIFT / BIC', val: activePaymentSettings.swiftBic || 'SVCBUS33' },
                  { label: 'Wire Memo / Ref', val: bankModalInvoice.invoiceNumber },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="text-slate-400">{item.label}:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{item.val}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.val, item.label)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="Copy"
                      >
                        {copiedField === item.label ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {activePaymentSettings.paymentInstructions && (
                <p className="text-[11px] text-slate-400">
                  Note: {activePaymentSettings.paymentInstructions}
                </p>
              )}

              {bankWireConfirmed ? (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold text-center">
                  ✓ Thank you! We have logged your bank transfer notice. The invoice will update to Paid once verified.
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setBankWireConfirmed(true)}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition"
                >
                  I Have Completed This Bank Transfer
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ClientPortalView;
