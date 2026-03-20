'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertCircle,
  ArrowRight,
  Loader2,
  ShieldAlert,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import {
  useBusinessProfile,
  useBusinessKyc,
  useBusinessContract,
  useConsentStatus,
} from '@/hooks/queries/use-business'

interface OnboardingGuardProps {
  children: ReactNode
  requireComplete?: boolean
  requireKycApproved?: boolean
  requireContractSigned?: boolean
}

export function OnboardingGuard({
  children,
  requireComplete = false,
  requireKycApproved = true,
  requireContractSigned = true,
}: OnboardingGuardProps) {
  const router = useRouter()
  const pathname = usePathname()

  const { data: profile, isLoading: profileLoading } = useBusinessProfile()
  const { data: kyc, isLoading: kycLoading } = useBusinessKyc()
  const { data: contract, isLoading: contractLoading } = useBusinessContract()
  const { data: consentStatus, isLoading: consentLoading } = useConsentStatus()

  const isLoading = profileLoading || kycLoading || contractLoading || consentLoading

  // Skip guard for onboarding page itself
  const isOnboardingPage = pathname?.includes('/onboarding')
  if (isOnboardingPage) {
    return <>{children}</>
  }

  // Compute onboarding status
  const hasProfile = !!profile?.id
  const hasCompleteProfile = hasProfile && !!profile?.businessName && !!profile?.description && !!profile?.categoryId
  const hasSubmittedKyc = !!kyc && ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(kyc.status)
  const isKycApproved = kyc?.status === 'APPROVED'
  const isKycPending = kyc?.status === 'SUBMITTED' || kyc?.status === 'UNDER_REVIEW'
  const isKycRejected = kyc?.status === 'REJECTED'
  const hasRequiredConsents = consentStatus?.required?.hasAll ?? false
  const hasContract = contract?.hasContract ?? false
  const hasSignedContract = contract?.contract?.signedByVendor ?? false
  const hasBankDetails = !!(contract?.contract?.bankAccountNumber || contract?.contract?.upiId)

  // Calculate progress
  let completedSteps = 0
  const totalSteps = 5
  if (hasCompleteProfile) completedSteps++
  if (isKycApproved) completedSteps++
  if (hasRequiredConsents) completedSteps++
  if (hasSignedContract) completedSteps++
  if (hasBankDetails) completedSteps++
  const progress = Math.round((completedSteps / totalSteps) * 100)

  // Determine what's blocking
  const getBlockingReason = () => {
    if (!hasCompleteProfile) return { reason: 'profile', message: 'Complete your business profile' }
    if (!hasSubmittedKyc) return { reason: 'kyc', message: 'Submit KYC documents for verification' }
    if (isKycPending) return { reason: 'kyc-pending', message: 'KYC verification is in progress' }
    if (isKycRejected) return { reason: 'kyc-rejected', message: 'KYC verification was rejected' }
    if (requireKycApproved && !isKycApproved) return { reason: 'kyc', message: 'KYC verification required' }
    if (!hasRequiredConsents) return { reason: 'consents', message: 'Accept required terms and conditions' }
    if (requireContractSigned && !hasSignedContract) return { reason: 'contract', message: 'Sign your vendor contract' }
    if (requireComplete && !hasBankDetails) return { reason: 'bank', message: 'Add payment details' }
    return null
  }

  const blockingReason = getBlockingReason()

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // If blocked, show restriction UI
  if (blockingReason) {
    const handleContinueOnboarding = () => {
      router.push('/business/onboarding')
    }

    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              {blockingReason.reason === 'kyc-pending' ? (
                <>
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-4">
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                  <h2 className="text-xl font-semibold">Verification in Progress</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Your KYC documents are being reviewed. This usually takes 1-2 business days.
                    We&apos;ll notify you once the review is complete.
                  </p>
                </>
              ) : blockingReason.reason === 'kyc-rejected' ? (
                <>
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                    <ShieldAlert className="h-8 w-8 text-red-600" />
                  </div>
                  <h2 className="text-xl font-semibold">Verification Rejected</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Your KYC verification was rejected. Please review the feedback and resubmit
                    your documents.
                  </p>
                  {kyc?.rejectionReason && (
                    <Alert variant="destructive" className="mt-4 max-w-md mx-auto text-left">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Rejection Reason</AlertTitle>
                      <AlertDescription>{kyc.rejectionReason}</AlertDescription>
                    </Alert>
                  )}
                </>
              ) : (
                <>
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <AlertCircle className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold">Complete Your Setup</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {blockingReason.message} to access this page and start receiving bookings.
                  </p>
                </>
              )}

              {/* Progress Bar */}
              <div className="max-w-xs mx-auto space-y-2 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Onboarding Progress</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Action Button */}
              <Button onClick={handleContinueOnboarding} className="mt-6">
                Continue Setup
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Access granted
  return <>{children}</>
}
