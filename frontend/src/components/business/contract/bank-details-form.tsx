'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, Building2, CreditCard, Smartphone, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useUpdateBankDetails } from '@/hooks/queries/use-business'
import { toast } from 'sonner'
import type { VendorContract, UpdateBankDetailsRequest } from '@/lib/api/types/business.types'

interface BankDetailsFormProps {
  contract: VendorContract | null
  isLoading?: boolean
  onComplete?: () => void
}

export function BankDetailsForm({ contract, isLoading, onComplete }: BankDetailsFormProps) {
  const { mutate: updateBankDetails, isPending: isUpdating } = useUpdateBankDetails()

  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'upi'>('bank')
  const [formData, setFormData] = useState<UpdateBankDetailsRequest>({
    bankAccountName: '',
    bankAccountNumber: '',
    bankIfscCode: '',
    bankName: '',
    upiId: '',
  })

  // Initialize form with existing data
  useEffect(() => {
    if (contract) {
      setFormData({
        bankAccountName: contract.bankAccountName || '',
        bankAccountNumber: contract.bankAccountNumber || '',
        bankIfscCode: contract.bankIfscCode || '',
        bankName: contract.bankName || '',
        upiId: contract.upiId || '',
      })

      // Set payment method based on existing data
      if (contract.upiId && !contract.bankAccountNumber) {
        setPaymentMethod('upi')
      }
    }
  }, [contract])

  const handleChange = (field: keyof UpdateBankDetailsRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateBank = () => {
    if (!formData.bankAccountName?.trim()) return 'Account holder name is required'
    if (!formData.bankAccountNumber?.trim()) return 'Account number is required'
    if (!formData.bankIfscCode?.trim()) return 'IFSC code is required'
    if (!formData.bankName?.trim()) return 'Bank name is required'
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.bankIfscCode.toUpperCase())) {
      return 'Invalid IFSC code format'
    }
    return null
  }

  const validateUpi = () => {
    if (!formData.upiId?.trim()) return 'UPI ID is required'
    if (!/^[\w.-]+@[\w]+$/.test(formData.upiId)) {
      return 'Invalid UPI ID format'
    }
    return null
  }

  const handleSubmit = () => {
    const error = paymentMethod === 'bank' ? validateBank() : validateUpi()
    if (error) {
      toast.error(error)
      return
    }

    const payload: UpdateBankDetailsRequest = paymentMethod === 'bank'
      ? {
          bankAccountName: formData.bankAccountName,
          bankAccountNumber: formData.bankAccountNumber,
          bankIfscCode: formData.bankIfscCode?.toUpperCase(),
          bankName: formData.bankName,
        }
      : {
          upiId: formData.upiId,
        }

    updateBankDetails(payload, {
      onSuccess: () => {
        toast.success('Payment details updated successfully')
        onComplete?.()
      },
      onError: (error: any) => {
        toast.error(error?.message || 'Failed to update payment details')
      },
    })
  }

  const hasBankDetails = !!(
    contract?.bankAccountNumber ||
    contract?.upiId
  )

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!contract) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No Contract Found</h3>
          <p className="text-sm text-muted-foreground">
            Payment details can be added once your contract is created.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <CardTitle>Payment Details</CardTitle>
          </div>
          {hasBankDetails && (
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <CheckCircle2 className="h-4 w-4" />
              Configured
            </div>
          )}
        </div>
        <CardDescription>
          Add your bank account or UPI details to receive payouts.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'bank' | 'upi')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bank" className="gap-2">
              <Building2 className="h-4 w-4" />
              Bank Account
            </TabsTrigger>
            <TabsTrigger value="upi" className="gap-2">
              <Smartphone className="h-4 w-4" />
              UPI
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bank" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="bankAccountName">Account Holder Name *</Label>
              <Input
                id="bankAccountName"
                placeholder="Enter name as per bank account"
                value={formData.bankAccountName || ''}
                onChange={(e) => handleChange('bankAccountName', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankAccountNumber">Account Number *</Label>
              <Input
                id="bankAccountNumber"
                placeholder="Enter bank account number"
                value={formData.bankAccountNumber || ''}
                onChange={(e) => handleChange('bankAccountNumber', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankIfscCode">IFSC Code *</Label>
                <Input
                  id="bankIfscCode"
                  placeholder="e.g., HDFC0001234"
                  value={formData.bankIfscCode || ''}
                  onChange={(e) => handleChange('bankIfscCode', e.target.value.toUpperCase())}
                  maxLength={11}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name *</Label>
                <Input
                  id="bankName"
                  placeholder="e.g., HDFC Bank"
                  value={formData.bankName || ''}
                  onChange={(e) => handleChange('bankName', e.target.value)}
                />
              </div>
            </div>

            {contract.bankAccountNumber && (
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground mb-1">Current Account</p>
                <p className="text-sm font-medium">
                  {contract.bankName} - ****{contract.bankAccountNumber.slice(-4)}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="upi" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="upiId">UPI ID *</Label>
              <Input
                id="upiId"
                placeholder="e.g., yourname@upi"
                value={formData.upiId || ''}
                onChange={(e) => handleChange('upiId', e.target.value.toLowerCase())}
              />
              <p className="text-xs text-muted-foreground">
                Enter your UPI ID linked to your bank account (e.g., name@oksbi, name@paytm)
              </p>
            </div>

            {contract.upiId && (
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground mb-1">Current UPI ID</p>
                <p className="text-sm font-medium">{contract.upiId}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p className="text-xs">
            Ensure your payment details are accurate. Incorrect details may delay your payouts.
          </p>
        </div>
      </CardContent>

      <CardFooter>
        <Button onClick={handleSubmit} disabled={isUpdating} className="w-full">
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Payment Details'
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
