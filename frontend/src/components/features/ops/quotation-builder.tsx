'use client'

import { useState, useEffect, useMemo } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Plus,
  Trash2,
  Send,
  Save,
  FileText,
  Calculator,
  Loader2,
  CheckCircle2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog, useConfirmAction } from '@/components/dash'
import {
  useCreateQuotation,
  useUpdateQuotation,
  useSendQuotation,
  type QuotationLineItem,
  type QuotationResponse,
} from '@/hooks/queries/use-quotations'

const CURRENCIES = [
  { value: 'INR', label: '₹ INR', symbol: '₹' },
  { value: 'USD', label: '₹ USD', symbol: '₹' },
  { value: 'EUR', label: '€ EUR', symbol: '€' },
  { value: 'GBP', label: '£ GBP', symbol: '£' },
]

const lineItemSchema = z.object({
  description: z.string().min(1, 'Description required'),
  quantity: z.number().min(1, 'Min 1'),
  rate: z.number().min(0, 'Min 0'),
  amount: z.number().min(0),
})

const quotationSchema = z.object({
  currency: z.string().min(1, 'Currency required'),
  items: z.array(lineItemSchema).min(1, 'Add at least one item'),
  taxRate: z.number().min(0).max(100).optional(),
  discount: z.number().min(0).optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  validUntil: z.string().optional(),
})

type QuotationFormValues = z.infer<typeof quotationSchema>

interface QuotationBuilderProps {
  vendorAgreementId: string
  existingQuotation?: QuotationResponse | null
  onSuccess?: () => void
  onCancel?: () => void
}

