'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, FileSignature, CheckCircle2, AlertCircle } from 'lucide-react'
import { useSignContract } from '@/hooks/queries/use-business'
import { toast } from 'sonner'
import type { VendorContract } from '@/lib/api/types/business.types'

interface ContractSigningDialogProps {
  contract: VendorContract
  trigger?: React.ReactNode
  onComplete?: () => void
}

export function ContractSigningDialog({
  contract,
  trigger,
  onComplete,
}: ContractSigningDialogProps) {
  const [open, setOpen] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedCommission, setAcceptedCommission] = useState(false)
  const { mutate: signContract, isPending: isSigning } = useSignContract()

  const canSign = acceptedTerms && acceptedCommission && !contract.signedByVendor

  const handleSign = () => {
    if (!canSign) return

    signContract(undefined, {
      onSuccess: () => {
        toast.success('Contract signed successfully!')
        setOpen(false)
        onComplete?.()
      },
      onError: (error: any) => {
        toast.error(error?.message || 'Failed to sign contract')
      },
    })
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setAcceptedTerms(false)
      setAcceptedCommission(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button disabled={contract.signedByVendor}>
            <FileSignature className="mr-2 h-4 w-4" />
            {contract.signedByVendor ? 'Already Signed' : 'Sign Contract'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            Sign Vendor Contract
          </DialogTitle>
          <DialogDescription>
            Please review the contract terms carefully before signing.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-6">
            {/* Contract Summary */}
            <div className="space-y-4">
              <h4 className="font-semibold">Contract Summary</h4>

              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted">
                <div>
                  <p className="text-xs text-muted-foreground">Commission Rate</p>
                  <p className="text-lg font-semibold">{contract.commissionRate}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payout Frequency</p>
                  <p className="text-lg font-semibold capitalize">
                    {contract.payoutFrequency.toLowerCase().replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Hold Period</p>
                  <p className="text-lg font-semibold">{contract.payoutHoldDays} days</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Min. Payout</p>
                  <p className="text-lg font-semibold">₹{contract.minPayoutAmount}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Terms */}
            <div className="space-y-4">
              <h4 className="font-semibold">Key Terms</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                  The platform will deduct a commission of {contract.commissionRate}% from each
                  completed booking.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                  Payouts will be processed {contract.payoutFrequency.toLowerCase().replace('_', ' ')}{' '}
                  after the hold period of {contract.payoutHoldDays} days.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                  Minimum payout amount is ₹{contract.minPayoutAmount}. Smaller amounts will be
                  carried forward.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                  You must maintain accurate bank details for receiving payouts.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                  The contract remains valid until terminated by either party with proper notice.
                </li>
              </ul>
            </div>

            <Separator />

            {/* Acceptance Checkboxes */}
            <div className="space-y-4">
              <h4 className="font-semibold">Acknowledgment</h4>

              <div className="flex items-start space-x-3 p-4 rounded-lg border">
                <Checkbox
                  id="accept-terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(!!checked)}
                />
                <Label htmlFor="accept-terms" className="text-sm cursor-pointer leading-relaxed">
                  I have read and understood the contract terms. I agree to abide by the platform&apos;s
                  Terms of Service and Vendor Guidelines.
                </Label>
              </div>

              <div className="flex items-start space-x-3 p-4 rounded-lg border">
                <Checkbox
                  id="accept-commission"
                  checked={acceptedCommission}
                  onCheckedChange={(checked) => setAcceptedCommission(!!checked)}
                />
                <Label htmlFor="accept-commission" className="text-sm cursor-pointer leading-relaxed">
                  I agree to the commission rate of {contract.commissionRate}% on all bookings made
                  through the platform.
                </Label>
              </div>
            </div>

            {!canSign && !contract.signedByVendor && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please accept both terms above to sign the contract.
                </AlertDescription>
              </Alert>
            )}

            {contract.signedByVendor && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  You have already signed this contract.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSign}
            disabled={!canSign || isSigning}
          >
            {isSigning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing...
              </>
            ) : (
              <>
                <FileSignature className="mr-2 h-4 w-4" />
                Sign Contract
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
