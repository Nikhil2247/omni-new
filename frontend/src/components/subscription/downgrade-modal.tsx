'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  ArrowDown,
  Calendar,
  Check,
  Loader2,
  X,
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

import type {
  PlanDisplay,
  Subscription,
  UserSubscription,
  BillingCycle,
} from '@/lib/api/types/subscription.types'

// ============================================================================
// Types
// ============================================================================

interface DowngradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentSubscription: Subscription | UserSubscription | null
  availablePlans: PlanDisplay[]
  onDowngrade: (planId: string, priceId: string, reason?: string) => Promise<void>
  isLoading?: boolean
  variant?: 'user' | 'vendor'
}

// ============================================================================
// Constants
// ============================================================================

const DOWNGRADE_REASONS = [
  { value: 'too_expensive', label: 'Too expensive for my needs' },
  { value: 'not_using_features', label: 'Not using all the features' },
  { value: 'temporary', label: 'Temporary - will upgrade again later' },
  { value: 'found_alternative', label: 'Found an alternative solution' },
  { value: 'business_change', label: 'Business needs changed' },
  { value: 'other', label: 'Other reason' },
]

// ============================================================================
// Helpers
// ============================================================================

function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getBillingCycleLabel(cycle: BillingCycle): string {
  const labels: Record<BillingCycle, string> = {
    MONTHLY: '/month',
    QUARTERLY: '/quarter',
    YEARLY: '/year',
    LIFETIME: ' (one-time)',
  }
  return labels[cycle] || cycle.toLowerCase()
}

function getTierOrder(tier: string): number {
  const order: Record<string, number> = {
    FREE: 0,
    STARTER: 1,
    BASIC: 1,
    PROFESSIONAL: 2,
    PREMIUM: 2,
    ENTERPRISE: 3,
  }
  return order[tier] ?? 0
}

// ============================================================================
// Component
// ============================================================================

