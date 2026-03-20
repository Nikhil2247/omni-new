'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useBusinessProfile, useBusinessKyc, useBusinessContract, useConsentStatus } from '@/hooks/queries/use-business'
import type { OnboardingStep } from './onboarding-stepper'

export type OnboardingStepId = 'profile' | 'kyc' | 'kyc-pending' | 'consents' | 'contract' | 'bank-details' | 'complete'

interface OnboardingState {
  // Data
  profile: ReturnType<typeof useBusinessProfile>['data']
  kyc: ReturnType<typeof useBusinessKyc>['data']
  contract: ReturnType<typeof useBusinessContract>['data']
  consentStatus: ReturnType<typeof useConsentStatus>['data']

  // Loading states
  isLoading: boolean

  // Computed states
  currentStep: OnboardingStepId
  steps: OnboardingStep[]
  progress: number // 0-100
  isComplete: boolean
  canAccessDashboard: boolean

  // Step checks
  hasProfile: boolean
  hasCompleteProfile: boolean
  hasSubmittedKyc: boolean
  isKycApproved: boolean
  isKycRejected: boolean
  hasRequiredConsents: boolean
  hasContract: boolean
  hasSignedContract: boolean
  hasBankDetails: boolean
}

const OnboardingContext = createContext<OnboardingState | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const profileQuery = useBusinessProfile()
  const kycQuery = useBusinessKyc()
  const contractQuery = useBusinessContract()
  const consentStatusQuery = useConsentStatus()

  const state = useMemo((): OnboardingState => {
    const profile = profileQuery.data
    const kyc = kycQuery.data
    const contract = contractQuery.data
    const consentStatus = consentStatusQuery.data

    const isLoading =
      profileQuery.isLoading ||
      kycQuery.isLoading ||
      contractQuery.isLoading ||
      consentStatusQuery.isLoading

    // Step checks
    const hasProfile = !!profile?.id
    const hasCompleteProfile = hasProfile &&
      !!profile?.businessName &&
      !!profile?.description &&
      !!profile?.categoryId

    const hasSubmittedKyc = !!kyc && ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'].includes(kyc.status)
    const isKycApproved = kyc?.status === 'APPROVED'
    const isKycRejected = kyc?.status === 'REJECTED'

    const hasRequiredConsents = consentStatus?.required?.hasAll ?? false

    const hasContract = contract?.hasContract ?? false
    const vendorContract = contract?.contract
    const hasSignedContract = vendorContract?.signedByVendor ?? false
    const hasBankDetails = !!(vendorContract?.bankAccountNumber || vendorContract?.upiId)

    // Determine current step
    let currentStep: OnboardingStepId = 'profile'

    if (!hasCompleteProfile) {
      currentStep = 'profile'
    } else if (!hasSubmittedKyc) {
      currentStep = 'kyc'
    } else if (!isKycApproved) {
      currentStep = 'kyc-pending'
    } else if (!hasRequiredConsents) {
      currentStep = 'consents'
    } else if (!hasSignedContract) {
      currentStep = 'contract'
    } else if (!hasBankDetails) {
      currentStep = 'bank-details'
    } else {
      currentStep = 'complete'
    }

    // Build steps array
    const steps: OnboardingStep[] = [
      {
        id: 'profile',
        title: 'Complete Profile',
        description: 'Add your business information',
        status: hasCompleteProfile ? 'completed' : currentStep === 'profile' ? 'current' : 'pending',
      },
      {
        id: 'kyc',
        title: 'KYC Verification',
        description: 'Upload verification documents',
        status: hasSubmittedKyc && !isKycRejected
          ? isKycApproved
            ? 'completed'
            : 'blocked'
          : currentStep === 'kyc' || currentStep === 'kyc-pending'
            ? 'current'
            : 'pending',
      },
      {
        id: 'consents',
        title: 'Accept Terms',
        description: 'Review and accept platform terms',
        status: hasRequiredConsents
          ? 'completed'
          : currentStep === 'consents'
            ? 'current'
            : !isKycApproved
              ? 'pending'
              : 'pending',
      },
      {
        id: 'contract',
        title: 'Sign Contract',
        description: 'Review and sign vendor agreement',
        status: hasSignedContract
          ? 'completed'
          : currentStep === 'contract'
            ? 'current'
            : 'pending',
      },
      {
        id: 'bank-details',
        title: 'Payment Details',
        description: 'Add your bank account for payouts',
        status: hasBankDetails
          ? 'completed'
          : currentStep === 'bank-details'
            ? 'current'
            : 'pending',
      },
    ]

    // Calculate progress
    const completedSteps = steps.filter((s) => s.status === 'completed').length
    const progress = Math.round((completedSteps / steps.length) * 100)

    const isComplete = currentStep === 'complete'
    const canAccessDashboard = isKycApproved && hasSignedContract

    return {
      profile,
      kyc,
      contract,
      consentStatus,
      isLoading,
      currentStep,
      steps,
      progress,
      isComplete,
      canAccessDashboard,
      hasProfile,
      hasCompleteProfile,
      hasSubmittedKyc,
      isKycApproved,
      isKycRejected,
      hasRequiredConsents,
      hasContract,
      hasSignedContract,
      hasBankDetails,
    }
  }, [
    profileQuery.data,
    profileQuery.isLoading,
    kycQuery.data,
    kycQuery.isLoading,
    contractQuery.data,
    contractQuery.isLoading,
    consentStatusQuery.data,
    consentStatusQuery.isLoading,
  ])

  return (
    <OnboardingContext.Provider value={state}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}
