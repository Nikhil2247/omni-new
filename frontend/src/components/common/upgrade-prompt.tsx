'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Lock, Zap, CreditCard, AlertTriangle, Crown, Sparkles, ArrowRight, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { UserPlanTier, PlanTier } from '@/lib/api/types/subscription.types'
import { cn } from '@/lib/utils'

// ============================================================================
// Feature Descriptions (for display purposes)
// ============================================================================

const FEATURE_DESCRIPTIONS: Record<string, { name: string; description: string }> = {
  // Event features
  max_events: {
    name: 'Events',
    description: 'Create and manage more events',
  },
  max_guests_per_event: {
    name: 'Guest Capacity',
    description: 'Invite more guests to your events',
  },
  event_photos: {
    name: 'Event Photos',
    description: 'Upload photos to your events',
  },
  event_custom_branding: {
    name: 'Custom Branding',
    description: 'Add your own branding to events',
  },

  // Vendor Lead features
  leads_page: {
    name: 'Lead Management',
    description: 'Access and manage inquiries from event planners',
  },
  max_leads: {
    name: 'Leads',
    description: 'Receive inquiries from event planners',
  },
  lead_export: {
    name: 'Lead Export',
    description: 'Export your leads to CSV or other formats',
  },
  lead_crm_integration: {
    name: 'CRM Integration',
    description: 'Connect leads to your CRM system',
  },

  // Vendor Task features
  tasks_page: {
    name: 'Task Management',
    description: 'View and manage tasks assigned by event organizers',
  },
  assigned_tasks: {
    name: 'Assigned Tasks',
    description: 'Receive and track tasks from event planners',
  },
  task_proof_upload: {
    name: 'Task Proof Upload',
    description: 'Submit proof of completed work',
  },

  // Premium features
  priority_support: {
    name: 'Priority Support',
    description: 'Get faster responses from our support team',
  },
  analytics_dashboard: {
    name: 'Analytics Dashboard',
    description: 'Access detailed analytics and insights',
  },
  export_data: {
    name: 'Export Data',
    description: 'Export your data in various formats',
  },
  api_access: {
    name: 'API Access',
    description: 'Integrate with our API for automation',
  },

  // Collaboration
  team_members: {
    name: 'Team Members',
    description: 'Add team members to collaborate',
  },
  shared_events: {
    name: 'Shared Events',
    description: 'Share events across your organization',
  },
}

// ============================================================================
// Tier Display Information
// ============================================================================

const USER_TIER_INFO: Record<UserPlanTier, { name: string; color: string; icon: typeof Crown }> = {
  FREE: {
    name: 'Free',
    color: 'text-muted-foreground',
    icon: Lock,
  },
  BASIC: {
    name: 'Basic',
    color: 'text-blue-600',
    icon: Zap,
  },
  PREMIUM: {
    name: 'Premium',
    color: 'text-amber-600',
    icon: Crown,
  },
}

const VENDOR_TIER_INFO: Record<PlanTier, { name: string; color: string; icon: typeof Crown }> = {
  FREE: {
    name: 'Free',
    color: 'text-muted-foreground',
    icon: Lock,
  },
  STARTER: {
    name: 'Starter',
    color: 'text-green-600',
    icon: Zap,
  },
  PROFESSIONAL: {
    name: 'Professional',
    color: 'text-blue-600',
    icon: Sparkles,
  },
  ENTERPRISE: {
    name: 'Enterprise',
    color: 'text-purple-600',
    icon: Crown,
  },
}

// ============================================================================
// Upgrade Prompt Component
// ============================================================================

interface UpgradePromptProps {
  /**
   * Title for the upgrade prompt
   * @default "Upgrade Required"
   */
  title?: string

  /**
   * Description explaining why upgrade is needed
   */
  description?: string

  /**
   * Feature key that triggered the upgrade prompt
   * Used to display feature-specific messaging
   */
  featureKey?: string

  /**
   * User's current subscription tier
   */
  currentTier?: UserPlanTier