export function QuotationBuilder({
  vendorAgreementId,
  existingQuotation,
  onSuccess,
  onCancel,
}: QuotationBuilderProps) {
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [sendMessage, setSendMessage] = useState('')
  const removeItemAsk = useConfirmAction<number>()

  const createQuotation = useCreateQuotation()
  const updateQuotation = useUpdateQuotation(existingQuotation?.id || '')
  const sendQuotation = useSendQuotation(existingQuotation?.id || '')

  const isEditing = !!existingQuotation
  const isDraft = !existingQuotation || existingQuotation.status === 'DRAFT'

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      currency: existingQuotation?.currency || 'INR',
      items: existingQuotation?.items?.length
        ? existingQuotation.items
        : [{ description: '', quantity: 1, rate: 0, amount: 0 }],
      taxRate: existingQuotation?.taxRate || undefined,
      discount: existingQuotation?.discount || undefined,
      discountType: (existingQuotation?.discountType as 'PERCENTAGE' | 'FIXED') || undefined,
      notes: existingQuotation?.notes || '',
      termsAndConditions: existingQuotation?.termsAndConditions || '',
      validUntil: existingQuotation?.validUntil
        ? new Date(existingQuotation.validUntil).toISOString().split('T')[0]
        : '',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  })

  const watchItems = form.watch('items')
  const watchTaxRate = form.watch('taxRate')
  const watchDiscount = form.watch('discount')
  const watchDiscountType = form.watch('discountType')
  const watchCurrency = form.watch('currency')

  const currencySymbol = useMemo(() => {
    return CURRENCIES.find((c) => c.value === watchCurrency)?.symbol || '₹'
  }, [watchCurrency])

  // Calculate totals
  const calculations = useMemo(() => {
    const subtotal = watchItems.reduce((sum, item) => sum + (item.amount || 0), 0)

    let discountAmount = 0
    if (watchDiscount && watchDiscount > 0) {
      if (watchDiscountType === 'PERCENTAGE') {
        discountAmount = (subtotal * watchDiscount) / 100
      } else {
        discountAmount = watchDiscount
      }
    }

    const afterDiscount = subtotal - discountAmount

    let taxAmount = 0
    if (watchTaxRate && watchTaxRate > 0) {
      taxAmount = (afterDiscount * watchTaxRate) / 100
    }

    const totalAmount = afterDiscount + taxAmount

    return {
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
    }
  }, [watchItems, watchTaxRate, watchDiscount, watchDiscountType])

  // Update line item amount when quantity or rate changes
  const updateItemAmount = (index: number) => {
    const items = form.getValues('items')
    const item = items[index]
    if (item) {
      const amount = item.quantity * item.rate
      form.setValue(`items.${index}.amount`, amount)
    }
  }

  const handleSave = async (values: QuotationFormValues) => {
    const payload = {
      vendorAgreementId,
      currency: values.currency,
      items: values.items,
      subtotal: calculations.subtotal,
      taxRate: values.taxRate,
      taxAmount: calculations.taxAmount || undefined,
      discount: values.discount,
      discountType: values.discountType,
      totalAmount: calculations.totalAmount,
      notes: values.notes,
      termsAndConditions: values.termsAndConditions,
      validUntil: values.validUntil || undefined,
    }

    try {
      if (isEditing) {
        await updateQuotation.mutateAsync(payload)
      } else {
        await createQuotation.mutateAsync(payload)
      }
      onSuccess?.()
    } catch (error) {
      console.error('Failed to save quotation:', error)
    }
  }

  const handleSend = async () => {
    try {
      await sendQuotation.mutateAsync(sendMessage || undefined)
      setShowSendDialog(false)
      onSuccess?.()
    } catch (error) {
      console.error('Failed to send quotation:', error)
    }
  }

  const isSaving = createQuotation.isPending || updateQuotation.isPending
  const isSending = sendQuotation.isPending

  return (
    <div className="space-y-3">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSave)} className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold">
                {isEditing ? 'Edit Quotation' : 'Create Quotation'}
              </h2>
              {existingQuotation && (
                <Badge variant="outline">{existingQuotation.quotationNumber}</Badge>
              )}
              {existingQuotation && (
                <Badge
                  variant={existingQuotation.status === 'DRAFT' ? 'outline' : 'default'}
                >
                  {existingQuotation.status}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              {isDraft && (
                <>
                  <Button type="submit" variant="outline" disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Draft
                  </Button>
                  {isEditing && (
                    <Button
                      type="button"
                      onClick={() => setShowSendDialog(true)}
                      disabled={isSaving}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Send to Vendor
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Currency Selection */}
          <Card>
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm">Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="grid gap-3 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!isDraft}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CURRENCIES.map((currency) => (
                            <SelectItem key={currency.value} value={currency.value}>
                              {currency.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="validUntil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid Until</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          disabled={!isDraft}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="taxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Rate (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          placeholder="e.g., 18"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) =>
                            field.onChange(e.target.value ? Number(e.target.value) : undefined)
                          }
                          disabled={!isDraft}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Line Items</CardTitle>
                {isDraft && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({ description: '', quantity: 1, rate: 0, amount: 0 })
                    }
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add Item
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="space-y-3">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground pb-2 border-b">
                  <div className="col-span-5">Description</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-right">Rate</div>
                  <div className="col-span-2 text-right">Amount</div>
                  <div className="col-span-1"></div>
                </div>

                {/* Line Items */}
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-5">
                      <FormField
                        control={form.control}
                        name={`items.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="Service description..."
                                {...field}
                                disabled={!isDraft}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                className="text-center"
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => {
                                  field.onChange(Number(e.target.value) || 1)
                                  setTimeout(() => updateItemAmount(index), 0)
                                }}
                                disabled={!isDraft}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.rate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                className="text-right"
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => {
                                  field.onChange(Number(e.target.value) || 0)
                                  setTimeout(() => updateItemAmount(index), 0)
                                }}
                                disabled={!isDraft}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.amount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                className="text-right bg-muted"
                                {...field}
                                value={field.value || 0}
                                readOnly
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      {isDraft && fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItemAsk.ask(index)}
                          title="Remove item"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Discount & Summary */}
          <div className="grid gap-3 lg:grid-cols-2">
            {/* Discount */}
            <Card>
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-sm">Discount</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="discountType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select
                          value={field.value || ''}
                          onValueChange={field.onChange}
                          disabled={!isDraft}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                            <SelectItem value="FIXED">Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="discount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {watchDiscountType === 'PERCENTAGE' ? 'Discount (%)' : 'Amount'}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? Number(e.target.value) : undefined
                              )
                            }
                            disabled={!isDraft}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader className="p-3 pb-2">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  <CardTitle className="text-sm">Summary</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>
                      {currencySymbol}
                      {calculations.subtotal.toLocaleString()}
                    </span>
                  </div>
                  {calculations.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>
                        -{currencySymbol}
                        {calculations.discountAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {calculations.taxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Tax ({watchTaxRate}%)
                      </span>
                      <span>
                        {currencySymbol}
                        {calculations.taxAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="border-t pt-1.5 mt-1.5">
                    <div className="flex justify-between font-bold text-base">
                      <span>Total</span>
                      <span className="text-primary">
                        {currencySymbol}
                        {calculations.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes & Terms */}
          <Card>
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="grid gap-3 lg:grid-cols-2">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={4}
                          placeholder="Additional notes for the vendor..."
                          {...field}
                          disabled={!isDraft}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="termsAndConditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Terms & Conditions</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={4}
                          placeholder="Payment terms, cancellation policy..."
                          {...field}
                          disabled={!isDraft}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>

      <ConfirmDialog
        {...removeItemAsk.dialogProps}
        title="Remove line item?"
        description="This line item will be removed from the quotation."
        confirmLabel="Remove"
        onConfirm={() => {
          if (removeItemAsk.target !== null) remove(removeItemAsk.target)
        }}
      />

      {/* Send Confirmation Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Quotation</DialogTitle>
            <DialogDescription>
              Send this quotation to the vendor for approval. They will be notified
              and can accept or reject it.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="sendMessage">Message (optional)</Label>
            <Textarea
              id="sendMessage"
              className="mt-2"
              rows={3}
              placeholder="Add a message to include with the quotation..."
              value={sendMessage}
              onChange={(e) => setSendMessage(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={isSending}>
              {isSending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send Quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
