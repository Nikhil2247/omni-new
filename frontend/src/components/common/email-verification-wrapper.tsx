'use client'

import { EmailVerificationBanner } from './email-verification-banner'

/**
 * Wrapper component for email verification banner
 * Handles client-side rendering and localStorage check
 */
export function EmailVerificationWrapper() {
  // Check if user previously dismissed the banner
  if (typeof window !== 'undefined') {
    const dismissed = localStorage.getItem('email-verification-banner-dismissed')
    if (dismissed === 'true') {
      return null
    }
  }

  return (
    <div className="w-full">
      <EmailVerificationBanner />
    </div>
  )
}
