'use client'

import { useMemo } from 'react'
import { Infinity, AlertTriangle, CheckCircle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ============================================================================
// Feature Display Names
// ============================================================================

const FEATURE_DISPLAY_NAMES: Record<string, string> = {
  // Event features
  max_events: 'Events',
  max_guests_per_event: 'Guests per Event',
  event_photos: 'Event Photos',
  event_custom_branding: 'Custom Branding',

  // Usage features
  api_calls: 'API Calls',
  storage: 'Storage',
  team_members: 'Team Members',
  shared_events: 'Shared Events',

  // Vendor features
  listings: 'Listings',
  albums: 'Albums',
  leads: 'Leads',
  campaigns: 'Campaigns',
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the color class based on usage percentage
 */
function getUsageColor(percentage: number): {
  progressColor: string
  textColor: string
  status: 'low' | 'medium' | 'high' | 'critical'
} {
  if (percentage >= 100) {
    return {
      progressColor: 'bg-destructive',
      textColor: 'text-destructive',
      status: 'critical',
    }
  }
  if (percentage >= 80) {
    return {
      progressColor: 'bg-amber-500',
      textColor: 'text-amber-600',
      status: 'high',
    }
  }
  if (percentage >= 50) {
    return {
      progressColor: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      status: 'medium',
    }
  }
  return {
    progressColor: 'bg-green-500',
    textColor: 'text-green-600',
    status: 'low',
  }
}

/**
 * Format large numbers for display
 */
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}

// ============================================================================
// Usage Meter Component
// ============================================================================

interface UsageMeterProps {
  /**
   * Feature key for display name lookup
   */
  featureKey: string

  /**
   * Current usage count
   */
  used: number

  /**
   * Maximum limit
   */
  limit: number

  /**
   * Whether the feature has unlimited usage
   * @default false
   */
  isUnlimited?: boolean

  /**
   * Whether to show the label
   * @default true
   */
  showLabel?: boolean

  /**
   * Size variant
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * Custom label to override feature key lookup
   */
  label?: string

  /**
   * Whether to show the usage numbers
   * @default true
   */
  showNumbers?: boolean

  /**
   * Whether to show status indicator
   * @default false
   */
  showStatus?: boolean

  /**
   * Custom className for the container
   */
  className?: string
}

export function UsageMeter({
  featureKey,
  used,
  limit,
  isUnlimited = false,
  showLabel = true,
  size = 'md',
  label,
  showNumbers = true,
  showStatus = false,
  className,
}: UsageMeterProps) {
  // Calculate usage percentage (cap at 100 for display)
  const percentage = useMemo(() => {
    if (isUnlimited || limit === 0) return 0
    return Math.min((used / limit) * 100, 100)
  }, [used, limit, isUnlimited])

  // Get color based on usage
  const { progressColor, textColor, status } = getUsageColor(percentage)

  // Get display label
  const displayLabel = label || FEATURE_DISPLAY_NAMES[featureKey] || featureKey

  // Size-based classes
  const sizeClasses = {
    sm: {
      container: 'space-y-1',
      label: 'text-xs',
      progress: 'h-1.5',
      numbers: 'text-xs',
    },
    md: {
      container: 'space-y-1.5',
      label: 'text-sm',
      progress: 'h-2',
      numbers: 'text-sm',
    },
    lg: {
      container: 'space-y-2',
      label: 'text-base',
      progress: 'h-3',
      numbers: 'text-base',
    },
  }

  const classes = sizeClasses[size]

  return (
    <div className={cn(classes.container, className)}>
      {/* Header: Label and Numbers */}
      {(showLabel || showNumbers) && (
        <div className="flex items-center justify-between">
          {showLabel && (
            <span className={cn("font-medium", classes.label)}>
              {displayLabel}
            </span>
          )}
          {showNumbers && (
            <div className={cn("flex items-center gap-1.5", classes.numbers)}>
              {isUnlimited ? (
                <Badge variant="secondary" className="gap-1">
                  <Infinity className="h-3 w-3" />
                  Unlimited
                </Badge>
              ) : (
                <>
                  <span className={cn("font-medium", textColor)}>
                    {formatNumber(used)}
                  </span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-muted-foreground">
                    {formatNumber(limit)}
                  </span>
                  {showStatus && (
                    <StatusIndicator status={status} size={size} />
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Progress Bar */}
      {!isUnlimited && (
        <Progress
          value={percentage}
          className={classes.progress}
          indicatorClassName={progressColor}
        />
      )}

      {/* Unlimited indicator bar */}
      {isUnlimited && (
        <div className={cn(
          "relative w-full overflow-hidden rounded-full bg-primary/20",
          classes.progress
        )}>
          <div
            className="h-full w-full bg-gradient-to-r from-primary/60 via-primary to-primary/60 animate-pulse"
          />
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Status Indicator Component
// ============================================================================

interface StatusIndicatorProps {
  status: 'low' | 'medium' | 'high' | 'critical'
  size?: 'sm' | 'md' | 'lg'
}

function StatusIndicator({ status, size = 'md' }: StatusIndicatorProps) {
  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }[size]

  if (status === 'critical') {
    return (
      <AlertTriangle className={cn(iconSize, "text-destructive")} />
    )
  }

  if (status === 'high') {
    return (
      <AlertTriangle className={cn(iconSize, "text-amber-500")} />
    )
  }

  return (
    <CheckCircle className={cn(iconSize, "text-green-500")} />
  )
}

// ============================================================================
// Usage Summary Component
// ============================================================================

interface UsageSummaryItem {
  featureKey: string
  used: number
  limit: number
  isUnlimited?: boolean
}

interface UsageSummaryProps {
  /**
   * Array of usage items to display
   */
  items: UsageSummaryItem[]

  /**
   * Size variant for all meters
   * @default "sm"
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * Whether to show status indicators
   * @default true
   */
  showStatus?: boolean

  /**
   * Custom className for the container
   */
  className?: string
}

export function UsageSummary({
  items,
  size = 'sm',
  showStatus = true,
  className,
}: UsageSummaryProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item) => (
        <UsageMeter
          key={item.featureKey}
          featureKey={item.featureKey}
          used={item.used}
          limit={item.limit}
          isUnlimited={item.isUnlimited}
          size={size}
          showStatus={showStatus}
        />
      ))}
    </div>
  )
}

// ============================================================================
// Compact Usage Badge
// ============================================================================

interface UsageBadgeProps {
  /**
   * Feature key for display name lookup
   */
  featureKey: string

  /**
   * Current usage count
   */
  used: number

  /**
   * Maximum limit
   */
  limit: number

  /**
   * Whether the feature has unlimited usage
   * @default false
   */
  isUnlimited?: boolean

  /**
   * Custom className
   */
  className?: string
}

export function UsageBadge({
  featureKey,
  used,
  limit,
  isUnlimited = false,
  className,
}: UsageBadgeProps) {
  // Calculate usage percentage
  const percentage = useMemo(() => {
    if (isUnlimited || limit === 0) return 0
    return (used / limit) * 100
  }, [used, limit, isUnlimited])

  // Get variant based on usage
  const variant = useMemo(() => {
    if (isUnlimited) return 'secondary'
    if (percentage >= 100) return 'destructive'
    if (percentage >= 80) return 'outline'
    return 'secondary'
  }, [percentage, isUnlimited])

  const displayLabel = FEATURE_DISPLAY_NAMES[featureKey] || featureKey

  if (isUnlimited) {
    return (
      <Badge variant={variant} className={cn("gap-1", className)}>
        {displayLabel}: <Infinity className="h-3 w-3" />
      </Badge>
    )
  }

  return (
    <Badge variant={variant} className={className}>
      {displayLabel}: {formatNumber(used)}/{formatNumber(limit)}
    </Badge>
  )
}
