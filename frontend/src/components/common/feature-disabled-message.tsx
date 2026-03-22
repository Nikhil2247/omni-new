'use client'

import { AlertCircle, Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface FeatureDisabledMessageProps {
  /**
   * The name of the feature that is disabled
   */
  feature: string
  /**
   * Custom title message
   * @default "Feature Unavailable"
   */
  title?: string
  /**
   * Custom description message
   * @default "This feature is currently unavailable."
   */
  description?: string
  /**
   * Whether to show the contact support button
   * @default true
   */
  showContactSupport?: boolean
  /**
   * Whether to show the back button
   * @default true
   */
  showBackButton?: boolean
  /**
   * Custom back URL
   * @default "/"
   */
  backUrl?: string
  /**
   * Custom back button text
   * @default "Go Back"
   */
  backText?: string
}

/**
 * A friendly message component displayed when a feature is disabled via feature flags.
 * Can be used as a fallback in FeatureFlagGate components.
 *
 * @example
 * <FeatureFlagGate
 *   feature="marketing.campaigns"
 *   fallback={<FeatureDisabledMessage feature="Campaigns & Ads" />}
 * >
 *   <CampaignsPage />
 * </FeatureFlagGate>
 */
export function FeatureDisabledMessage({
  feature,
  title = 'Feature Unavailable',
  description,
  showContactSupport = true,
  showBackButton = true,
  backUrl = '/',
  backText = 'Go Back',
}: FeatureDisabledMessageProps) {
  const defaultDescription = `The ${feature} feature is currently unavailable. This may be due to scheduled maintenance or configuration changes.`

  return (
    <div className="container py-16 max-w-lg mx-auto">
      <Card className="border-dashed">
        <CardContent className="pt-10 pb-10 text-center">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-6 flex items-center justify-center">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>

          <h2 className="text-2xl font-semibold mb-2">{title}</h2>

          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            {description || defaultDescription}
          </p>

          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-6">
            <AlertCircle className="h-4 w-4" />
            <span>Please check back later or contact support for assistance.</span>
          </div>

          <div className="flex items-center justify-center gap-3">
            {showBackButton && (
              <Link href={backUrl}>
                <Button variant="outline">{backText}</Button>
              </Link>
            )}
            {showContactSupport && (
              <Link href="/support">
                <Button variant="default">Contact Support</Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
