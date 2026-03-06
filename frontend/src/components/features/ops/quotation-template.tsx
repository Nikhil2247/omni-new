'use client'

import { forwardRef } from 'react'
import { format } from 'date-fns'
import { QRCodeSVG } from 'qrcode.react'

export interface QuotationTemplateData {
  // Header Info
  quotationNumber: string
  dateIssued: string
  validUntil?: string | null

  // Client Info
  clientName: string
  clientEmail?: string | null
  clientPhone?: string | null

  // Vendor Info
  vendorName: string
  vendorEmail?: string | null
  vendorPhone?: string | null

  // Line Items
  items: Array<{
    description: string
    quantity: number
    rate: number
    amount: number
  }>

  // Charges & Calculations
  siteCharges?: number
  subtotal: number
  discount?: number
  discountType?: 'PERCENTAGE' | 'FIXED' | null
  taxRate?: number | null
  taxAmount?: number | null
  grandTotal: number

  // Payment Info
  tokenMoneyPaid?: number
  secondInstallment?: number

  // Bank Details
  bankName?: string
  accountNumber?: string
  accountName?: string

  // Notes
  notes?: string | null
  termsAndConditions?: string | null
}

interface QuotationTemplateProps {
  data: QuotationTemplateData
  type?: 'quotation' | 'invoice'
}

