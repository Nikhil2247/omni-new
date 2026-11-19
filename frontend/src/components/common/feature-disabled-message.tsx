'use client'

import Link from 'next/link'
import { Notice, NOTICE_ICONS, SketchButton } from '@/components/sketch'

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
    <div className="container mx-auto max-w-lg px-4 py-16">
      <Notice
        icon={NOTICE_ICONS.lock}
        alt
        title={title}
        actions={
          <>
            {showBackButton && (
              <SketchButton asChild variant="line">
                <Link href={backUrl}>{backText}</Link>
              </SketchButton>
            )}
            {showContactSupport && (
              <SketchButton asChild>
                <Link href="/support">Contact Support</Link>
              </SketchButton>
            )}
          </>
        }
      >
        <p>{description || defaultDescription}</p>
        <p className="text-sm">Please check back later or contact support for help.</p>
      </Notice>
    </div>
  )
}