  /**
   * Required tier to access the feature
   */
  requiredTier?: UserPlanTier

  /**
   * Visual variant of the prompt
   * @default "inline"
   */
  variant?: 'inline' | 'modal' | 'banner'

  /**
   * Callback when user clicks upgrade
   */
  onUpgrade?: () => void

  /**
   * For modal variant - controls visibility
   */
  open?: boolean

  /**
   * For modal variant - callback when modal is closed
   */
  onOpenChange?: (open: boolean) => void

  /**
   * Custom className for the container
   */
  className?: string
}

export function UpgradePrompt({
  title,
  description,
  featureKey,
  currentTier = 'FREE',
  requiredTier = 'PREMIUM',
  variant = 'inline',
  onUpgrade,
  open,
  onOpenChange,
  className,
}: UpgradePromptProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  // Get feature info if available
  const featureInfo = featureKey ? FEATURE_DESCRIPTIONS[featureKey] : null

  // Get tier info
  const currentTierInfo = USER_TIER_INFO[currentTier]
  const requiredTierInfo = USER_TIER_INFO[requiredTier]

  // Generate default title and description
  const displayTitle = title || (featureInfo ? `Unlock ${featureInfo.name}` : 'Upgrade Required')
  const displayDescription = description || (
    featureInfo
      ? `${featureInfo.description}. Upgrade to ${requiredTierInfo.name} to access this feature.`
      : `This feature requires a ${requiredTierInfo.name} subscription. Upgrade now to unlock it.`
  )

  // Handle upgrade click
  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade()
    }
  }

  // For modal variant, use controlled or internal state
  const isOpen = open !== undefined ? open : internalOpen
  const handleOpenChange = onOpenChange || setInternalOpen

  // Render based on variant
  if (variant === 'modal') {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full bg-primary/10",
                requiredTierInfo.color
              )}>
                <requiredTierInfo.icon className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle>{displayTitle}</DialogTitle>
                <DialogDescription>{displayDescription}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={currentTierInfo.color}>
                  <currentTierInfo.icon className="mr-1 h-3 w-3" />
                  {currentTierInfo.name}
                </Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge className={cn("bg-primary", requiredTierInfo.color)}>
                  <requiredTierInfo.icon className="mr-1 h-3 w-3" />
                  {requiredTierInfo.name}
                </Badge>
              </div>
            </div>

            {featureInfo && (
              <div className="mt-4 rounded-lg bg-muted/50 p-4">
                <h4 className="text-sm font-medium">What you will get:</h4>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-primary" />
                    {featureInfo.description}
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-primary" />
                    All {currentTierInfo.name} features included
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-primary" />
                    Priority support
                  </li>
                </ul>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Maybe Later
            </Button>
            <Button onClick={handleUpgrade} asChild>
              <Link href="/pricing">
                <CreditCard className="mr-2 h-4 w-4" />
                View Plans
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  if (variant === 'banner') {
    return (
      <Alert className={cn("relative", className)}>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="flex items-center gap-2">
          {displayTitle}
          <Badge variant="outline" className={requiredTierInfo.color}>
            <requiredTierInfo.icon className="mr-1 h-3 w-3" />
            {requiredTierInfo.name}
          </Badge>
        </AlertTitle>
        <AlertDescription className="mt-2 flex items-center justify-between">
          <span>{displayDescription}</span>
          <Button size="sm" onClick={handleUpgrade} asChild className="ml-4 shrink-0">
            <Link href="/pricing">
              Upgrade
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Default: inline variant
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-lg">{displayTitle}</CardTitle>
        <CardDescription>{displayDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Badge variant="outline" className={currentTierInfo.color}>
            <currentTierInfo.icon className="mr-1 h-3 w-3" />
            Current: {currentTierInfo.name}
          </Badge>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <Badge className={cn("bg-primary/90", requiredTierInfo.color)}>
            <requiredTierInfo.icon className="mr-1 h-3 w-3" />
            Requires: {requiredTierInfo.name}
          </Badge>
        </div>

        {featureInfo && (
          <div className="rounded-lg bg-muted/50 p-3 text-center text-sm text-muted-foreground">
            {featureInfo.description}
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-center">
        <Button onClick={handleUpgrade} asChild>
          <Link href="/pricing">
            <CreditCard className="mr-2 h-4 w-4" />
            View Pricing Plans
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

// ============================================================================
// Vendor Upgrade Prompt (for business dashboard)
// ============================================================================

interface VendorUpgradePromptProps extends Omit<UpgradePromptProps, 'currentTier' | 'requiredTier'> {
  currentTier?: PlanTier
  requiredTier?: PlanTier
}

export function VendorUpgradePrompt({
  title,
  description,
  featureKey,
  currentTier = 'FREE',
  requiredTier = 'PROFESSIONAL',
  variant = 'inline',
  onUpgrade,
  open,
  onOpenChange,
  className,
}: VendorUpgradePromptProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  // Get feature info if available
  const featureInfo = featureKey ? FEATURE_DESCRIPTIONS[featureKey] : null

  // Get tier info
  const currentTierInfo = VENDOR_TIER_INFO[currentTier]
  const requiredTierInfo = VENDOR_TIER_INFO[requiredTier]

  // Generate default title and description
  const displayTitle = title || (featureInfo ? `Unlock ${featureInfo.name}` : 'Upgrade Required')
  const displayDescription = description || (
    featureInfo
      ? `${featureInfo.description}. Upgrade to ${requiredTierInfo.name} to access this feature.`
      : `This feature requires a ${requiredTierInfo.name} subscription. Upgrade now to unlock it.`
  )

  // Handle upgrade click
  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade()
    }
  }

  // For modal variant, use controlled or internal state
  const isOpen = open !== undefined ? open : internalOpen
  const handleOpenChange = onOpenChange || setInternalOpen

  // Render based on variant
  if (variant === 'modal') {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full bg-primary/10",
                requiredTierInfo.color
              )}>
                <requiredTierInfo.icon className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle>{displayTitle}</DialogTitle>
                <DialogDescription>{displayDescription}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={currentTierInfo.color}>
                  <currentTierInfo.icon className="mr-1 h-3 w-3" />
                  {currentTierInfo.name}
                </Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge className={cn("bg-primary", requiredTierInfo.color)}>
                  <requiredTierInfo.icon className="mr-1 h-3 w-3" />
                  {requiredTierInfo.name}
                </Badge>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Maybe Later
            </Button>
            <Button onClick={handleUpgrade} asChild>
              <Link href="/vendor/pricing">
                <CreditCard className="mr-2 h-4 w-4" />
                View Plans
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  if (variant === 'banner') {
    return (
      <Alert className={cn("relative", className)}>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="flex items-center gap-2">
          {displayTitle}
          <Badge variant="outline" className={requiredTierInfo.color}>
            <requiredTierInfo.icon className="mr-1 h-3 w-3" />
            {requiredTierInfo.name}
          </Badge>
        </AlertTitle>
        <AlertDescription className="mt-2 flex items-center justify-between">
          <span>{displayDescription}</span>
          <Button size="sm" onClick={handleUpgrade} asChild className="ml-4 shrink-0">
            <Link href="/vendor/pricing">
              Upgrade
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Default: inline variant
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-lg">{displayTitle}</CardTitle>
        <CardDescription>{displayDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Badge variant="outline" className={currentTierInfo.color}>
            <currentTierInfo.icon className="mr-1 h-3 w-3" />
            Current: {currentTierInfo.name}
          </Badge>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <Badge className={cn("bg-primary/90", requiredTierInfo.color)}>
            <requiredTierInfo.icon className="mr-1 h-3 w-3" />
            Requires: {requiredTierInfo.name}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="justify-center">
        <Button onClick={handleUpgrade} asChild>
          <Link href="/vendor/pricing">
            <CreditCard className="mr-2 h-4 w-4" />
            View Pricing Plans
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
