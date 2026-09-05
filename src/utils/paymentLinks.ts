// src/utils/paymentLinks.ts
import { Invoice, PaymentSettings, PaymentProvider } from '../types';

/**
 * Returns human-readable label for a payment provider
 */
export function getProviderLabel(provider: PaymentProvider): string {
  switch (provider) {
    case 'paypal':
      return 'PayPal';
    case 'paystack':
      return 'Paystack';
    case 'flutterwave':
      return 'Flutterwave';
    case 'bank_transfer':
      return 'Direct Bank Transfer';
    case 'custom_link':
      return 'Online Payment';
    default:
      return 'Credit Card / Bank';
  }
}

/**
 * Generates an active checkout or payment URL for an invoice
 */
export function generatePaymentUrl(
  invoice: Invoice,
  settings?: PaymentSettings | null,
  portalBaseUrl?: string
): string | null {
  if (!settings || !settings.isConfigured) {
    // If no custom gateway is configured, fallback to direct client portal link if provided
    return portalBaseUrl ? `${portalBaseUrl}?pay=${invoice.id}` : null;
  }

  switch (settings.activeProvider) {
    case 'paypal': {
      if (!settings.paypalEmail) return null;
      const baseUrl = 'https://www.paypal.com/cgi-bin/webscr';
      const params = new URLSearchParams({
        cmd: '_xclick',
        business: settings.paypalEmail,
        item_name: `WorkerHub Invoice ${invoice.invoiceNumber}`,
        item_number: invoice.invoiceNumber,
        amount: invoice.totalAmount.toFixed(2),
        currency_code: invoice.currency || 'USD',
        no_shipping: '1',
      });
      return `${baseUrl}?${params.toString()}`;
    }

    case 'paystack': {
      // Paystack hosted link or public payment page
      if (settings.customPaymentUrl) {
        return interpolateUrl(settings.customPaymentUrl, invoice);
      }
      return `https://paystack.com/pay/workerhub-${invoice.invoiceNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    }

    case 'flutterwave': {
      // Flutterwave hosted link
      if (settings.customPaymentUrl) {
        return interpolateUrl(settings.customPaymentUrl, invoice);
      }
      return `https://flutterwave.com/pay/workerhub-${invoice.invoiceNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    }

    case 'custom_link': {
      if (!settings.customPaymentUrl) return null;
      return interpolateUrl(settings.customPaymentUrl, invoice);
    }

    case 'bank_transfer':
    default:
      return null;
  }
}

/**
 * Replace placeholders like {amount}, {invoice}, {currency} in custom URLs
 */
function interpolateUrl(templateUrl: string, invoice: Invoice): string {
  return templateUrl
    .replace(/\{amount\}/gi, invoice.totalAmount.toFixed(2))
    .replace(/\{invoice\}/gi, encodeURIComponent(invoice.invoiceNumber))
    .replace(/\{currency\}/gi, encodeURIComponent(invoice.currency || 'USD'))
    .replace(/\{client\}/gi, encodeURIComponent(invoice.clientName || ''));
}

/**
 * Format Bank Transfer details into structured text for PDF invoices and portal
 */
export function formatBankTransferDetails(settings: PaymentSettings, invoice: Invoice): string {
  const parts: string[] = [];
  if (settings.bankName) parts.push(`Bank: ${settings.bankName}`);
  if (settings.accountName) parts.push(`Account Name: ${settings.accountName}`);
  if (settings.accountNumber) parts.push(`Account Number: ${settings.accountNumber}`);
  if (settings.routingOrSortCode) parts.push(`Routing / Sort Code: ${settings.routingOrSortCode}`);
  if (settings.swiftBic) parts.push(`SWIFT / BIC: ${settings.swiftBic}`);
  parts.push(`Payment Reference: ${invoice.invoiceNumber}`);
  if (settings.paymentInstructions) parts.push(`Note: ${settings.paymentInstructions}`);

  return parts.join('\n');
}
