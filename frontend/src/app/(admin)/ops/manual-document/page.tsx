'use client'

import { useState, useCallback, useEffect } from 'react'
import { useUmami } from '@/hooks/use-umami'
import { format } from 'date-fns'
import {
  FileText,
  Plus,
  Trash2,
  Printer,
  RotateCcw,
  Receipt,
  FileSpreadsheet,
  Wallet,
  Percent,
  Landmark,
  StickyNote,
  Users,
  Store,
  ListChecks,
} from 'lucide-react'
import { ConfirmDialog, FormField, KpiCard, KpiGrid, PageHeader, Panel, useConfirmAction } from '@/components/dash'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'

interface LineItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
}

interface DocumentData {
  documentNumber: string
  dateIssued: string
  validUntil: string
  clientName: string
  clientEmail: string
  clientPhone: string
  vendorName: string
  vendorEmail: string
  vendorPhone: string
  items: LineItem[]
  siteCharges: number
  discount: number
  discountType: 'PERCENTAGE' | 'FIXED'
  taxRate: number
  tokenMoneyPaid: number
  secondInstallment: number
  notes: string
  termsAndConditions: string
  bankName: string
  accountNumber: string
  accountName: string
}

const generateId = () => Math.random().toString(36).substring(2, 9)

const initialDocumentData: DocumentData = {
  documentNumber: '',
  dateIssued: format(new Date(), 'yyyy-MM-dd'),
  validUntil: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  vendorName: '',
  vendorEmail: '',
  vendorPhone: '',
  items: [{ id: generateId(), description: '', quantity: 1, rate: 0, amount: 0 }],
  siteCharges: 0,
  discount: 0,
  discountType: 'FIXED',
  taxRate: 0,
  tokenMoneyPaid: 0,
  secondInstallment: 0,
  notes: '',
  termsAndConditions: '',
  bankName: 'HDFC BANK',
  accountNumber: '50100570331614',
  accountName: 'ADITYA',
}

