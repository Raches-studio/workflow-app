// src/components/Payments/PaymentSettingsManager.tsx
import React, { useState } from 'react';
import { 
  CreditCard, 
  ShieldCheck, 
  Check, 
  Copy, 
  Save, 
  RefreshCw, 
  Zap, 
  CheckCircle2, 
  Eye
} from 'lucide-react';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { PaymentProvider, PaymentSettings } from '../../types';
import { getProviderLabel, generatePaymentUrl } from '../../utils/paymentLinks';
import { formatCurrency } from '../../utils/formatters';

interface PaymentSettingsManagerProps {
  onBackToInvoices?: () => void;
}

export const PaymentSettingsManager: React.FC<PaymentSettingsManagerProps> = ({ onBackToInvoices }) => {
  const { paymentSettings, updatePaymentSettings, invoices, updateInvoiceStatus } = useWorkflowStore();

  const [formData, setFormData] = useState<PaymentSettings>({ ...paymentSettings });
  const [activeTab, setActiveTab] = useState<PaymentProvider>(paymentSettings.activeProvider || 'paypal');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Webhook Simulator State
  const [simulatedInvoiceId, setSimulatedInvoiceId] = useState<string>(
    invoices.find((i) => i.status !== 'paid')?.id || invoices[0]?.id || ''
  );
  const [simulatedEventType, setSimulatedEventType] = useState<'charge.success' | 'payment.captured' | 'invoice.paid'>('charge.success');
  const [simulatedPayloadJson, setSimulatedPayloadJson] = useState<string>('');
  const [webhookLog, setWebhookLog] = useState<{
    timestamp: string;
    invoiceNumber: string;
    status: 'success' | 'failed';
    message: string;
  } | null>(null);

  // Manual Verification State
  const [manualInvoiceId, setManualInvoiceId] = useState<string>(
    invoices.find((i) => i.status !== 'paid')?.id || invoices[0]?.id || ''
  );
  const [manualRefNote, setManualRefNote] = useState('Wire Ref: WIRE-TXN-88291 confirmed in SVB account');
  const [manualSuccessMsg, setManualSuccessMsg] = useState<string | null>(null);

  const handleCopy = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updatePaymentSettings({
      ...formData,
      activeProvider: activeTab,
      isConfigured: true,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSetActiveProvider = (provider: PaymentProvider) => {
    setActiveTab(provider);
    setFormData((prev) => ({ ...prev, activeProvider: provider }));
    updatePaymentSettings({ activeProvider: provider });
  };

  // Sample invoice for live preview
  const sampleInvoice = invoices[0] || {
    id: 'sample-inv-1',
    invoiceNumber: 'INV-2026-001',
    clientName: 'Acme Corporation',
    totalAmount: 3850.00,
    currency: 'USD',
  };

  const livePayUrl = generatePaymentUrl(sampleInvoice as any, {
    ...formData,
    activeProvider: activeTab,
    isConfigured: true,
  });

  // Handle Webhook Simulator Execution
  const handleExecuteWebhook = () => {
    const targetInvoice = invoices.find((i) => i.id === simulatedInvoiceId);
    if (!targetInvoice) {
      setWebhookLog({
        timestamp: new Date().toLocaleTimeString(),
        invoiceNumber: 'N/A',
        status: 'failed',
        message: 'No candidate invoice selected for webhook delivery.',
      });
      return;
    }

    // Mark invoice as paid
    updateInvoiceStatus(targetInvoice.id, 'paid');

    const generatedPayload = JSON.stringify(
      {
        event: simulatedEventType,
        event_id: `evt_${Date.now()}`,
        created: Math.floor(Date.now() / 1000),
        data: {
          invoice_id: targetInvoice.id,
          invoice_number: targetInvoice.invoiceNumber,
          amount_paid: targetInvoice.totalAmount,
          currency: targetInvoice.currency || 'USD',
          customer: {
            name: targetInvoice.clientName,
            email: targetInvoice.clientEmail,
          },
          gateway: activeTab,
          verified: true,
        },
      },
      null,
      2
    );

    setSimulatedPayloadJson(generatedPayload);
    setWebhookLog({
      timestamp: new Date().toLocaleTimeString(),
      invoiceNumber: targetInvoice.invoiceNumber,
      status: 'success',
      message: `200 OK: Invoice ${targetInvoice.invoiceNumber} verified and marked as Paid automatically!`,
    });
  };

  // Handle Manual Payment Verification
  const handleManualVerification = () => {
    const targetInvoice = invoices.find((i) => i.id === manualInvoiceId);
    if (!targetInvoice) return;

    updateInvoiceStatus(targetInvoice.id, 'paid');
    setManualSuccessMsg(`Invoice ${targetInvoice.invoiceNumber} verified & marked as Paid! (${manualRefNote})`);
    setTimeout(() => setManualSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-violet-500/10 border border-sky-200/60 dark:border-sky-800/40">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Payment Gateways & Checkout
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                Phase 3 Multi-Gateway
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure PayPal, Paystack, Flutterwave, Bank Wire, or Custom checkout links.
            </p>
          </div>
        </div>

        {onBackToInvoices && (
          <button
            type="button"
            onClick={onBackToInvoices}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            ← Back to Invoices
          </button>
        )}
      </div>

      {/* Active Gateway Selection Bar */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Active Payment Provider for Clients
          </h3>
          <span className="text-xs text-slate-400">
            Current: <strong className="text-sky-600 dark:text-sky-400 uppercase">{getProviderLabel(formData.activeProvider)}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {(['paypal', 'paystack', 'flutterwave', 'bank_transfer', 'custom_link'] as PaymentProvider[]).map((p) => {
            const isActive = formData.activeProvider === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => handleSetActiveProvider(p)}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition text-center ${
                  isActive
                    ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 shadow-sm ring-2 ring-sky-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <span className="text-xs font-bold capitalize">{getProviderLabel(p)}</span>
                <span className="text-[10px] mt-1 text-slate-400">
                  {isActive ? '● Active Primary' : 'Click to Set'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Gateway Configuration Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Gateway Form Settings */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* Tab Navigation for Gateways */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
              {[
                { id: 'paypal', label: 'PayPal' },
                { id: 'paystack', label: 'Paystack' },
                { id: 'flutterwave', label: 'Flutterwave' },
                { id: 'bank_transfer', label: 'Manual Bank Wire' },
                { id: 'custom_link', label: 'Custom / Stripe' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as PaymentProvider)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                    activeTab === tab.id
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                  {formData.activeProvider === tab.id && (
                    <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block align-middle" />
                  )}
                </button>
              ))}
            </div>

            {/* TAB 1: PAYPAL */}
            {activeTab === 'paypal' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-3.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200/60 dark:border-sky-800/40 text-xs text-sky-800 dark:text-sky-300">
                  Clients clicking <strong>Pay Online</strong> will be directed to PayPal’s secure checkout with your business email, invoice number, and exact currency total pre-populated.
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    PayPal Merchant / Business Email *
                  </label>
                  <input
                    type="email"
                    value={formData.paypalEmail || ''}
                    onChange={(e) => setFormData({ ...formData, paypalEmail: e.target.value })}
                    placeholder="billing@yourstudio.com"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Payments will be credited directly to this PayPal account.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    PayPal REST API Client ID (Optional, for SDK widgets)
                  </label>
                  <input
                    type="text"
                    value={formData.paypalClientId || ''}
                    onChange={(e) => setFormData({ ...formData, paypalClientId: e.target.value })}
                    placeholder="client_id_live_or_sandbox_..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: PAYSTACK */}
            {activeTab === 'paystack' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300">
                  Paystack supports card, bank transfer, and mobile money payments across Africa and international cards.
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Paystack Public Key
                  </label>
                  <input
                    type="text"
                    value={formData.paystackPublicKey || ''}
                    onChange={(e) => setFormData({ ...formData, paystackPublicKey: e.target.value })}
                    placeholder="pk_live_... or pk_test_..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Paystack Secret Key (for Webhooks)
                  </label>
                  <input
                    type="password"
                    value={formData.paystackSecretKey || ''}
                    onChange={(e) => setFormData({ ...formData, paystackSecretKey: e.target.value })}
                    placeholder="sk_live_... or sk_test_..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Paystack Payment Page URL Template (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.customPaymentUrl || ''}
                    onChange={(e) => setFormData({ ...formData, customPaymentUrl: e.target.value })}
                    placeholder="https://paystack.com/pay/workerhub-pay?amount={amount}&invoice={invoice}"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Use tags: <code className="text-sky-600">{'{amount}'}</code>, <code className="text-sky-600">{'{invoice}'}</code>, <code className="text-sky-600">{'{currency}'}</code>.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: FLUTTERWAVE */}
            {activeTab === 'flutterwave' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300">
                  Flutterwave enables payments across 150+ currencies including Card, M-Pesa, Bank Account, USSD, and QR.
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Flutterwave Public Key
                  </label>
                  <input
                    type="text"
                    value={formData.flutterwavePublicKey || ''}
                    onChange={(e) => setFormData({ ...formData, flutterwavePublicKey: e.target.value })}
                    placeholder="FLWPUBK_TEST-... or FLWPUBK-..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Flutterwave Payment Link Template
                  </label>
                  <input
                    type="url"
                    value={formData.customPaymentUrl || ''}
                    onChange={(e) => setFormData({ ...formData, customPaymentUrl: e.target.value })}
                    placeholder="https://flutterwave.com/pay/workerhub?amount={amount}&ref={invoice}"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: MANUAL BANK WIRE TRANSFER */}
            {activeTab === 'bank_transfer' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-3.5 rounded-xl bg-violet-50/70 dark:bg-violet-950/40 border border-violet-200/60 dark:border-violet-800/40 text-xs text-violet-800 dark:text-violet-300">
                  Bank wire transfer details are formatted cleanly and printed directly on PDF invoices and client portals for enterprise client wires.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Bank Name *
                    </label>
                    <input
                      type="text"
                      value={formData.bankName || ''}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      placeholder="e.g. JPMorgan Chase / SVB"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Account / Beneficiary Name *
                    </label>
                    <input
                      type="text"
                      value={formData.accountName || ''}
                      onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                      placeholder="e.g. Acme Creative Studio LLC"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Account Number / IBAN *
                    </label>
                    <input
                      type="text"
                      value={formData.accountNumber || ''}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      placeholder="e.g. GB29 XIBN 4005 1512 3456 78"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Routing / Sort Code
                    </label>
                    <input
                      type="text"
                      value={formData.routingOrSortCode || ''}
                      onChange={(e) => setFormData({ ...formData, routingOrSortCode: e.target.value })}
                      placeholder="e.g. 121000358 or 40-05-15"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      SWIFT / BIC Code
                    </label>
                    <input
                      type="text"
                      value={formData.swiftBic || ''}
                      onChange={(e) => setFormData({ ...formData, swiftBic: e.target.value })}
                      placeholder="e.g. CHASUS33"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Payment Reference Note
                    </label>
                    <input
                      type="text"
                      value={formData.paymentInstructions || ''}
                      onChange={(e) => setFormData({ ...formData, paymentInstructions: e.target.value })}
                      placeholder="e.g. Please include invoice number in wire memo"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: CUSTOM PAYMENT LINK / STRIPE / WISE */}
            {activeTab === 'custom_link' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-3.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200/60 dark:border-sky-800/40 text-xs text-sky-800 dark:text-sky-300">
                  Connect any custom payment gateway or hosted link (Stripe Payment Links, Wise, Revolut, Square, etc.).
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Custom Payment URL Template *
                  </label>
                  <input
                    type="url"
                    value={formData.customPaymentUrl || ''}
                    onChange={(e) => setFormData({ ...formData, customPaymentUrl: e.target.value })}
                    placeholder="https://buy.stripe.com/test_... or https://wise.com/pay/me?amount={amount}&desc={invoice}"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Placeholders supported: <span className="font-mono text-sky-600">{'{amount}'}</span>, <span className="font-mono text-sky-600">{'{invoice}'}</span>, <span className="font-mono text-sky-600">{'{currency}'}</span>, <span className="font-mono text-sky-600">{'{client}'}</span>.
                  </p>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-600 to-violet-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-sky-500/20 active:scale-95 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Configuration</span>
                </button>

                {saveSuccess && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4" />
                    Saved!
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleSetActiveProvider(activeTab)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
                  formData.activeProvider === activeTab
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {formData.activeProvider === activeTab ? '✓ Active Primary' : 'Set as Primary Gateway'}
              </button>
            </div>

          </form>
        </div>

        {/* Right Col: Live Preview & Details */}
        <div className="space-y-6">
          
          {/* Live Preview Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-sky-500" />
                Live Client Checkout Preview
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {sampleInvoice.invoiceNumber}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Billed To:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{sampleInvoice.clientName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Amount Due:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                  {formatCurrency(sampleInvoice.totalAmount, sampleInvoice.currency)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Gateway:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">
                  {getProviderLabel(activeTab)}
                </span>
              </div>

              {activeTab === 'bank_transfer' ? (
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                  <div>Bank: {formData.bankName || 'Silicon Valley Bank'}</div>
                  <div>IBAN: {formData.accountNumber || '9876543210'}</div>
                  <div>SWIFT: {formData.swiftBic || 'SVCBUS33'}</div>
                </div>
              ) : (
                <div className="pt-2">
                  <a
                    href={livePayUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className={`w-full py-2.5 px-3 rounded-xl font-bold text-center block text-xs shadow-sm transition ${
                      livePayUrl
                        ? 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white active:scale-95'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Pay Online ({getProviderLabel(activeTab)}) →
                  </a>
                </div>
              )}
            </div>

            {livePayUrl && (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={livePayUrl}
                  className="flex-1 px-2.5 py-1.5 text-[11px] font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 truncate"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(livePayUrl, 'preview-url')}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="Copy Pay URL"
                >
                  {copiedKey === 'preview-url' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          {/* Security & Token Info */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 space-y-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Secure Payment Processing
            </div>
            <p className="text-[11px] leading-relaxed">
              WorkerHub never stores cardholder CVVs or full sensitive numbers on client devices. All transactions redirect via TLS 1.3 encrypted handshakes.
            </p>
          </div>

        </div>

      </div>

      {/* --- WEBHOOK SIMULATOR & MANUAL VERIFICATION SUITE --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
        
        {/* Tool 1: Real-time Webhook Simulator */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Webhook Event Simulator
                </h4>
                <p className="text-[11px] text-slate-500">
                  Simulate gateway notifications to test automated invoice mark-as-paid.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Invoice
                </label>
                <select
                  value={simulatedInvoiceId}
                  onChange={(e) => setSimulatedInvoiceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} - {inv.clientName} ({formatCurrency(inv.totalAmount, inv.currency)}) [{inv.status.toUpperCase()}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Webhook Event
                </label>
                <select
                  value={simulatedEventType}
                  onChange={(e) => setSimulatedEventType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="charge.success">charge.success (Paystack)</option>
                  <option value="payment.captured">payment.captured (PayPal / Stripe)</option>
                  <option value="invoice.paid">invoice.paid (Flutterwave)</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExecuteWebhook}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 active:scale-95 transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Simulate Gateway Webhook Payload</span>
            </button>

            {webhookLog && (
              <div className="p-3.5 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] space-y-1.5 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400">
                  <span>LOG: {webhookLog.timestamp}</span>
                  <span className="text-emerald-400 font-bold">{webhookLog.status.toUpperCase()}</span>
                </div>
                <div>{webhookLog.message}</div>
              </div>
            )}

            {simulatedPayloadJson && (
              <details className="mt-2 text-[11px]">
                <summary className="text-slate-500 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300">
                  Inspect simulated JSON payload
                </summary>
                <pre className="mt-1.5 p-3 rounded-lg bg-slate-950 text-slate-300 font-mono overflow-x-auto text-[10px] max-h-40">
                  {simulatedPayloadJson}
                </pre>
              </details>
            )}
          </div>
        </div>

        {/* Tool 2: Manual Payment Verification */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Manual Wire & Bank Verification
              </h4>
              <p className="text-[11px] text-slate-500">
                Mark bank transfers as Paid with audit reference confirmation notes.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Pending / Unpaid Invoice
              </label>
              <select
                value={manualInvoiceId}
                onChange={(e) => setManualInvoiceId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} - {inv.clientName} ({formatCurrency(inv.totalAmount, inv.currency)}) [{inv.status.toUpperCase()}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bank Wire / Transaction Reference Notes
              </label>
              <input
                type="text"
                value={manualRefNote}
                onChange={(e) => setManualRefNote(e.target.value)}
                placeholder="e.g. Wire reference confirmed by bank teller"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="button"
              onClick={handleManualVerification}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Verify & Mark Invoice as Paid</span>
            </button>

            {manualSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold animate-in fade-in">
                ✓ {manualSuccessMsg}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default PaymentSettingsManager;
