'use client'

import { useState } from 'react'
import {
  Calendar,
  Loader2,
  Pause,
  Play,
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

import type {
  Subscription,
  UserSubscription,
} from '@/lib/api/types/subscription.types'

// ============================================================================
// Types
// ============================================================================

interface PauseSubscriptionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subscription: Subscription | UserSubscription | null
  onPause: (durationMonths: number) => Promise<void>
  isLoading?: boolean
}

interface ResumeSubscriptionButtonProps {
  subscription: Subscription | UserSubscription | null
  onResume: () => Promise<void>
  isLoading?: boolean
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

// ============================================================================
// Constants
// ============================================================================

const PAUSE_DURATIONS = [
  { value: 1, label: '1 Month', description: 'Short break' },
  { value: 2, label: '2 Months', description: 'Medium break' },
  { value: 3, label: '3 Months', description: 'Extended break (maximum)' },
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

function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

// ============================================================================
// Pause Modal Component
// ============================================================================

export function PauseSubscriptionModal({
  open,
  onOpenChange,
  subscription,
  onPause,
  isLoading = false,
}: PauseSubscriptionModalProps) {
  const [selectedDuration, setSelectedDuration] = useState<number>(1)

  const currentPeriodEnd = subscription?.currentPeriodEnd
  const planName = subscription?.plan?.name || 'your subscription'

  // Calculate resume date
  const resumeDate = currentPeriodEnd
    ? addMonths(new Date(currentPeriodEnd), selectedDuration)
    : addMonths(new Date(), selectedDuration)

  const handlePause = async () => {
    try {
      await onPause(selectedDuration)
      toast.success('Subscription paused', {
        description: `Your subscription will resume on ${formatDate(resumeDate.toISOString())}.`,
      })
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to pause subscription', {
        description: 'Please try again or contact support.',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pause className="h-5 w-5 text-warning" />
            Pause Subscription
          </DialogTitle>
          <DialogDescription>
            Take a break from your subscription without losing your account or data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Info Alert */}
          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertTitle>What happens when you pause?</AlertTitle>
            <AlertDescription className="space-y-2 mt-2">
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Your subscription billing will be paused</li>
                <li>You will lose access to premium features during the pause</li>
                <li>Your data and settings will be preserved</li>
                <li>Subscription will automatically resume after the pause period</li>
              </ul>
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
          </div>

          <Separator />

          {/* Duration Selection */}
          <div className="space-y-4">
            <Label>How long would you like to pause?</Label>
            <RadioGroup
              value={selectedDuration.toString()}
              onValueChange={(value) => setSelectedDuration(parseInt(value, 10))}
              className="space-y-3"
            >
              {PAUSE_DURATIONS.map((duration) => (
                <div
                  key={duration.value}
                  className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                    selectedDuration === duration.value
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedDuration(duration.value)}
                >
                  <RadioGroupItem value={duration.value.toString()} id={`duration-${duration.value}`} />
                  <div className="flex-1">
                    <Label htmlFor={`duration-${duration.value}`} className="font-medium cursor-pointer">
                      {duration.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{duration.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Resume Date Info */}
          <div className="rounded-lg border bg-warning/10 p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-warning" />
              <span className="font-medium text-warning">
                Expected Resume Date
              </span>
            </div>
            <p className="text-warning mt-1">
              {formatDate(resumeDate.toISOString())}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handlePause}
            disabled={isLoading}
            className="bg-warning hover:bg-warning text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Pausing...
              </>
            ) : (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pause for {selectedDuration} {selectedDuration === 1 ? 'Month' : 'Months'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Resume Button Component
// ============================================================================

export function ResumeSubscriptionButton({
  subscription,
  onResume,
  isLoading = false,
  variant = 'default',
  size = 'default',
  className,
}: ResumeSubscriptionButtonProps) {
  const [isResuming, setIsResuming] = useState(false)

  // Only show if subscription is paused
  if (subscription?.status !== 'PAUSED') {
    return null
  }

  const handleResume = async () => {
    setIsResuming(true)
    try {
      await onResume()
      toast.success('Subscription resumed', {
        description: 'Your subscription is now active again.',
      })
    } catch (error) {
      toast.error('Failed to resume subscription', {
        description: 'Please try again or contact support.',
      })
    } finally {
      setIsResuming(false)
    }
  }

  const loading = isLoading || isResuming

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleResume}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Resuming...
        </>
      ) : (
        <>
          <Play className="mr-2 h-4 w-4" />
          Resume Subscription
        </>
      )}
    </Button>
  )
}

// ============================================================================
// Combined Pause/Resume Inline Component
// ============================================================================

interface PauseResumeControlProps {
  subscription: Subscription | UserSubscription | null
  onPause: (durationMonths: number) => Promise<void>
  onResume: () => Promise<void>
  isPausing?: boolean
  isResuming?: boolean
}

export function PauseResumeControl({
  subscription,
  onPause,
  onResume,
  isPausing = false,
  isResuming = false,
}: PauseResumeControlProps) {
  const [pauseModalOpen, setPauseModalOpen] = useState(false)

  const status = subscription?.status

  // Don't show for cancelled or expired subscriptions
  if (status === 'CANCELLED' || status === 'EXPIRED') {
    return null
  }

  // Show resume button for paused subscriptions
  if (status === 'PAUSED') {
    return (
      <ResumeSubscriptionButton
        subscription={subscription}
        onResume={onResume}
        isLoading={isResuming}
        variant="outline"
      />
    )
  }

  // Show pause button for active subscriptions
  if (status === 'ACTIVE') {
    return (
      <>
        <Button
          variant="outline"
          onClick={() => setPauseModalOpen(true)}
          disabled={isPausing}
        >
          {isPausing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Pause className="mr-2 h-4 w-4" />
              Pause Subscription
            </>
          )}
        </Button>
        <PauseSubscriptionModal
          open={pauseModalOpen}
          onOpenChange={setPauseModalOpen}
          subscription={subscription}
          onPause={onPause}
          isLoading={isPausing}
        />
      </>
    )
  }

  return null
}

export default PauseSubscriptionModal
