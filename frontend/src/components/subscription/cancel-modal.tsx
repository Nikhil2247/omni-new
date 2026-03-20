'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  Calendar,
  Gift,
  Loader2,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

import type {
  Subscription,
  UserSubscription,
} from '@/lib/api/types/subscription.types'

// ============================================================================
// Types
// ============================================================================

interface CancelModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subscription: Subscription | UserSubscription | null
  onCancel: (reason?: string, feedback?: string, immediate?: boolean) => Promise<void>
  isLoading?: boolean
  showRetentionOffer?: boolean
  retentionOffer?: {
    discount: number
    durationMonths: number
    message: string
  }
  onAcceptRetention?: () => Promise<void>
}

// ============================================================================
// Constants
// ============================================================================

const CANCEL_REASONS = [
  { value: 'too_expensive', label: 'Too expensive' },
  { value: 'not_using', label: 'Not using the service enough' },
  { value: 'missing_features', label: 'Missing features I need' },
  { value: 'found_alternative', label: 'Found a better alternative' },
  { value: 'technical_issues', label: 'Technical issues or bugs' },
  { value: 'poor_support', label: 'Poor customer support' },
  { value: 'temporary', label: 'Just need a break (temporary)' },
  { value: 'project_complete', label: 'Project/event is complete' },
  { value: 'other', label: 'Other reason' },
]

// ============================================================================
// Helpers
// ============================================================================

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// ============================================================================
// Component
// ============================================================================

