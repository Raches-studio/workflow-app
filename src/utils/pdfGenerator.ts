// src/utils/pdfGenerator.ts
import { jsPDF } from 'jspdf';
import { Invoice, UserProfile, PaymentSettings } from '../types';
import { formatCurrency } from './formatters';
import { generatePaymentUrl, formatBankTransferDetails, getProviderLabel } from './paymentLinks';

/**
 * Generates and downloads a clean, professional vector PDF invoice.
 */
export function generateInvoicePDF(
  invoice: Invoice, 
  profile?: UserProfile | null, 
  paymentSettings?: PaymentSettings | null,
  portalUrl?: string
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const primaryColor = [14, 116, 144]; // Sky-700 / Teal #0e7490
  const darkTextColor = [15, 23, 42]; // Slate-900 #0f172a
  const mutedTextColor = [100, 116, 139]; // Slate-500 #64748b
  const borderColor = [226, 232, 240]; // Slate-200 #e2e8f0
  const tableHeaderBg = [241, 245, 249]; // Slate-100 #f1f5f9
  const tableRowAltBg = [248, 250, 252]; // Slate-50 #f8fafc

  let y = margin;

  // --- HEADER SECTION ---
  // Studio / Freelancer Brand (Top Left)
  const businessName = profile?.businessName || 'WorkerHub Studio';
  const senderName = profile?.fullName || 'Freelance Professional';
  const senderEmail = profile?.email || '';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(businessName, margin, y + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(senderName, margin, y + 10);
  if (senderEmail) {
    doc.text(senderEmail, margin, y + 14);
  }

  // Invoice Title & Meta (Top Right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('INVOICE', pageWidth - margin, y + 2, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`# ${invoice.invoiceNumber}`, pageWidth - margin, y + 8, { align: 'right' });

  // Status Badge
  const statusColors: Record<string, [number, number, number]> = {
    paid: [16, 185, 129], // Emerald
    sent: [14, 165, 233], // Sky
    draft: [148, 163, 184], // Slate
    overdue: [244, 63, 94], // Rose
  };
  const statusRgb = statusColors[invoice.status] || statusColors.draft;
  
  doc.setFillColor(statusRgb[0], statusRgb[1], statusRgb[2]);
  doc.roundedRect(pageWidth - margin - 24, y + 11, 24, 6, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(invoice.status.toUpperCase(), pageWidth - margin - 12, y + 15, { align: 'center' });

  y += 26;

  // Divider line
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  y += 8;

  // --- BILL TO & DATES METADATA ---
  const colWidth = contentWidth / 2;

  // Billed To (Left Column)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text('BILLED TO', margin, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text(invoice.clientName, margin, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  let clientY = y + 10;
  if (invoice.clientCompany) {
    doc.text(invoice.clientCompany, margin, clientY);
    clientY += 4.5;
  }
  if (invoice.clientEmail) {
    doc.text(invoice.clientEmail, margin, clientY);
    clientY += 4.5;
  }

  // Invoice Details (Right Column)
  const metaLeft = margin + colWidth + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text('INVOICE DETAILS', metaLeft, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  
  doc.text('Issue Date:', metaLeft, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text(invoice.issueDate, pageWidth - margin, y + 5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text('Due Date:', metaLeft, y + 10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text(invoice.dueDate, pageWidth - margin, y + 10, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text('Payment Terms:', metaLeft, y + 15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text(`Net ${invoice.paymentTermsDays || 14} Days`, pageWidth - margin, y + 15, { align: 'right' });

  y = Math.max(clientY, y + 22) + 4;

  // --- LINE ITEMS TABLE ---
  const tableHeaderHeight = 8;
  const colDescWidth = contentWidth * 0.50;
  const colTypeWidth = contentWidth * 0.16;

  // Table Header Background
  doc.setFillColor(tableHeaderBg[0], tableHeaderBg[1], tableHeaderBg[2]);
  doc.roundedRect(margin, y, contentWidth, tableHeaderHeight, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  
  doc.text('DESCRIPTION', margin + 3, y + 5.5);
  doc.text('TYPE', margin + colDescWidth + 2, y + 5.5);
  doc.text('QTY / HRS', margin + colDescWidth + colTypeWidth + 2, y + 5.5);
  doc.text('AMOUNT', pageWidth - margin - 3, y + 5.5, { align: 'right' });

  y += tableHeaderHeight + 2;

  // Render Line Items
  const items = invoice.items || [];
  items.forEach((item, index) => {
    const rowHeight = 7.5;
    
    // Alternating row background
    if (index % 2 === 1) {
      doc.setFillColor(tableRowAltBg[0], tableRowAltBg[1], tableRowAltBg[2]);
      doc.rect(margin, y - 1.5, contentWidth, rowHeight, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);

    // Truncate long descriptions
    const cleanDesc = doc.splitTextToSize(item.description || 'Line item', colDescWidth - 4);
    doc.text(cleanDesc[0], margin + 3, y + 3.5);

    // Type Badge / text
    doc.setFontSize(7.5);
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    const typeLabel = item.type === 'hourly_log' ? 'Hourly' : item.type === 'milestone' ? 'Milestone' : item.type === 'retainer' ? 'Retainer' : 'Custom';
    doc.text(typeLabel, margin + colDescWidth + 2, y + 3.5);

    // Quantity / Hours
    doc.setFontSize(8.5);
    doc.text(`${item.quantity}`, margin + colDescWidth + colTypeWidth + 2, y + 3.5);

    // Amount
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(formatCurrency(item.amount), pageWidth - margin - 3, y + 3.5, { align: 'right' });

    y += rowHeight;

    // Check if new page needed
    if (y > pageHeight - 55) {
      doc.addPage();
      y = margin;
    }
  });

  y += 4;

  // Divider above totals
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  y += 6;

  // --- FINANCIAL SUMMARY & NOTES ---
  const summaryBoxWidth = 75;
  const summaryLeft = pageWidth - margin - summaryBoxWidth;

  // Notes and Payment on Left
  let notesText = invoice.notes || '';
  if (paymentSettings?.isConfigured && paymentSettings.activeProvider === 'bank_transfer') {
    const bankDetails = formatBankTransferDetails(paymentSettings, invoice);
    notesText = notesText ? `${notesText}\n\nBANK TRANSFER DETAILS:\n${bankDetails}` : `BANK TRANSFER DETAILS:\n${bankDetails}`;
  }

  if (notesText) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.text('PAYMENT TERMS & INSTRUCTIONS', margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    const splitNotes = doc.splitTextToSize(notesText, contentWidth - summaryBoxWidth - 10);
    doc.text(splitNotes, margin, y + 4.5);
  }

  // Pay Online Button (if online provider configured or portal URL provided)
  const payUrl = generatePaymentUrl(invoice, paymentSettings, portalUrl);
  if (payUrl) {
    const btnY = y + 22;
    const providerName = paymentSettings?.activeProvider ? getProviderLabel(paymentSettings.activeProvider) : 'Online';
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.roundedRect(margin, btnY, 56, 7.5, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.textWithLink(`PAY ONLINE (${providerName.toUpperCase()})`, margin + 4, btnY + 5, { url: payUrl });
  }

  // Summary Table on Right
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text('Subtotal:', summaryLeft, y + 1);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text(formatCurrency(invoice.subtotal), pageWidth - margin, y + 1, { align: 'right' });

  if (invoice.taxRate > 0) {
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.text(`Tax (${invoice.taxRate}%):`, summaryLeft, y + 1);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(formatCurrency(invoice.taxAmount), pageWidth - margin, y + 1, { align: 'right' });
  }

  y += 7;

  // Total Due Highlight Banner
  doc.setFillColor(tableHeaderBg[0], tableHeaderBg[1], tableHeaderBg[2]);
  doc.roundedRect(summaryLeft - 3, y - 2, summaryBoxWidth + 3, 10, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('TOTAL DUE:', summaryLeft, y + 4.5);

  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(formatCurrency(invoice.totalAmount), pageWidth - margin, y + 4.5, { align: 'right' });

  // --- FOOTER ---
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(
    'Thank you for your business. Please remit payment by the due date specified above.',
    pageWidth / 2,
    pageHeight - 12,
    { align: 'center' }
  );

  // Trigger browser download
  const filename = `${invoice.invoiceNumber || 'Invoice'}.pdf`;
  doc.save(filename);
}
