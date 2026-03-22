'use client'

import { useState } from 'react'
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  Loader2,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useClaimStatus, useVerifyClaim, useResendVerification, useInitiateClaim } from '@/hooks/queries/use-vendor-claim'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { ClaimVerificationMethod } from '@/lib/api/types/vendor-claim.types'

interface ClaimStatusBannerProps {
  vendorProfileId: string
  className?: string
}

export function ClaimStatusBanner({
  vendorProfileId,
  className,
}: ClaimStatusBannerProps) {
  const { isAuthenticated, hasHydrated } = useAuthStore()
  const [verificationCode, setVerificationCode] = useState('')
  const [showVerifyInput, setShowVerifyInput] = useState(false)

  const { data: claimStatusData, isLoading } = useClaimStatus(vendorProfileId, {
    enabled: hasHydrated && isAuthenticated,
  })

  const verifyClaim = useVerifyClaim()
  const resendVerification = useResendVerification()
  const initiateClaim = useInitiateClaim()

  // Don't render if not authenticated or still loading
  if (!hasHydrated || !isAuthenticated || isLoading) {
    return null
  }

  // Don't render if no claim data or no active claim
  if (!claimStatusData?.hasClaim || !claimStatusData.claim) {
    return null
  }

  const { claim } = claimStatusData
  const status = claim.status

  const handleVerifyCode = () => {
    if (!verificationCode.trim() || !claim) return
    verifyClaim.mutate(
      {
        claimId: claim.id,
        verificationCode: verificationCode.trim(),
        vendorProfileId,
      },
      {
        onSuccess: () => {
          setVerificationCode('')
          setShowVerifyInput(false)
        },
      }
    )
  }

  const handleResendCode = () => {
    if (!claim) return
    resendVerification.mutate(claim.id)
  }

  const handleRetryClaim = () => {
    if (!claim) return
    initiateClaim.mutate({
      vendorProfileId,
      verificationMethod: claim.verificationMethod as ClaimVerificationMethod,
    })
  }

  const renderBannerContent = () => {
    switch (status) {
      case 'PENDING':
        return (
          <BannerWrapper variant="warning" className={className}>
            <Clock className="h-4 w-4" />
            <AlertTitle>Claim Pending</AlertTitle>
            <AlertDescription>
              Your claim is pending. Waiting for verification.
            </AlertDescription>
          </BannerWrapper>
        )

      case 'VERIFICATION_SENT':
        return (
          <BannerWrapper variant="info" className={className}>
            <Mail className="h-4 w-4" />
            <AlertTitle>Verification Required</AlertTitle>
            <AlertDescription>
              <p>Verification code sent! Check your email/phone.</p>
              {showVerifyInput ? (
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="Enter verification code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="h-8 max-w-[200px]"
                    disabled={verifyClaim.isPending}
                  />
                  <Button
                    size="sm"
                    onClick={handleVerifyCode}
                    disabled={verifyClaim.isPending || !verificationCode.trim()}
                  >
                    {verifyClaim.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Verify'
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowVerifyInput(false)}
                    disabled={verifyClaim.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowVerifyInput(true)}
                  >
                    Enter Code
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleResendCode}
                    disabled={resendVerification.isPending}
                  >
                    {resendVerification.isPending ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : null}
                    Resend Code
                  </Button>
                </div>
              )}
            </AlertDescription>
          </BannerWrapper>
        )

      case 'VERIFIED':
        return (
          <BannerWrapper variant="default" className={className}>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Claim Verified</AlertTitle>
            <AlertDescription>
              Claim verified! Awaiting admin approval.
            </AlertDescription>
          </BannerWrapper>
        )

      case 'APPROVED':
        return (
          <BannerWrapper variant="success" className={className}>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Business Claimed</AlertTitle>
            <AlertDescription>
              You own this business!
            </AlertDescription>
          </BannerWrapper>
        )

      case 'REJECTED':
        return (
          <BannerWrapper variant="destructive" className={className}>
            <XCircle className="h-4 w-4" />
            <AlertTitle>Claim Rejected</AlertTitle>
            <AlertDescription>
              <p>
                Claim rejected{claim.reviewNotes ? `: ${claim.reviewNotes}` : '.'}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={handleRetryClaim}
                disabled={initiateClaim.isPending}
              >
                {initiateClaim.isPending ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : null}
                Submit New Claim
              </Button>
            </AlertDescription>
          </BannerWrapper>
        )

      case 'EXPIRED':
        return (
          <BannerWrapper variant="secondary" className={className}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Claim Expired</AlertTitle>
            <AlertDescription>
              <p>Claim expired. You can submit a new claim.</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={handleRetryClaim}
                disabled={initiateClaim.isPending}
              >
                {initiateClaim.isPending ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : null}
                Submit New Claim
              </Button>
            </AlertDescription>
          </BannerWrapper>
        )

      default:
        return null
    }
  }

  return renderBannerContent()
}

// ============================================================================
// Banner Wrapper Component
// ============================================================================

type BannerVariant = 'default' | 'destructive' | 'success' | 'warning' | 'info' | 'secondary'

interface BannerWrapperProps {
  variant: BannerVariant
  className?: string
  children: React.ReactNode
}

function BannerWrapper({ variant, className, children }: BannerWrapperProps) {
  const variantStyles: Record<BannerVariant, string> = {
    default: '',
    destructive: '',
    success: 'border-green-500/50 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 [&>svg]:text-green-600 dark:[&>svg]:text-green-400',
    warning: 'border-yellow-500/50 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-400',
    info: 'border-blue-500/50 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 [&>svg]:text-blue-600 dark:[&>svg]:text-blue-400',
    secondary: 'border-muted bg-muted/50 text-muted-foreground',
  }

  // Map custom variants to Alert's built-in variants where applicable
  const alertVariant = variant === 'destructive' ? 'destructive' : 'default'

  return (
    <Alert
      variant={alertVariant}
      className={cn(variantStyles[variant], className)}
    >
      {children}
    </Alert>
  )
}
