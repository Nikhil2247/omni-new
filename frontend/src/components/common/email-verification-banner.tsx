'use client'

import { useState } from 'react'
import { AlertCircle, X, Mail, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/hooks/use-auth'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import { apiClient } from '@/lib/api/client'

export function EmailVerificationBanner() {
  const { user } = useAuth()
  const [isVisible, setIsVisible] = useState(true)
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)

  // Don't show banner if:
  // 1. User is not logged in
  // 2. Email is already verified
  // 3. User logged in via Google (Google verifies emails)
  // 4. User dismissed the banner
  if (!user || user.emailVerified || !isVisible) {
    return null
  }

  const handleResendVerification = async () => {
    if (!user?.email) return

    setIsResending(true)
    setResendError(null)
    setResendSuccess(false)

    try {
      await apiClient.post(API_ENDPOINTS.AUTH.RESEND_VERIFICATION, {
        email: user.email,
      })
      setResendSuccess(true)

      // Hide success message after 5 seconds
      setTimeout(() => {
        setResendSuccess(false)
      }, 5000)
    } catch (error: any) {
      setResendError(
        error?.response?.data?.message || 'Failed to resend verification email'
      )
    } finally {
      setIsResending(false)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    // Store in localStorage to persist dismissal
    localStorage.setItem('email-verification-banner-dismissed', 'true')
  }

  if (resendSuccess) {
    return (
      <Alert className="border-leaf bg-leaf-light/40">
        <CheckCircle className="h-4 w-4 text-leaf-deep" />
        <AlertDescription className="ml-2 flex items-center justify-between">
          <span className="text-ink">
            Verification email sent! Please check your inbox.
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setResendSuccess(false)}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="border-gold bg-gold/15">
      <AlertCircle className="h-4 w-4 text-gold" />
      <AlertDescription className="ml-2 flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-bold text-ink">
            Please verify your email address
          </p>
          <p className="text-xs text-ink-soft mt-1">
            We sent a verification email to <strong>{user.email}</strong>.
            Please check your inbox and click the verification link to access all features.
          </p>
          {resendError && (
            <p className="text-xs text-rose mt-1">
              {resendError}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResendVerification}
            disabled={isResending}
            className="border-ink hover:bg-blue-wash"
          >
            <Mail className="h-3 w-3 mr-1" />
            {isResending ? 'Sending...' : 'Resend Email'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