export function CancelModal({
  open,
  onOpenChange,
  subscription,
  onCancel,
  isLoading = false,
  showRetentionOffer = false,
  retentionOffer,
  onAcceptRetention,
}: CancelModalProps) {
  const [step, setStep] = useState<'reason' | 'retention' | 'confirm'>('reason')
  const [cancelReason, setCancelReason] = useState<string>('')
  const [additionalFeedback, setAdditionalFeedback] = useState<string>('')
  const [cancelImmediately, setCancelImmediately] = useState(false)
  const [confirmChecked, setConfirmChecked] = useState(false)

  const currentPeriodEnd = subscription?.currentPeriodEnd
  const planName = subscription?.plan?.name || 'your subscription'

  const resetState = () => {
    setStep('reason')
    setCancelReason('')
    setAdditionalFeedback('')
    setCancelImmediately(false)
    setConfirmChecked(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetState()
    }
    onOpenChange(newOpen)
  }

  const handleContinue = () => {
    if (!cancelReason) {
      toast.error('Please select a reason for cancelling')
      return
    }

    if (showRetentionOffer && retentionOffer && step === 'reason') {
      setStep('retention')
    } else {
      setStep('confirm')
    }
  }

  const handleAcceptRetention = async () => {
    if (onAcceptRetention) {
      try {
        await onAcceptRetention()
        toast.success('Offer accepted!', {
          description: 'Your discount has been applied to your subscription.',
        })
        handleOpenChange(false)
      } catch (error) {
        toast.error('Failed to apply offer', {
          description: 'Please try again or contact support.',
        })
      }
    }
  }

  const handleCancel = async () => {
    if (!confirmChecked) {
      toast.error('Please confirm that you understand the cancellation')
      return
    }

    try {
      await onCancel(cancelReason, additionalFeedback, cancelImmediately)
      toast.success('Subscription cancelled', {
        description: cancelImmediately
          ? 'Your subscription has been cancelled immediately.'
          : `Your subscription will remain active until ${formatDate(currentPeriodEnd!)}.`,
      })
      handleOpenChange(false)
    } catch (error) {
      toast.error('Failed to cancel subscription', {
        description: 'Please try again or contact support.',
      })
    }
  }

  const renderReasonStep = () => (
    <div className="space-y-6 py-4">
      {/* Warning Alert */}
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Are you sure?</AlertTitle>
        <AlertDescription>
          Cancelling your subscription will remove access to premium features.
        </AlertDescription>
      </Alert>

      {/* Current Plan Info */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current Plan</p>
            <p className="font-semibold">{planName}</p>
          </div>
          <Badge variant="secondary">{subscription?.plan?.tier}</Badge>
        </div>
        {currentPeriodEnd && (
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Active until {formatDate(currentPeriodEnd)}</span>
          </div>
        )}
      </div>

      <Separator />

      {/* Cancel Reason */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cancel-reason">
            Why are you cancelling? <span className="text-destructive">*</span>
          </Label>
          <Select value={cancelReason} onValueChange={setCancelReason}>
            <SelectTrigger id="cancel-reason">
              <SelectValue placeholder="Select a reason" />
            </SelectTrigger>
            <SelectContent>
              {CANCEL_REASONS.map((reason) => (
                <SelectItem key={reason.value} value={reason.value}>
                  {reason.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cancel-feedback">
            Additional feedback (optional)
          </Label>
          <Textarea
            id="cancel-feedback"
            placeholder="Help us improve by sharing more details..."
            value={additionalFeedback}
            onChange={(e) => setAdditionalFeedback(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      <DialogFooter className="flex-col sm:flex-row gap-2">
        <Button variant="outline" onClick={() => handleOpenChange(false)}>
          Keep Subscription
        </Button>
        <Button
          variant="destructive"
          onClick={handleContinue}
          disabled={!cancelReason}
        >
          Continue
        </Button>
      </DialogFooter>
    </div>
  )

  const renderRetentionStep = () => (
    <div className="space-y-6 py-4">
      {/* Retention Offer */}
      <div className="rounded-lg border-2 border-primary bg-primary/5 p-6 text-center">
        <Gift className="mx-auto h-12 w-12 text-primary mb-4" />
        <h3 className="text-xl font-semibold mb-2">
          Wait! Here&apos;s a special offer just for you
        </h3>
        <p className="text-muted-foreground mb-4">
          {retentionOffer?.message || `Get ${retentionOffer?.discount}% off for the next ${retentionOffer?.durationMonths} months`}
        </p>
        <div className="inline-block rounded-full bg-primary/10 px-4 py-2">
          <span className="text-2xl font-bold text-primary">
            {retentionOffer?.discount}% OFF
          </span>
          <span className="text-sm text-muted-foreground ml-2">
            for {retentionOffer?.durationMonths} months
          </span>
        </div>
      </div>

      <DialogFooter className="flex-col sm:flex-row gap-2">
        <Button variant="outline" onClick={() => setStep('confirm')}>
          No thanks, continue cancelling
        </Button>
        <Button onClick={handleAcceptRetention} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Applying...
            </>
          ) : (
            <>
              <Gift className="mr-2 h-4 w-4" />
              Accept Offer
            </>
          )}
        </Button>
      </DialogFooter>
    </div>
  )

  const renderConfirmStep = () => (
    <div className="space-y-6 py-4">
      {/* Final Warning */}
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Final Confirmation</AlertTitle>
        <AlertDescription>
          This action will cancel your subscription. Please confirm your choice.
        </AlertDescription>
      </Alert>

      {/* Cancellation Type */}
      <div className="space-y-4">
        <Label>When should the cancellation take effect?</Label>
        <RadioGroup
          value={cancelImmediately ? 'immediate' : 'end_of_period'}
          onValueChange={(value) => setCancelImmediately(value === 'immediate')}
        >
          <div className="flex items-start space-x-3 rounded-lg border p-4">
            <RadioGroupItem value="end_of_period" id="end_of_period" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="end_of_period" className="font-medium cursor-pointer">
                At end of billing period (Recommended)
              </Label>
              <p className="text-sm text-muted-foreground">
                You&apos;ll continue to have access until{' '}
                <span className="font-medium">
                  {currentPeriodEnd ? formatDate(currentPeriodEnd) : 'the end of your period'}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3 rounded-lg border border-destructive/50 p-4">
            <RadioGroupItem value="immediate" id="immediate" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="immediate" className="font-medium cursor-pointer">
                Cancel immediately
              </Label>
              <p className="text-sm text-muted-foreground">
                Your access will end immediately. No refunds will be issued.
              </p>
            </div>
          </div>
        </RadioGroup>
      </div>

      <Separator />

      {/* What You'll Lose */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <h4 className="font-medium mb-3">What you&apos;ll lose access to:</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {subscription?.plan?.features
            ?.filter((f) => f.isHighlighted)
            .slice(0, 5)
            .map((feature) => (
              <li key={feature.featureKey || feature.id} className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                {feature.featureName}
              </li>
            ))}
        </ul>
      </div>

      {/* Confirmation Checkbox */}
      <div className="flex items-start space-x-3 rounded-lg border p-4">
        <Checkbox
          id="confirm-cancel"
          checked={confirmChecked}
          onCheckedChange={(checked) => setConfirmChecked(checked === true)}
        />
        <Label htmlFor="confirm-cancel" className="text-sm cursor-pointer">
          I understand that my subscription will be cancelled and I will lose access to premium features
          {!cancelImmediately && currentPeriodEnd && (
            <> after {formatDate(currentPeriodEnd)}</>
          )}
          .
        </Label>
      </div>

      <DialogFooter className="flex-col sm:flex-row gap-2">
        <Button variant="outline" onClick={() => setStep('reason')}>
          Go Back
        </Button>
        <Button variant="ghost" onClick={() => handleOpenChange(false)}>
          Keep Subscription
        </Button>
        <Button
          variant="destructive"
          onClick={handleCancel}
          disabled={!confirmChecked || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cancelling...
            </>
          ) : (
            <>
              <XCircle className="mr-2 h-4 w-4" />
              Cancel Subscription
            </>
          )}
        </Button>
      </DialogFooter>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            Cancel Subscription
          </DialogTitle>
          <DialogDescription>
            {step === 'reason' && 'Tell us why you want to cancel.'}
            {step === 'retention' && 'We have a special offer for you!'}
            {step === 'confirm' && 'Please confirm your cancellation.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'reason' && renderReasonStep()}
        {step === 'retention' && renderRetentionStep()}
        {step === 'confirm' && renderConfirmStep()}
      </DialogContent>
    </Dialog>
  )
}

export default CancelModal
