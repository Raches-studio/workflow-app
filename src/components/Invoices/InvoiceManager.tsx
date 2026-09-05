// src/components/Invoices/InvoiceManager.tsx
import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Download, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Search, 
  Receipt,
  X,
  Layers,
  CreditCard,
  Globe,
  Check
} from 'lucide-react';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { useAuthStore } from '../../store/useAuthStore';
import { InvoiceStatus, InvoiceLineItem, CreateInvoiceDTO } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { generateInvoicePDF } from '../../utils/pdfGenerator';
import { PaymentSettingsManager } from '../Payments/PaymentSettingsManager';
import { generatePaymentUrl } from '../../utils/paymentLinks';

export const InvoiceManager: React.FC = () => {
  const { 
    clients, 
    projects, 
    timeLogs, 
    invoices, 
    createInvoice, 
    updateInvoiceStatus, 
    deleteInvoice,
    paymentSettings
  } = useWorkflowStore();
  const { profile } = useAuthStore();
  const isMember = profile?.role === 'member';

  const [subTab, setSubTab] = useState<'invoices' | 'gateways'>('invoices');
  const [copiedPayInvoiceId, setCopiedPayInvoiceId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InvoiceStatus>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // --- MODAL STATE ---
  const [selectedClientId, setSelectedClientId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [taxRate, setTaxRate] = useState<number>(0);
  const [notes, setNotes] = useState(
    'Thank you for your business! Please remit payment via bank transfer or card within the specified terms.'
  );

  // Aggregated selections
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);
  const [selectedMilestoneIds, setSelectedMilestoneIds] = useState<string[]>([]);
  const [selectedRetainerProjectIds, setSelectedRetainerProjectIds] = useState<string[]>([]);
  const [customItems, setCustomItems] = useState<Array<{ description: string; quantity: number; unitPrice: number }>>([]);
  const [newCustomDesc, setNewCustomDesc] = useState('');
  const [newCustomPrice, setNewCustomPrice] = useState<number>(0);

  // Open modal with auto-generated invoice number
  const handleOpenCreateModal = (preselectedClientId?: string) => {
    const nextNum = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;
    setInvoiceNumber(nextNum);
    const targetClient = preselectedClientId 
      ? clients.find(c => c.id === preselectedClientId) 
      : clients[0];
    
    if (targetClient) {
      setSelectedClientId(targetClient.id);
      const termsDays = targetClient.paymentTermsDays || 14;
      setDueDate(new Date(Date.now() + termsDays * 86400000).toISOString().split('T')[0]);
    }

    setSelectedLogIds([]);
    setSelectedMilestoneIds([]);
    setSelectedRetainerProjectIds([]);
    setCustomItems([]);
    setTaxRate(0);
    setShowCreateModal(true);
  };

  // Selected client entity
  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId);
  }, [clients, selectedClientId]);

  // Client's projects
  const clientProjects = useMemo(() => {
    return projects.filter((p) => p.clientId === selectedClientId);
  }, [projects, selectedClientId]);

  // Client's approved unbilled time logs (only approved hours can be invoiced)
  const unbilledLogs = useMemo(() => {
    if (!selectedClientId) return [];
    return timeLogs.filter((l) => {
      if (l.isInvoiced || !l.isBillable || l.approvalStatus !== 'approved') return false;
      const proj = projects.find((p) => p.id === l.projectId);
      return proj?.clientId === selectedClientId;
    });
  }, [timeLogs, projects, selectedClientId]);

  // Client's unapproved logs count for warning
  const pendingLogsCount = useMemo(() => {
    if (!selectedClientId) return 0;
    return timeLogs.filter((l) => {
      if (l.isInvoiced || !l.isBillable || l.approvalStatus === 'approved') return false;
      const proj = projects.find((p) => p.id === l.projectId);
      return proj?.clientId === selectedClientId;
    }).length;
  }, [timeLogs, projects, selectedClientId]);

  // Client's unbilled milestones
  const unbilledMilestones = useMemo(() => {
    if (!selectedClientId) return [];
    const results: Array<{
      projectId: string;
      projectName: string;
      milestoneId: string;
      title: string;
      amount: number;
      percentage?: number;
      dueDate?: string;
    }> = [];

    clientProjects.forEach((p) => {
      if (p.billingType === 'fixed_fee' && p.milestones) {
        p.milestones.forEach((m) => {
          if (m.status !== 'invoiced' && m.status !== 'paid') {
            results.push({
              projectId: p.id,
              projectName: p.name,
              milestoneId: m.id,
              title: m.title,
              amount: m.amount,
              percentage: m.percentage,
              dueDate: m.dueDate,
            });
          }
        });
      }
    });

    return results;
  }, [clientProjects, selectedClientId]);

  // Client's retainer projects
  const retainerProjects = useMemo(() => {
    return clientProjects.filter((p) => p.billingType === 'retainer');
  }, [clientProjects]);

  // Calculate live line items
  const compiledLineItems = useMemo<InvoiceLineItem[]>(() => {
    const items: InvoiceLineItem[] = [];

    // 1. Hourly logs
    unbilledLogs
      .filter((l) => selectedLogIds.includes(l.id))
      .forEach((log) => {
        const proj = projects.find((p) => p.id === log.projectId);
        const hours = Number((log.durationSeconds / 3600).toFixed(2));
        const rate = log.hourlyRate || proj?.rate || selectedClient?.hourlyRate || 85;
        items.push({
          id: `item-log-${log.id}`,
          type: 'hourly_log',
          description: `${proj?.name || 'Project'}: ${log.description || 'Logged work'} (${hours} hrs @ ${formatCurrency(rate)}/hr)`,
          quantity: hours,
          unitPrice: rate,
          amount: Math.round(hours * rate * 100) / 100,
          timeLogId: log.id,
          projectId: log.projectId,
        });
      });

    // 2. Fixed-fee milestones
    unbilledMilestones
      .filter((m) => selectedMilestoneIds.includes(m.milestoneId))
      .forEach((ms) => {
        items.push({
          id: `item-ms-${ms.milestoneId}`,
          type: 'milestone',
          description: `${ms.projectName} - Milestone: ${ms.title}${ms.percentage ? ` (${ms.percentage}%)` : ''}`,
          quantity: 1,
          unitPrice: ms.amount,
          amount: ms.amount,
          milestoneId: ms.milestoneId,
          projectId: ms.projectId,
        });
      });

    // 3. Monthly retainers
    retainerProjects
      .filter((p) => selectedRetainerProjectIds.includes(p.id))
      .forEach((p) => {
        const monthlyFee = p.retainerMonthlyFee || p.rate || 0;
        const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
        items.push({
          id: `item-ret-${p.id}`,
          type: 'retainer',
          description: `${p.name} - Monthly Retainer Fee (${currentMonthName})`,
          quantity: 1,
          unitPrice: monthlyFee,
          amount: monthlyFee,
          projectId: p.id,
        });
      });

    // 4. Custom items
    customItems.forEach((c, idx) => {
      items.push({
        id: `item-custom-${idx}`,
        type: 'custom',
        description: c.description,
        quantity: c.quantity,
        unitPrice: c.unitPrice,
        amount: Math.round(c.quantity * c.unitPrice * 100) / 100,
      });
    });

    return items;
  }, [
    unbilledLogs,
    selectedLogIds,
    unbilledMilestones,
    selectedMilestoneIds,
    retainerProjects,
    selectedRetainerProjectIds,
    customItems,
    projects,
    selectedClient,
  ]);

  // Live financial totals
  const subtotal = useMemo(() => {
    return compiledLineItems.reduce((sum, item) => sum + item.amount, 0);
  }, [compiledLineItems]);

  const taxAmount = useMemo(() => {
    return Math.round(subtotal * (taxRate / 100) * 100) / 100;
  }, [subtotal, taxRate]);

  const totalAmount = useMemo(() => {
    return Math.round((subtotal + taxAmount) * 100) / 100;
  }, [subtotal, taxAmount]);

  // Handle invoice submission
  const handleSaveInvoice = (andDownloadPdf = false) => {
    if (!selectedClientId || !invoiceNumber || compiledLineItems.length === 0) return;

    const dto: CreateInvoiceDTO = {
      clientId: selectedClientId,
      invoiceNumber: invoiceNumber.trim(),
      issueDate,
      dueDate,
      items: compiledLineItems,
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      currency: selectedClient?.currency || 'USD',
      paymentTermsDays: selectedClient?.paymentTermsDays || 14,
      notes: notes.trim() || undefined,
      status: 'draft',
    };

    const newInv = createInvoice(dto);
    setShowCreateModal(false);

    if (andDownloadPdf) {
      generateInvoicePDF(newInv, profile);
    }
  };

  // KPI Metrics
  const invoiceStats = useMemo(() => {
    let totalInvoiced = 0;
    let paidAmount = 0;
    let sentAmount = 0;
    let overdueAmount = 0;

    invoices.forEach((inv) => {
      totalInvoiced += inv.totalAmount;
      if (inv.status === 'paid') paidAmount += inv.totalAmount;
      if (inv.status === 'sent') sentAmount += inv.totalAmount;
      if (inv.status === 'overdue') overdueAmount += inv.totalAmount;
    });

    return {
      totalInvoiced,
      paidAmount,
      sentAmount,
      overdueAmount,
      count: invoices.length,
    };
  }, [invoices]);

  // Filtered invoice list
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.clientCompany && inv.clientCompany.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [invoices, statusFilter, searchQuery]);

  if (isMember) {
    return (
      <div className="p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
          <Receipt className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Invoices & Billing</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Invoicing, financial rates, and payment gateway controls are reserved for Admins and Managers. Please submit your tracked hours in the Time Tracker.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Sub-Navigation: Invoices vs Payment Gateways & Create Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab('invoices')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              subTab === 'invoices'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Invoices ({invoices.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('gateways')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              subTab === 'gateways'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-sky-500" />
            <span>Payment Gateways & Checkout</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-mono uppercase">
              {paymentSettings.activeProvider}
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => handleOpenCreateModal()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-gradient-to-r from-sky-500 via-indigo-600 to-violet-600 hover:from-sky-600 hover:to-indigo-700 text-white shadow-md shadow-sky-500/20 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create Invoice</span>
        </button>
      </div>

      {subTab === 'gateways' ? (
        <PaymentSettingsManager onBackToInvoices={() => setSubTab('invoices')} />
      ) : (
        <>
          {/* --- INVOICE KPI STRIP --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Invoiced</span>
            <Receipt className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 font-mono text-xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(invoiceStats.totalInvoiced)}
          </div>
          <span className="text-[11px] text-slate-400">{invoiceStats.count} total invoices</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Paid & Collected</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(invoiceStats.paidAmount)}
          </div>
          <span className="text-[11px] text-slate-400">Received funds</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">Sent / Pending</span>
            <Send className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 font-mono text-xl font-bold text-sky-600 dark:text-sky-400">
            {formatCurrency(invoiceStats.sentAmount)}
          </div>
          <span className="text-[11px] text-slate-400">Awaiting client payment</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Overdue</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 font-mono text-xl font-bold text-rose-600 dark:text-rose-400">
            {formatCurrency(invoiceStats.overdueAmount)}
          </div>
          <span className="text-[11px] text-slate-400">Past payment terms</span>
        </div>
      </div>

      {/* --- INVOICE HISTORY TABLE & FILTERS --- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
        
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
            {(['all', 'draft', 'sent', 'paid', 'overdue'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition ${
                  statusFilter === tab
                    ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoice or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Invoices List */}
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No invoices found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {invoices.length === 0
                ? "You haven't generated any invoices yet. Aggregate your unbilled hours and milestones to create your first PDF invoice."
                : 'No invoices match your selected status and search criteria.'}
            </p>
            {invoices.length === 0 && (
              <button
                type="button"
                onClick={() => handleOpenCreateModal()}
                className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-sky-600 text-white hover:bg-sky-500 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Invoice</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredInvoices.map((invoice) => {
                  const statusColors: Record<InvoiceStatus, string> = {
                    draft: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
                    sent: 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
                    paid: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                    overdue: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
                  };

                  return (
                    <tr key={invoice.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span>{invoice.invoiceNumber}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {invoice.clientName}
                        </div>
                        {invoice.clientCompany && (
                          <div className="text-[11px] text-slate-400">{invoice.clientCompany}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {invoice.issueDate}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {invoice.dueDate}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(invoice.totalAmount)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {/* Status dropdown selector */}
                        <div className="relative inline-block">
                          <select
                            value={invoice.status}
                            onChange={(e) => updateInvoiceStatus(invoice.id, e.target.value as InvoiceStatus)}
                            className={`text-[11px] font-semibold py-1 px-2.5 rounded-lg border appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-sky-500 capitalize ${
                              statusColors[invoice.status]
                            }`}
                          >
                            <option value="draft">Draft</option>
                            <option value="sent">Sent</option>
                            <option value="paid">Paid</option>
                            <option value="overdue">Overdue</option>
                          </select>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1-Click PDF Download with Payment Button Embedded */}
                          {(() => {
                            const client = clients.find((c) => c.id === invoice.clientId);
                            const portalUrl = client?.portalToken ? `${window.location.origin}/portal/${client.portalToken}` : undefined;
                            const payUrl = generatePaymentUrl(invoice, paymentSettings, portalUrl);

                            return (
                              <>
                                <button
                                  type="button"
                                  onClick={() => generateInvoicePDF(invoice, profile, paymentSettings, portalUrl)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold shadow-sm transition active:scale-95"
                                  title="Download PDF Invoice with Pay Now link"
                                >
                                  <Download className="w-3 h-3 text-sky-500" />
                                  <span className="hidden sm:inline">PDF</span>
                                </button>

                                {/* Pay Link Button */}
                                {payUrl && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(payUrl);
                                      setCopiedPayInvoiceId(invoice.id);
                                      setTimeout(() => setCopiedPayInvoiceId(null), 2000);
                                    }}
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition"
                                    title="Copy Direct Payment Link"
                                  >
                                    {copiedPayInvoiceId === invoice.id ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                                    ) : (
                                      <CreditCard className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}

                                {/* Portal Link Button */}
                                {client?.portalToken && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      window.open(`/portal/${client.portalToken}`, '_blank');
                                    }}
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
                                    title="View in Client Portal"
                                  >
                                    <Globe className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </>
                            );
                          })()}

                          {/* Delete invoice */}
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete invoice ${invoice.invoiceNumber}? Associated time logs will be marked as unbilled.`)) {
                                deleteInvoice(invoice.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="Delete invoice"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>
      </>
      )}

      {/* --- CREATE INVOICE MODAL --- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl shadow-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Generate New Invoice
                  </h3>
                  <p className="text-xs text-slate-500">
                    Aggregate unbilled work, project milestones, and retainers.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
              
              {/* Step 1: Client Selection & Invoice Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Client *
                  </label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => {
                      setSelectedClientId(e.target.value);
                      setSelectedLogIds([]);
                      setSelectedMilestoneIds([]);
                      setSelectedRetainerProjectIds([]);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.company ? `(${c.company})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Invoice Number *
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="INV-2026-001"
                    className="w-full px-3 py-2 text-xs font-mono font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Step 2: Unbilled Work Aggregator */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Step 2: Aggregate Unbilled Work
                  </h4>
                </div>

                {/* Notice if unapproved logs exist */}
                {pendingLogsCount > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>
                      Notice: <strong>{pendingLogsCount} time log(s)</strong> for this client are still pending approval and cannot be invoiced until approved in the Approvals tab.
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-sky-500" />
                    <span>Select Billable Items</span>
                  </h4>
                  <span className="text-xs text-slate-400">
                    {compiledLineItems.length} items selected
                  </span>
                </div>

                {/* Section 2A: Unbilled Hourly Logs */}
                {unbilledLogs.length > 0 && (
                  <div className="border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3.5 bg-white dark:bg-slate-900">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Unbilled Hourly Time Logs ({unbilledLogs.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedLogIds.length === unbilledLogs.length) {
                            setSelectedLogIds([]);
                          } else {
                            setSelectedLogIds(unbilledLogs.map((l) => l.id));
                          }
                        }}
                        className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                      >
                        {selectedLogIds.length === unbilledLogs.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>

                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {unbilledLogs.map((log) => {
                        const proj = projects.find((p) => p.id === log.projectId);
                        const isSelected = selectedLogIds.includes(log.id);
                        const hours = Number((log.durationSeconds / 3600).toFixed(2));
                        const rate = log.hourlyRate || proj?.rate || selectedClient?.hourlyRate || 85;
                        const lineAmount = Math.round(hours * rate * 100) / 100;

                        return (
                          <label
                            key={log.id}
                            className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition ${
                              isSelected
                                ? 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-slate-900 dark:text-white'
                                : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedLogIds([...selectedLogIds, log.id]);
                                  } else {
                                    setSelectedLogIds(selectedLogIds.filter((id) => id !== log.id));
                                  }
                                }}
                                className="rounded text-sky-600 focus:ring-sky-500"
                              />
                              <div className="truncate">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 mr-2">
                                  {proj?.name}
                                </span>
                                <span className="text-slate-500 dark:text-slate-400">{log.description}</span>
                              </div>
                            </div>

                            <div className="text-right font-mono font-bold shrink-0 ml-3">
                              {hours} hrs · {formatCurrency(lineAmount)}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Section 2B: Fixed-Fee Milestones */}
                {unbilledMilestones.length > 0 && (
                  <div className="border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3.5 bg-white dark:bg-slate-900">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Fixed-Fee Project Milestones ({unbilledMilestones.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedMilestoneIds.length === unbilledMilestones.length) {
                            setSelectedMilestoneIds([]);
                          } else {
                            setSelectedMilestoneIds(unbilledMilestones.map((m) => m.milestoneId));
                          }
                        }}
                        className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                      >
                        {selectedMilestoneIds.length === unbilledMilestones.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>

                    <div className="space-y-2">
                      {unbilledMilestones.map((m) => {
                        const isSelected = selectedMilestoneIds.includes(m.milestoneId);
                        return (
                          <label
                            key={m.milestoneId}
                            className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition ${
                              isSelected
                                ? 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-slate-900 dark:text-white'
                                : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedMilestoneIds([...selectedMilestoneIds, m.milestoneId]);
                                  } else {
                                    setSelectedMilestoneIds(selectedMilestoneIds.filter((id) => id !== m.milestoneId));
                                  }
                                }}
                                className="rounded text-sky-600 focus:ring-sky-500"
                              />
                              <div className="truncate">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 mr-2">
                                  {m.projectName}
                                </span>
                                <span>{m.title}</span>
                              </div>
                            </div>

                            <div className="text-right font-mono font-bold shrink-0 ml-3">
                              {formatCurrency(m.amount)}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Section 2C: Monthly Retainers */}
                {retainerProjects.length > 0 && (
                  <div className="border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3.5 bg-white dark:bg-slate-900">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
                      Recurring Monthly Retainers
                    </div>

                    <div className="space-y-2">
                      {retainerProjects.map((p) => {
                        const isSelected = selectedRetainerProjectIds.includes(p.id);
                        const fee = p.retainerMonthlyFee || p.rate || 0;
                        return (
                          <label
                            key={p.id}
                            className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition ${
                              isSelected
                                ? 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-slate-900 dark:text-white'
                                : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedRetainerProjectIds([...selectedRetainerProjectIds, p.id]);
                                  } else {
                                    setSelectedRetainerProjectIds(selectedRetainerProjectIds.filter((id) => id !== p.id));
                                  }
                                }}
                                className="rounded text-sky-600 focus:ring-sky-500"
                              />
                              <div>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {p.name}
                                </span>
                                <span className="text-slate-400 ml-2">
                                  ({p.retainerHoursCap || 0} hrs/mo cap)
                                </span>
                              </div>
                            </div>

                            <div className="text-right font-mono font-bold shrink-0 ml-3">
                              {formatCurrency(fee)} / mo
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Section 2D: Add Custom Line Item */}
                <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-3.5">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    + Add Custom Item or Expense
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="Item description (e.g. Plugin license, Server hosting)"
                      value={newCustomDesc}
                      onChange={(e) => setNewCustomDesc(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                    <input
                      type="number"
                      placeholder="Amount ($)"
                      value={newCustomPrice || ''}
                      onChange={(e) => setNewCustomPrice(parseFloat(e.target.value) || 0)}
                      className="w-28 px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newCustomDesc.trim() || newCustomPrice <= 0) return;
                        setCustomItems([
                          ...customItems,
                          { description: newCustomDesc.trim(), quantity: 1, unitPrice: newCustomPrice },
                        ]);
                        setNewCustomDesc('');
                        setNewCustomPrice(0);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-700 text-white text-xs font-semibold hover:bg-slate-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 3: Tax and Totals Summary */}
              <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-2 sm:max-w-xs">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                      className="w-24 px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Payment Terms & Notes
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    />
                  </div>
                </div>

                {/* Totals Summary */}
                <div className="flex flex-col justify-end text-right space-y-1 sm:min-w-[200px]">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>

                  {taxRate > 0 && (
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Tax ({taxRate}%):</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrency(taxAmount)}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline">
                    <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">Total Due:</span>
                    <span className="font-mono text-lg font-bold text-sky-600 dark:text-sky-400">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={compiledLineItems.length === 0}
                onClick={() => handleSaveInvoice(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm transition disabled:opacity-50"
              >
                Save as Draft
              </button>

              <button
                type="button"
                disabled={compiledLineItems.length === 0}
                onClick={() => handleSaveInvoice(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-gradient-to-r from-sky-500 via-indigo-600 to-violet-600 hover:from-sky-600 hover:to-indigo-700 shadow-md shadow-sky-500/20 active:scale-95 transition disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save & Download PDF</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default InvoiceManager;