export const QuotationTemplate = forwardRef<HTMLDivElement, QuotationTemplateProps>(
  ({ data, type = 'quotation' }, ref) => {
    const formatCurrency = (amount: number) => {
      return `${amount.toLocaleString('en-IN')} Rs`
    }

    const formatDate = (dateStr: string) => {
      try {
        return format(new Date(dateStr), 'dd-MM-yyyy')
      } catch {
        return dateStr
      }
    }

    const title = type === 'invoice' ? 'INVOICE' : 'QUOTATION'
    const numberPrefix = type === 'invoice' ? 'INV' : 'OMNI'

    return (
      <div
        ref={ref}
        className="bg-white rounded-lg shadow-lg p-8 border-4 border-black max-w-4xl mx-auto"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-black">
          <div>
            <img
              alt="Omnicassion"
              className="h-16 mb-2"
              src="/images/omnilogo.avif"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <p className="text-xs font-semibold">Event Management Platform</p>
            <p className="text-xs text-gray-600">
              All types of vendors and services related to your event are provided here
            </p>
          </div>
          <div className="text-right">
            <div className="w-16 h-16 ml-auto mb-2">
              <QRCodeSVG
                value={`https://omnicassion.com/${type}/${data.quotationNumber}`}
                size={64}
                level="M"
              />
            </div>
          </div>
        </div>

        {/* Title and Number */}
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-3xl font-bold">{title}</h1>
          <div className="border-2 border-black px-4 py-2">
            <span className="text-sm font-semibold">{data.quotationNumber}</span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-3 gap-8 mb-6 text-sm">
          <div>
            <p className="font-semibold mb-1">Date Issued:</p>
            <p className="mb-4">{formatDate(data.dateIssued)}</p>
            {data.validUntil && (
              <>
                <p className="font-semibold mb-1">Valid Until:</p>
                <p className="mb-4">{formatDate(data.validUntil)}</p>
              </>
            )}
            <p className="font-semibold mb-1">Issued to:</p>
            <p>{data.clientName}</p>
            {data.clientEmail && <p className="text-xs text-gray-600">{data.clientEmail}</p>}
            {data.clientPhone && <p className="text-xs text-gray-600">{data.clientPhone}</p>}
          </div>
          <div>
            <p className="font-semibold mb-1">Vendor name:</p>
            <p>{data.vendorName}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold mb-1">Contact Info:</p>
            <p className="text-xs">omnicassion@gmail.com</p>
            <p className="text-xs">+91-6284598500, +91 9988777462</p>
            <p className="text-xs">omnicassion.com</p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full mb-6 border-collapse border border-gray-300">
          <thead>
            <tr className="bg-black text-white">
              <th className="text-left px-3 py-2 text-sm font-semibold border-r border-gray-400">
                SERVICE
              </th>
              <th className="text-center px-3 py-2 text-sm font-semibold border-r border-gray-400 w-20">
                QTY
              </th>
              <th className="text-right px-3 py-2 text-sm font-semibold border-r border-gray-400 w-28">
                PRICE
              </th>
              <th className="text-right px-3 py-2 text-sm font-semibold w-28">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={index} className="border-b border-gray-300">
                <td className="px-3 py-3 text-xs border-r border-gray-300">{item.description}</td>
                <td className="px-3 py-3 text-center text-sm border-r border-gray-300">
                  {item.quantity}
                </td>
                <td className="px-3 py-3 text-right text-sm border-r border-gray-300">
                  {formatCurrency(item.rate)}
                </td>
                <td className="px-3 py-3 text-right text-sm font-medium">
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}

            {/* Empty rows for visual consistency (minimum 3 items) */}
            {data.items.length < 3 &&
              Array.from({ length: 3 - data.items.length }).map((_, i) => (
                <tr key={`empty-${i}`} className="border-b border-gray-300">
                  <td className="px-3 py-3 text-xs border-r border-gray-300">&nbsp;</td>
                  <td className="px-3 py-3 text-center text-sm border-r border-gray-300">&nbsp;</td>
                  <td className="px-3 py-3 text-right text-sm border-r border-gray-300">&nbsp;</td>
                  <td className="px-3 py-3 text-right text-sm">&nbsp;</td>
                </tr>
              ))}

            {/* Site Charges */}
            {data.siteCharges !== undefined && data.siteCharges > 0 && (
              <tr className="border-b border-gray-300">
                <td colSpan={2} className="px-3 py-2 text-sm border-r border-gray-300">
                  Site Charges
                </td>
                <td className="px-3 py-2 text-right text-sm border-r border-gray-300">
                  {formatCurrency(data.siteCharges)}
                </td>
                <td className="px-3 py-2 text-right text-sm font-medium">
                  {formatCurrency(data.siteCharges)}
                </td>
              </tr>
            )}

            {/* Subtotal */}
            <tr className="border-b border-gray-300 bg-gray-100">
              <td colSpan={3} className="px-3 py-2 text-right font-bold border-r border-gray-300">
                SUBTOTAL
              </td>
              <td className="px-3 py-2 text-right font-bold">{formatCurrency(data.subtotal)}</td>
            </tr>

            {/* Tax */}
            {data.taxAmount !== undefined && data.taxAmount !== null && data.taxAmount > 0 && (
              <tr className="border-b border-gray-300">
                <td colSpan={3} className="px-3 py-2 text-right font-semibold border-r border-gray-300">
                  TAX ({data.taxRate || 0}%)
                </td>
                <td className="px-3 py-2 text-right font-semibold">
                  {formatCurrency(data.taxAmount)}
                </td>
              </tr>
            )}

            {/* Discount */}
            {data.discount !== undefined && data.discount > 0 && (
              <tr className="border-b border-gray-300">
                <td colSpan={3} className="px-3 py-2 text-right font-semibold border-r border-gray-300">
                  DISCOUNT{' '}
                  {data.discountType === 'PERCENTAGE' ? `(${data.discount}%)` : ''}
                </td>
                <td className="px-3 py-2 text-right font-semibold text-green-600">
                  -{formatCurrency(
                    data.discountType === 'PERCENTAGE'
                      ? (data.subtotal * data.discount) / 100
                      : data.discount
                  )}
                </td>
              </tr>
            )}

            {/* Grand Total */}
            <tr className="bg-black text-white border-b border-gray-300">
              <td colSpan={3} className="px-3 py-3 text-right font-bold border-r border-gray-400">
                GRAND TOTAL
              </td>
              <td className="px-3 py-3 text-right font-bold">{formatCurrency(data.grandTotal)}</td>
            </tr>

            {/* Payment Info */}
            {data.tokenMoneyPaid !== undefined && (
              <tr className="border-b border-gray-300">
                <td colSpan={3} className="px-3 py-2 text-right border-r border-gray-300">
                  TOKEN MONEY PAID
                </td>
                <td className="px-3 py-2 text-right">{formatCurrency(data.tokenMoneyPaid)}</td>
              </tr>
            )}
            {data.secondInstallment !== undefined && (
              <tr className="border-b border-gray-300">
                <td colSpan={3} className="px-3 py-2 text-right border-r border-gray-300">
                  SECOND INSTALLMENT
                </td>
                <td className="px-3 py-2 text-right">{formatCurrency(data.secondInstallment)}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Notes Section */}
        {(data.notes || data.termsAndConditions) && (
          <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
            {data.notes && (
              <div className="mb-3">
                <p className="font-bold text-sm mb-1">Notes:</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.notes}</p>
              </div>
            )}
            {data.termsAndConditions && (
              <div>
                <p className="font-bold text-sm mb-1">Terms & Conditions:</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.termsAndConditions}</p>
              </div>
            )}
          </div>
        )}

        {/* Bank Details */}
        <div className="mb-8 mt-6 p-5 bg-gray-50 rounded">
          <p className="font-bold text-sm mb-3">Company Bank Detail:</p>
          <p className="text-sm mb-2">Bank Name: {data.bankName || 'HDFC BANK'}</p>
          <p className="text-sm mb-2">Account No: {data.accountNumber || '50100570331614'}</p>
          <p className="text-sm">Account Name: {data.accountName || 'ADITYA'}</p>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-black pt-4 text-center">
          <p className="text-xs mb-1">
            Visit our website <span className="font-semibold">www.omnicassion.com</span> to get
            access to our services.
          </p>
          <p className="text-lg font-bold">JUST SIT BACK AND ENJOY</p>
        </div>
      </div>
    )
  }
)

QuotationTemplate.displayName = 'QuotationTemplate'

export default QuotationTemplate