export function DowngradeModal({
  open,
  onOpenChange,
  currentSubscription,
  availablePlans,
  onDowngrade,
  isLoading = false,
  variant = 'vendor',
}: DowngradeModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null)
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<BillingCycle>('MONTHLY')
  const [downgradeReason, setDowngradeReason] = useState<string>('')
  const [additionalFeedback, setAdditionalFeedback] = useState<string>('')

  // Get current plan tier
  const currentTier = currentSubscription?.plan?.tier || 'FREE'
  const currentPlanName = currentSubscription?.plan?.name || 'Free'
  const currentPeriodEnd = currentSubscription?.currentPeriodEnd

  // Filter to only show lower tier plans (downgrades)
  const downgradePlans = availablePlans
    .filter((plan) => getTierOrder(plan.tier) < getTierOrder(currentTier))
    .sort((a, b) => getTierOrder(b.tier) - getTierOrder(a.tier))

  // Get selected plan details
  const selectedPlan = downgradePlans.find((p) => p.id === selectedPlanId)
  const selectedPrice = selectedPlan?.allPrices.find(
    (p) => p.billingCycle === selectedBillingCycle
  )

  // Features that will be lost
  const currentFeatures = currentSubscription?.plan?.features || []
  const selectedFeatures = selectedPlan?.features || []
  const lostFeatures = currentFeatures.filter(
    (cf) => !selectedFeatures.some((sf) => sf.key === cf.featureKey && sf.isHighlighted)
  )

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId)
    const plan = downgradePlans.find((p) => p.id === planId)
    const price = plan?.allPrices.find((p) => p.billingCycle === selectedBillingCycle)
    setSelectedPriceId(price?.id || null)
  }

  const handleBillingCycleChange = (cycle: BillingCycle) => {
    setSelectedBillingCycle(cycle)
    if (selectedPlan) {
      const price = selectedPlan.allPrices.find((p) => p.billingCycle === cycle)
      setSelectedPriceId(price?.id || null)
    }
  }

  const handleDowngrade = async () => {
    if (!selectedPlanId || !selectedPriceId) {
      toast.error('Please select a plan to downgrade to')
      return
    }

    const reason = additionalFeedback
      ? `${downgradeReason}: ${additionalFeedback}`
      : downgradeReason

    try {
      await onDowngrade(selectedPlanId, selectedPriceId, reason)
      toast.success('Downgrade scheduled', {
        description: `Your plan will change to ${selectedPlan?.name} at the end of your current billing period.`,
      })
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to schedule downgrade', {
        description: 'Please try again or contact support.',
      })
    }
  }

  if (downgradePlans.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDown className="h-5 w-5" />
              No Downgrade Options
            </DialogTitle>
            <DialogDescription>
              You are already on the lowest plan tier or free plan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowDown className="h-5 w-5 text-amber-500" />
            Downgrade Your Plan
          </DialogTitle>
          <DialogDescription>
            Select a lower tier plan. The change will take effect at the end of your current billing period.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Warning Alert */}
          <Alert variant="destructive" className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-700 dark:text-amber-400">
              Feature Loss Warning
            </AlertTitle>
            <AlertDescription className="text-amber-600 dark:text-amber-300">
              Downgrading will reduce your access to certain features. Please review the changes carefully.
            </AlertDescription>
          </Alert>

          {/* Current Plan Summary */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="font-semibold">{currentPlanName}</p>
              </div>
              <Badge variant="secondary">{currentTier}</Badge>
            </div>
            {currentPeriodEnd && (
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Active until {formatDate(currentPeriodEnd)}
                </span>
              </div>
            )}
          </div>

          {/* Billing Cycle Selection */}
          <div className="space-y-3">
            <Label>New Plan Billing Cycle</Label>
            <RadioGroup
              value={selectedBillingCycle}
              onValueChange={(value) => handleBillingCycleChange(value as BillingCycle)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="MONTHLY" id="downgrade-monthly" />
                <Label htmlFor="downgrade-monthly" className="font-normal cursor-pointer">
                  Monthly
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="YEARLY" id="downgrade-yearly" />
                <Label htmlFor="downgrade-yearly" className="font-normal cursor-pointer">
                  Yearly
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Available Plans */}
          <div className="space-y-3">
            <Label>Select New Plan</Label>
            <div className="grid gap-4">
              {downgradePlans.map((plan) => {
                const price = plan.allPrices.find(
                  (p) => p.billingCycle === selectedBillingCycle
                )
                const isSelected = selectedPlanId === plan.id
                const isFree = plan.tier === 'FREE'

                return (
                  <div
                    key={plan.id}
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20'
                        : 'border-border hover:border-amber-500/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{plan.name}</h4>
                          <Badge variant="outline">{plan.tier}</Badge>
                        </div>
                        {plan.description && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {plan.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {isFree ? (
                          <p className="text-2xl font-bold text-green-600">Free</p>
                        ) : price ? (
                          <>
                            <p className="text-2xl font-bold">
                              {formatCurrency(price.amount, price.currency)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {getBillingCycleLabel(price.billingCycle)}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Price not available
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Key Features */}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {plan.features
                        .filter((f) => f.isHighlighted)
                        .slice(0, 4)
                        .map((feature) => (
                          <div
                            key={feature.key}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-muted-foreground">
                              {feature.name}
                            </span>
                          </div>
                        ))}
                    </div>

                    {isSelected && (
                      <div className="absolute top-4 right-4">
                        <div className="rounded-full bg-amber-500 p-1">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Features Lost */}
          {selectedPlan && lostFeatures.length > 0 && (
            <>
              <Separator />
              <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20 p-4">
                <h4 className="font-medium text-red-700 dark:text-red-300 mb-2 flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Features You Will Lose
                </h4>
                <div className="grid gap-2">
                  {lostFeatures.slice(0, 6).map((feature) => (
                    <div
                      key={feature.featureKey}
                      className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
                    >
                      <X className="h-4 w-4 flex-shrink-0" />
                      <span>{feature.featureName}</span>
                    </div>
                  ))}
                  {lostFeatures.length > 6 && (
                    <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                      And {lostFeatures.length - 6} more features...
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Downgrade Reason */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="downgrade-reason">Why are you downgrading? (Optional)</Label>
              <Select value={downgradeReason} onValueChange={setDowngradeReason}>
                <SelectTrigger id="downgrade-reason">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {DOWNGRADE_REASONS.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {downgradeReason === 'other' && (
              <div className="space-y-2">
                <Label htmlFor="additional-feedback">Additional feedback</Label>
                <Textarea
                  id="additional-feedback"
                  placeholder="Tell us more about your decision..."
                  value={additionalFeedback}
                  onChange={(e) => setAdditionalFeedback(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>

          {/* Effective Date Notice */}
          {currentPeriodEnd && (
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertTitle>Effective Date</AlertTitle>
              <AlertDescription>
                Your downgrade will take effect on{' '}
                <span className="font-semibold">{formatDate(currentPeriodEnd)}</span>.
                You will continue to have access to all current features until then.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep Current Plan
          </Button>
          <Button
            variant="destructive"
            onClick={handleDowngrade}
            disabled={!selectedPlanId || !selectedPriceId || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ArrowDown className="mr-2 h-4 w-4" />
                Confirm Downgrade
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DowngradeModal
