'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowUp,
  Check,
  Loader2,
  Sparkles,
  TrendingUp,
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

import type {
  PlanDisplay,
  Subscription,
  UserSubscription,
  BillingCycle,
} from '@/lib/api/types/subscription.types'

// ============================================================================
// Types
// ============================================================================

interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentSubscription: Subscription | UserSubscription | null
  availablePlans: PlanDisplay[]
  onUpgrade: (planId: string, priceId: string) => Promise<void>
  isLoading?: boolean
  variant?: 'user' | 'vendor'
}

// ============================================================================
// Helpers
// ============================================================================

function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
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

export function UpgradeModal({
  open,
  onOpenChange,
  currentSubscription,
  availablePlans,
  onUpgrade,
  isLoading = false,
  variant = 'vendor',
}: UpgradeModalProps) {
  const router = useRouter()
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null)
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<BillingCycle>('MONTHLY')

  // Get current plan tier
  const currentTier = currentSubscription?.plan?.tier || 'FREE'
  const currentPlanName = currentSubscription?.plan?.name || 'Free'

  // Filter to only show higher tier plans (upgrades)
  const upgradePlans = availablePlans
    .filter((plan) => getTierOrder(plan.tier) > getTierOrder(currentTier))
    .sort((a, b) => getTierOrder(a.tier) - getTierOrder(b.tier))

  // Get selected plan details
  const selectedPlan = upgradePlans.find((p) => p.id === selectedPlanId)
  const selectedPrice = selectedPlan?.allPrices.find(
    (p) => p.billingCycle === selectedBillingCycle
  )

  // Calculate price difference/proration
  const currentPrice = currentSubscription?.price?.amount || 0
  const newPrice = selectedPrice?.amount || 0
  const priceDifference = newPrice - currentPrice

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId)
    const plan = upgradePlans.find((p) => p.id === planId)
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

  const handleUpgrade = async () => {
    if (!selectedPlanId || !selectedPriceId) {
      toast.error('Please select a plan to upgrade to')
      return
    }

    try {
      await onUpgrade(selectedPlanId, selectedPriceId)
      toast.success('Upgrade initiated', {
        description: 'You will be redirected to complete your payment.',
      })
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to initiate upgrade', {
        description: 'Please try again or contact support.',
      })
    }
  }

  const handleGoToPricing = () => {
    onOpenChange(false)
    router.push(variant === 'vendor' ? '/business/pricing' : '/pricing')
  }

  if (upgradePlans.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              No Upgrades Available
            </DialogTitle>
            <DialogDescription>
              You are already on the highest plan tier available.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Sparkles className="mx-auto h-12 w-12 text-primary mb-4" />
              <p className="text-sm text-muted-foreground">
                You have access to all premium features.
              </p>
            </div>
          </div>
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
            <ArrowUp className="h-5 w-5 text-success" />
            Upgrade Your Plan
          </DialogTitle>
          <DialogDescription>
            Choose a plan with more features to unlock additional capabilities.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Plan Summary */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="font-semibold">{currentPlanName}</p>
              </div>
              <Badge variant="secondary">{currentTier}</Badge>
            </div>
            {currentSubscription?.price && (
              <p className="mt-1 text-sm text-muted-foreground">
                {formatCurrency(currentSubscription.price.amount, currentSubscription.price.currency)}
                {getBillingCycleLabel(currentSubscription.price.billingCycle as BillingCycle)}
              </p>
            )}
          </div>

          {/* Billing Cycle Selection */}
          <div className="space-y-3">
            <Label>Billing Cycle</Label>
            <RadioGroup
              value={selectedBillingCycle}
              onValueChange={(value) => handleBillingCycleChange(value as BillingCycle)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="MONTHLY" id="monthly" />
                <Label htmlFor="monthly" className="font-normal cursor-pointer">
                  Monthly
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="YEARLY" id="yearly" />
                <Label htmlFor="yearly" className="font-normal cursor-pointer">
                  Yearly
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Save up to 20%
                  </Badge>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Available Plans */}
          <div className="space-y-3">
            <Label>Select New Plan</Label>
            <div className="grid gap-4">
              {upgradePlans.map((plan) => {
                const price = plan.allPrices.find(
                  (p) => p.billingCycle === selectedBillingCycle
                )
                const isSelected = selectedPlanId === plan.id

                return (
                  <div
                    key={plan.id}
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {plan.isPopular && (
                      <Badge className="absolute -top-2.5 right-4 bg-primary">
                        Most Popular
                      </Badge>
                    )}

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
                        {price ? (
                          <>
                            <p className="text-2xl font-bold">
                              {formatCurrency(price.amount, price.currency)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {getBillingCycleLabel(price.billingCycle)}
                            </p>
                            {price.savingsPercent && price.savingsPercent > 0 && (
                              <Badge variant="secondary" className="mt-1 text-xs">
                                Save {price.savingsPercent}%
                              </Badge>
                            )}
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
                            <Check className="h-4 w-4 text-success flex-shrink-0" />
                            <span className="text-muted-foreground">
                              {feature.name}
                            </span>
                          </div>
                        ))}
                    </div>

                    {isSelected && (
                      <div className="absolute top-4 right-4">
                        <div className="rounded-full bg-primary p-1">
                          <Check className="h-4 w-4 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Price Comparison */}
          {selectedPlan && selectedPrice && (
            <>
              <Separator />
              <div className="rounded-lg border bg-success/10 p-4">
                <h4 className="font-medium text-success mb-2">
                  Upgrade Summary
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {currentPlanName} to {selectedPlan.name}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(selectedPrice.amount, selectedPrice.currency)}
                      {getBillingCycleLabel(selectedPrice.billingCycle)}
                    </span>
                  </div>
                  {priceDifference > 0 && (
                    <div className="flex justify-between text-success">
                      <span>Price difference</span>
                      <span className="font-medium">
                        +{formatCurrency(priceDifference, selectedPrice.currency)}
                        {getBillingCycleLabel(selectedPrice.billingCycle)}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    * Proration will be calculated at checkout based on your remaining billing period.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="ghost" onClick={handleGoToPricing}>
            Compare All Plans
          </Button>
          <Button
            onClick={handleUpgrade}
            disabled={!selectedPlanId || !selectedPriceId || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ArrowUp className="mr-2 h-4 w-4" />
                Upgrade Now
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default UpgradeModal