function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('en-IN')} Rs`
}

/** UI-only currency display (the printable document keeps its own format). */
function rupees(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount)
}

export default function ManualDocumentPage() {
  const { track } = useUmami()
  const [documentType, setDocumentType] = useState<'quotation' | 'invoice'>('quotation')
  const [data, setData] = useState<DocumentData>(initialDocumentData)
  const removeItemAsk = useConfirmAction<string>()

  useEffect(() => {
    track('ops:manual_document:page_view', { documentType })
  }, [track, documentType])

  // Calculate totals
  const subtotal = data.items.reduce((sum, item) => sum + item.amount, 0) + data.siteCharges
  const discountAmount = data.discountType === 'PERCENTAGE'
    ? (subtotal * data.discount) / 100
    : data.discount
  const taxableAmount = subtotal - discountAmount
  const taxAmount = (taxableAmount * data.taxRate) / 100
  const grandTotal = taxableAmount + taxAmount

  const updateField = <K extends keyof DocumentData>(field: K, value: DocumentData[K]) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== id) return item
        const updated = { ...item, [field]: value }
        if (field === 'quantity' || field === 'rate') {
          updated.amount = updated.quantity * updated.rate
        }
        return updated
      }),
    }))
  }

  const addLineItem = () => {
    setData((prev) => ({
      ...prev,
      items: [...prev.items, { id: generateId(), description: '', quantity: 1, rate: 0, amount: 0 }],
    }))
  }

  const removeLineItem = (id: string) => {
    if (data.items.length <= 1) return
    setData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }))
  }

  const resetForm = () => {
    setData(initialDocumentData)
  }

  const generateDocumentNumber = () => {
    const prefix = documentType === 'invoice' ? 'INV' : 'OMNI'
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    updateField('documentNumber', `${prefix}-${timestamp}-${random}`)
  }

  const openPrintPreview = useCallback(() => {
    const formatDate = (dateStr: string) => {
      try {
        return format(new Date(dateStr), 'dd-MM-yyyy')
      } catch {
        return dateStr
      }
    }

    const title = documentType === 'invoice' ? 'INVOICE' : 'QUOTATION'
    const documentTitle = `${documentType === 'invoice' ? 'Invoice' : 'Quotation'}_${data.documentNumber || 'Draft'}`
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`https://omnicassion.com/${documentType}/${data.documentNumber}`)}`

    const itemsHtml = data.items
      .filter((item) => item.description.trim())
      .map(
        (item) => `
      <tr style="border-bottom: 1px solid #d1d5db;">
        <td style="padding: 12px; font-size: 13px; border-right: 1px solid #d1d5db;">${item.description}</td>
        <td style="padding: 12px; text-align: center; font-size: 14px; border-right: 1px solid #d1d5db;">${item.quantity}</td>
        <td style="padding: 12px; text-align: right; font-size: 14px; border-right: 1px solid #d1d5db;">${formatCurrency(item.rate)}</td>
        <td style="padding: 12px; text-align: right; font-size: 14px; font-weight: 500;">${formatCurrency(item.amount)}</td>
      </tr>
    `
      )
      .join('')

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
      <div class="doc-number">${data.documentNumber || 'DRAFT'}</div>
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
        <p class="info-value">${data.clientName || 'N/A'}</p>
        ${data.clientEmail ? `<p class="info-small">${data.clientEmail}</p>` : ''}
        ${data.clientPhone ? `<p class="info-small">${data.clientPhone}</p>` : ''}
      </div>
      <div>
        <p class="info-label">Vendor:</p>
        <p class="info-value">${data.vendorName || 'N/A'}</p>
        ${data.vendorEmail ? `<p class="info-small">${data.vendorEmail}</p>` : ''}
        ${data.vendorPhone ? `<p class="info-small">${data.vendorPhone}</p>` : ''}
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
        ${data.siteCharges > 0 ? `
        <tr style="border-bottom: 1px solid #d1d5db;">
          <td colspan="2" style="padding: 12px; font-size: 13px; border-right: 1px solid #d1d5db;">Site Charges</td>
          <td style="padding: 12px; text-align: right; font-size: 14px; border-right: 1px solid #d1d5db;">${formatCurrency(data.siteCharges)}</td>
          <td style="padding: 12px; text-align: right; font-size: 14px; font-weight: 500;">${formatCurrency(data.siteCharges)}</td>
        </tr>
        ` : ''}
        <tr class="subtotal-row">
          <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold; border-right: 1px solid #d1d5db;">SUBTOTAL</td>
          <td style="padding: 12px; text-align: right; font-weight: bold;">${formatCurrency(subtotal)}</td>
        </tr>
        ${discountAmount > 0 ? `
        <tr>
          <td colspan="3" style="padding: 12px; text-align: right; font-weight: 600; border-right: 1px solid #d1d5db;">DISCOUNT${data.discountType === 'PERCENTAGE' ? ` (${data.discount}%)` : ''}</td>
          <td style="padding: 12px; text-align: right; font-weight: 600; color: #16a34a;">-${formatCurrency(discountAmount)}</td>
        </tr>
        ` : ''}
        ${taxAmount > 0 ? `
        <tr>
          <td colspan="3" style="padding: 12px; text-align: right; font-weight: 600; border-right: 1px solid #d1d5db;">TAX (${data.taxRate}%)</td>
          <td style="padding: 12px; text-align: right; font-weight: 600;">${formatCurrency(taxAmount)}</td>
        </tr>
        ` : ''}
        <tr class="total-row">
          <td colspan="3" style="padding: 14px; text-align: right; font-weight: bold; border-right: 1px solid #666;">GRAND TOTAL</td>
          <td style="padding: 14px; text-align: right; font-weight: bold;">${formatCurrency(grandTotal)}</td>
        </tr>
        ${data.tokenMoneyPaid > 0 ? `
        <tr>
          <td colspan="3" style="padding: 12px; text-align: right; border-right: 1px solid #d1d5db;">TOKEN MONEY PAID</td>
          <td style="padding: 12px; text-align: right;">${formatCurrency(data.tokenMoneyPaid)}</td>
        </tr>
        ` : ''}
        ${data.secondInstallment > 0 ? `
        <tr>
          <td colspan="3" style="padding: 12px; text-align: right; border-right: 1px solid #d1d5db;">SECOND INSTALLMENT</td>
          <td style="padding: 12px; text-align: right;">${formatCurrency(data.secondInstallment)}</td>
        </tr>
        ` : ''}
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
      <p style="font-size: 13px; margin-bottom: 6px;">Bank Name: ${data.bankName}</p>
      <p style="font-size: 13px; margin-bottom: 6px;">Account No: ${data.accountNumber}</p>
      <p style="font-size: 13px;">Account Name: ${data.accountName}</p>
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

    track('ops:manual_document:generate', { documentType, documentNumber: data.documentNumber })
  }, [data, documentType, subtotal, discountAmount, taxAmount, grandTotal, track])

  const docLabel = documentType === 'invoice' ? 'invoice' : 'quotation'
  const missingParties = !data.clientName.trim() || !data.vendorName.trim()
  const filledItems = data.items.filter((item) => item.description.trim()).length

  return (
    <div className="space-y-3">
      <PageHeader
        title="Manual Document Generator"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={resetForm}>
              <RotateCcw className="mr-1 h-4 w-4" />
              Reset
            </Button>
            <Button size="sm" onClick={openPrintPreview}>
              <Printer className="mr-1 h-4 w-4" />
              Preview & Print
            </Button>
          </>
        }
      />

      <KpiGrid>
        <KpiCard label="Document" value={documentType === 'invoice' ? 'Invoice' : 'Quotation'} icon={FileText} hint={data.documentNumber || 'No number yet'} />
        <KpiCard label="Line items" value={filledItems} icon={ListChecks} hint={`${data.items.length} row${data.items.length === 1 ? '' : 's'} in the form`} />
        <KpiCard label="Grand total" value={rupees(grandTotal)} icon={Wallet} hint={taxAmount > 0 ? `Incl. tax ${rupees(taxAmount)}` : 'No tax applied'} />
        <KpiCard label="Balance after payments" value={rupees(grandTotal - data.tokenMoneyPaid - data.secondInstallment)} icon={Percent} hint="Total less token and installment" />
      </KpiGrid>

      {/* Document Type Tabs */}
      <Tabs value={documentType} onValueChange={(v) => setDocumentType(v as 'quotation' | 'invoice')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="quotation" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Quotation
          </TabsTrigger>
          <TabsTrigger value="invoice" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Invoice
          </TabsTrigger>
        </TabsList>

        <TabsContent value={documentType} className="mt-3">
          <div className="grid items-start gap-3 lg:grid-cols-3">
            {/* Left: form sections */}
            <div className="space-y-3 lg:col-span-2">
              <Panel title="Document details" description={`Basic details for this ${docLabel}`} icon={FileText}>
                <div className="space-y-3">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <FormField label="Document number" htmlFor="documentNumber">
                        <Input
                          id="documentNumber"
                          value={data.documentNumber}
                          onChange={(e) => updateField('documentNumber', e.target.value)}
                          placeholder="e.g., OMNI-ABC123"
                        />
                      </FormField>
                    </div>
                    <Button variant="outline" onClick={generateDocumentNumber} type="button">
                      Generate
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormField label="Date issued" htmlFor="dateIssued">
                      <Input
                        id="dateIssued"
                        type="date"
                        value={data.dateIssued}
                        onChange={(e) => updateField('dateIssued', e.target.value)}
                      />
                    </FormField>
                    <FormField label="Valid until" htmlFor="validUntil">
                      <Input
                        id="validUntil"
                        type="date"
                        value={data.validUntil}
                        onChange={(e) => updateField('validUntil', e.target.value)}
                      />
                    </FormField>
                  </div>
                </div>
              </Panel>

              <div className="grid gap-3 md:grid-cols-2">
                <Panel title="Client" description="Who the document is issued to" icon={Users}>
                  <div className="space-y-3">
                    <FormField
                      label="Client name *"
                      htmlFor="clientName"
                      hint={!data.clientName.trim() ? 'Required for a complete document.' : undefined}
                    >
                      <Input
                        id="clientName"
                        value={data.clientName}
                        onChange={(e) => updateField('clientName', e.target.value)}
                        placeholder="Enter client name"
                      />
                    </FormField>
                    <FormField label="Email" htmlFor="clientEmail">
                      <Input
                        id="clientEmail"
                        type="email"
                        value={data.clientEmail}
                        onChange={(e) => updateField('clientEmail', e.target.value)}
                        placeholder="client@example.com"
                      />
                    </FormField>
                    <FormField label="Phone" htmlFor="clientPhone">
                      <Input
                        id="clientPhone"
                        value={data.clientPhone}
                        onChange={(e) => updateField('clientPhone', e.target.value)}
                        placeholder="+91 98765 43210"
                      />
                    </FormField>
                  </div>
                </Panel>

                <Panel title="Vendor" description="Who provides the service" icon={Store}>
                  <div className="space-y-3">
                    <FormField
                      label="Vendor name *"
                      htmlFor="vendorName"
                      hint={!data.vendorName.trim() ? 'Required for a complete document.' : undefined}
                    >
                      <Input
                        id="vendorName"
                        value={data.vendorName}
                        onChange={(e) => updateField('vendorName', e.target.value)}
                        placeholder="Enter vendor/business name"
                      />
                    </FormField>
                    <FormField label="Email" htmlFor="vendorEmail">
                      <Input
                        id="vendorEmail"
                        type="email"
                        value={data.vendorEmail}
                        onChange={(e) => updateField('vendorEmail', e.target.value)}
                        placeholder="vendor@example.com"
                      />
                    </FormField>
                    <FormField label="Phone" htmlFor="vendorPhone">
                      <Input
                        id="vendorPhone"
                        value={data.vendorPhone}
                        onChange={(e) => updateField('vendorPhone', e.target.value)}
                        placeholder="+91 98765 43210"
                      />
                    </FormField>
                  </div>
                </Panel>
              </div>

              <Panel
                title="Line items"
                description="Items without a description are left out of the printed document"
                icon={ListChecks}
                headerRight={
                  <Button variant="outline" size="sm" onClick={addLineItem}>
                    <Plus className="mr-1 h-4 w-4" />
                    Add item
                  </Button>
                }
              >
                <div className="space-y-2">
                  {data.items.map((item, index) => (
                    <div key={item.id} className="bg-muted/30 space-y-3 rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-xs font-medium">Item {index + 1}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItemAsk.ask(item.id)}
                          title="Remove item"
                          aria-label="Remove item"
                          disabled={data.items.length === 1}
                          className="text-destructive size-7 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                      />
                      <div className="grid grid-cols-3 gap-3">
                        <FormField label="Qty">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                          />
                        </FormField>
                        <FormField label="Rate (₹)">
                          <Input
                            type="number"
                            min="0"
                            value={item.rate}
                            onChange={(e) => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                          />
                        </FormField>
                        <FormField label="Amount">
                          <Input value={rupees(item.amount)} disabled className="bg-muted" />
                        </FormField>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              <div className="grid gap-3 md:grid-cols-2">
                <Panel title="Charges and adjustments" icon={Percent}>
                  <div className="space-y-3">
                    <FormField label="Site charges (₹)" htmlFor="siteCharges">
                      <Input
                        id="siteCharges"
                        type="number"
                        min="0"
                        value={data.siteCharges}
                        onChange={(e) => updateField('siteCharges', parseFloat(e.target.value) || 0)}
                      />
                    </FormField>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Discount" htmlFor="discount">
                        <Input
                          id="discount"
                          type="number"
                          min="0"
                          value={data.discount}
                          onChange={(e) => updateField('discount', parseFloat(e.target.value) || 0)}
                        />
                      </FormField>
                      <FormField label="Discount type" htmlFor="discountType">
                        <Select
                          value={data.discountType}
                          onValueChange={(v) => updateField('discountType', v as 'PERCENTAGE' | 'FIXED')}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FIXED">Fixed amount</SelectItem>
                            <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormField>
                    </div>
                    <FormField label="Tax rate (%)" htmlFor="taxRate">
                      <Input
                        id="taxRate"
                        type="number"
                        min="0"
                        max="100"
                        value={data.taxRate}
                        onChange={(e) => updateField('taxRate', parseFloat(e.target.value) || 0)}
                      />
                    </FormField>
                  </div>
                </Panel>

                <Panel title="Payments received" icon={Wallet}>
                  <div className="space-y-3">
                    <FormField label="Token money paid (₹)" htmlFor="tokenMoneyPaid">
                      <Input
                        id="tokenMoneyPaid"
                        type="number"
                        min="0"
                        value={data.tokenMoneyPaid}
                        onChange={(e) => updateField('tokenMoneyPaid', parseFloat(e.target.value) || 0)}
                      />
                    </FormField>
                    <FormField label="Second installment (₹)" htmlFor="secondInstallment">
                      <Input
                        id="secondInstallment"
                        type="number"
                        min="0"
                        value={data.secondInstallment}
                        onChange={(e) => updateField('secondInstallment', parseFloat(e.target.value) || 0)}
                      />
                    </FormField>
                  </div>
                </Panel>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Panel title="Notes and terms" icon={StickyNote}>
                  <div className="space-y-3">
                    <FormField label="Notes" htmlFor="notes">
                      <Textarea
                        id="notes"
                        value={data.notes}
                        onChange={(e) => updateField('notes', e.target.value)}
                        placeholder="Additional notes for the client..."
                        rows={3}
                      />
                    </FormField>
                    <FormField label="Terms & conditions" htmlFor="termsAndConditions">
                      <Textarea
                        id="termsAndConditions"
                        value={data.termsAndConditions}
                        onChange={(e) => updateField('termsAndConditions', e.target.value)}
                        placeholder="Terms and conditions..."
                        rows={3}
                      />
                    </FormField>
                  </div>
                </Panel>

                <Panel title="Bank details" description="Shown on the printed document" icon={Landmark}>
                  <div className="space-y-3">
                    <FormField label="Bank name" htmlFor="bankName">
                      <Input id="bankName" value={data.bankName} onChange={(e) => updateField('bankName', e.target.value)} />
                    </FormField>
                    <FormField label="Account number" htmlFor="accountNumber">
                      <Input
                        id="accountNumber"
                        value={data.accountNumber}
                        onChange={(e) => updateField('accountNumber', e.target.value)}
                      />
                    </FormField>
                    <FormField label="Account name" htmlFor="accountName">
                      <Input
                        id="accountName"
                        value={data.accountName}
                        onChange={(e) => updateField('accountName', e.target.value)}
                      />
                    </FormField>
                  </div>
                </Panel>
              </div>
            </div>

            {/* Right: sticky summary with the primary action */}
            <div className="lg:sticky lg:top-3">
              <Panel title="Summary" description={`${filledItems} item${filledItems === 1 ? '' : 's'}`}>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="tabular">{rupees(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="tabular">-{rupees(discountAmount)}</span>
                    </div>
                  )}
                  {taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax ({data.taxRate}%)</span>
                      <span className="tabular">{rupees(taxAmount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-base font-semibold">
                    <span>Grand total</span>
                    <span className="tabular">{rupees(grandTotal)}</span>
                  </div>
                  {data.tokenMoneyPaid > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Token money paid</span>
                      <span className="tabular">{rupees(data.tokenMoneyPaid)}</span>
                    </div>
                  )}
                  {data.secondInstallment > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Second installment</span>
                      <span className="tabular">{rupees(data.secondInstallment)}</span>
                    </div>
                  )}
                </div>
                {missingParties && (
                  <p className="text-muted-foreground mt-3 text-xs">
                    Add the client and vendor names so the {docLabel} is complete.
                  </p>
                )}
                <Button className="mt-3 w-full" onClick={openPrintPreview}>
                  <Printer className="mr-1 h-4 w-4" />
                  Preview & Print
                </Button>
              </Panel>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      <ConfirmDialog
        {...removeItemAsk.dialogProps}
        title="Remove line item?"
        description="This line item will be removed from the document."
        confirmLabel="Remove"
        onConfirm={() => {
          if (removeItemAsk.target) removeLineItem(removeItemAsk.target)
        }}
      />
    </div>
  )
}
