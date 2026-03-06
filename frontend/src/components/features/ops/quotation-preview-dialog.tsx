'use client'

import { useCallback } from 'react'
import { format } from 'date-fns'
import type { QuotationTemplateData } from './quotation-template'

interface QuotationPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: QuotationTemplateData | null
  type?: 'quotation' | 'invoice'
}

export function QuotationPreviewDialog({
  open,
  onOpenChange,
  data,
  type = 'quotation',
}: QuotationPreviewDialogProps) {

  const openInNewTab = useCallback(() => {
    if (!data) return

    const formatCurrency = (amount: number) => `${amount.toLocaleString('en-IN')} Rs`
    const formatDate = (dateStr: string) => {
      try {
        return format(new Date(dateStr), 'dd-MM-yyyy')
      } catch {
        return dateStr
      }
    }

    const title = type === 'invoice' ? 'INVOICE' : 'QUOTATION'
    const documentTitle = `${type === 'invoice' ? 'Invoice' : 'Quotation'}_${data.quotationNumber}`
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`https://omnicassion.com/${type}/${data.quotationNumber}`)}`

    const itemsHtml = data.items.map(item => `
      <tr style="border-bottom: 1px solid #d1d5db;">
        <td style="padding: 12px; font-size: 13px; border-right: 1px solid #d1d5db;">${item.description}</td>
        <td style="padding: 12px; text-align: center; font-size: 14px; border-right: 1px solid #d1d5db;">${item.quantity}</td>
        <td style="padding: 12px; text-align: right; font-size: 14px; border-right: 1px solid #d1d5db;">${formatCurrency(item.rate)}</td>
        <td style="padding: 12px; text-align: right; font-size: 14px; font-weight: 500;">${formatCurrency(item.amount)}</td>
      </tr>
    `).join('')

    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>${documentTitle}</title>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #f3f4f6;
      padding: 40px;
      min-height: 100vh;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border: 3px solid #000;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 20px;
      border-bottom: 2px solid #000;
      margin-bottom: 24px;
    }
    .logo { height: 60px; margin-bottom: 8px; }
    .qr { width: 80px; height: 80px; border-radius: 4px; }
    .title-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }
    .title { font-size: 28px; font-weight: bold; }
    .doc-number {
      border: 2px solid #000;
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 600;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 32px;
      margin-bottom: 24px;
      font-size: 14px;
    }
    .info-label { font-weight: 600; margin-bottom: 4px; }
    .info-value { margin-bottom: 12px; }
    .info-small { font-size: 12px; color: #666; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      border: 1px solid #d1d5db;
    }
    th {
      background: #000;
      color: white;
      padding: 12px;
      text-align: left;
      font-size: 13px;
      font-weight: 600;
    }
    .total-row { background: #000; color: white; }
    .subtotal-row { background: #f3f4f6; }
    .bank-details {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 24px;
    }
    .footer {
      border-top: 2px solid #000;
      padding-top: 16px;
      text-align: center;
    }
    .tagline { font-size: 18px; font-weight: bold; margin-top: 8px; }
    .print-btn {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #000;
      color: white;
      border: none;
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 500;
      border-radius: 6px;
      cursor: pointer;
    }
    .print-btn:hover { background: #333; }
    @media print {
      body { background: white; padding: 0; }
      .container { border: none; box-shadow: none; padding: 20px; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">Print / Download PDF</button>

  <div class="container">
    <div class="header">
      <div>
        <img src="/images/omnilogo.avif" alt="Omnicassion" class="logo" onerror="this.style.display='none'">
        <p style="font-size: 12px; font-weight: 600;">Event Management Platform</p>
        <p style="font-size: 11px; color: #666;">All types of vendors and services related to your event</p>
      </div>
      <img src="${qrCodeUrl}" alt="QR Code" class="qr">
    </div>

    <div class="title-row">
      <h1 class="title">${title}</h1>
      <div class="doc-number">${data.quotationNumber}</div>
    </div>

    <div class="info-grid">
      <div>
        <p class="info-label">Date Issued:</p>
        <p class="info-value">${formatDate(data.dateIssued)}</p>
        ${data.validUntil ? `
        <p class="info-label">Valid Until:</p>
        <p class="info-value">${formatDate(data.validUntil)}</p>
        ` : ''}
        <p class="info-label">Issued to:</p>
        <p class="info-value">${data.clientName}</p>
        ${data.clientEmail ? `<p class="info-small">${data.clientEmail}</p>` : ''}
        ${data.clientPhone ? `<p class="info-small">${data.clientPhone}</p>` : ''}
      </div>
      <div>
        <p class="info-label">Vendor:</p>
        <p class="info-value">${data.vendorName}</p>
      </div>
      <div style="text-align: right;">
        <p class="info-label">Contact:</p>
        <p class="info-small">omnicassion@gmail.com</p>
        <p class="info-small">+91-6284598500</p>
        <p class="info-small">omnicassion.com</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="border-right: 1px solid #666;">SERVICE</th>
          <th style="text-align: center; width: 80px; border-right: 1px solid #666;">QTY</th>
          <th style="text-align: right; width: 120px; border-right: 1px solid #666;">PRICE</th>
          <th style="text-align: right; width: 120px;">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
        <tr class="subtotal-row">
          <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold; border-right: 1px solid #d1d5db;">SUBTOTAL</td>
          <td style="padding: 12px; text-align: right; font-weight: bold;">${formatCurrency(data.subtotal)}</td>
        </tr>
        ${data.taxAmount && data.taxAmount > 0 ? `
        <tr>
          <td colspan="3" style="padding: 12px; text-align: right; font-weight: 600; border-right: 1px solid #d1d5db;">TAX (${data.taxRate || 0}%)</td>
          <td style="padding: 12px; text-align: right; font-weight: 600;">${formatCurrency(data.taxAmount)}</td>
        </tr>
        ` : ''}
        ${data.discount && data.discount > 0 ? `
        <tr>
          <td colspan="3" style="padding: 12px; text-align: right; font-weight: 600; border-right: 1px solid #d1d5db;">DISCOUNT</td>
          <td style="padding: 12px; text-align: right; font-weight: 600; color: #16a34a;">-${formatCurrency(data.discount)}</td>
        </tr>
        ` : ''}
        <tr class="total-row">
          <td colspan="3" style="padding: 14px; text-align: right; font-weight: bold; border-right: 1px solid #666;">GRAND TOTAL</td>
          <td style="padding: 14px; text-align: right; font-weight: bold;">${formatCurrency(data.grandTotal)}</td>
        </tr>
      </tbody>
    </table>

    ${data.notes || data.termsAndConditions ? `
    <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #e5e7eb;">
      ${data.notes ? `
      <p style="font-weight: bold; font-size: 13px; margin-bottom: 4px;">Notes:</p>
      <p style="font-size: 13px; color: #374151; margin-bottom: 12px; white-space: pre-wrap;">${data.notes}</p>
      ` : ''}
      ${data.termsAndConditions ? `
      <p style="font-weight: bold; font-size: 13px; margin-bottom: 4px;">Terms & Conditions:</p>
      <p style="font-size: 13px; color: #374151; white-space: pre-wrap;">${data.termsAndConditions}</p>
      ` : ''}
    </div>
    ` : ''}

    <div class="bank-details">
      <p style="font-weight: bold; font-size: 13px; margin-bottom: 12px;">Company Bank Details:</p>
      <p style="font-size: 13px; margin-bottom: 6px;">Bank Name: HDFC BANK</p>
      <p style="font-size: 13px; margin-bottom: 6px;">Account No: 50100570331614</p>
      <p style="font-size: 13px;">Account Name: ADITYA</p>
    </div>

    <div class="footer">
      <p style="font-size: 12px;">Visit <strong>www.omnicassion.com</strong> to access our services</p>
      <p class="tagline">JUST SIT BACK AND ENJOY</p>
    </div>
  </div>
</body>
</html>`

    const newWindow = window.open('', '_blank')
    if (newWindow) {
      newWindow.document.write(html)
      newWindow.document.close()
    }

    onOpenChange(false)
  }, [data, type, onOpenChange])

  // Auto-open when dialog should be shown
  if (open && data) {
    openInNewTab()
  }

  return null
}

export default QuotationPreviewDialog
