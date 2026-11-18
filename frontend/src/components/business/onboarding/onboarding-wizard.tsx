'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { OnboardingStepper } from './onboarding-stepper'
import { useOnboarding, type OnboardingStepId } from './onboarding-context'
import { ProfileStep } from './steps/profile-step'
import { KycStep } from './steps/kyc-step'
import { KycPendingStep } from './steps/kyc-pending-step'
import { ConsentsStep } from './steps/consents-step'
import { ContractStep } from './steps/contract-step'
import { BankDetailsStep } from './steps/bank-details-step'
import { CompletionStep } from './steps/completion-step'
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
} from 'lucide-react'

interface OnboardingWizardProps {
  showStepper?: boolean
  onComplete?: () => void
}

export function OnboardingWizard({
  showStepper = true,
  onComplete,
}: OnboardingWizardProps) {
  const router = useRouter()
  const onboarding = useOnboarding()
  const [manualStep, setManualStep] = useState<OnboardingStepId | null>(null)

  // Use manual step if set, otherwise use computed current step
  const activeStep = manualStep || onboarding.currentStep

  // Trigger sparkle/confetti effect
  const triggerSparkles = useCallback(() => {
    const duration = 800
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 20, spread: 360, ticks: 50, zIndex: 9999 }

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 30 * (timeLeft / duration)

      // Sparkles from multiple positions
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: randomInRange(0.2, 0.4) },
        colors: ['#FFD700', '#FFA500', '#FF69B4', '#00CED1', '#9370DB'],
        shapes: ['star', 'circle'],
        scalar: randomInRange(0.8, 1.2),
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: randomInRange(0.2, 0.4) },
        colors: ['#FFD700', '#FFA500', '#FF69B4', '#00CED1', '#9370DB'],
        shapes: ['star', 'circle'],
        scalar: randomInRange(0.8, 1.2),
      })
    }, 150)
  }, [])

  const handleStepComplete = useCallback(() => {
    triggerSparkles()
    setManualStep(null) // Reset to auto-computed step
  }, [triggerSparkles])

  const handleGoToDashboard = () => {
    if (onComplete) {
      onComplete()
    } else {
      router.push('/business/dashboard')
    }
  }

  if (onboarding.isLoading) {
    return (
      <div className="w-full p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Skeleton className="h-96 lg:col-span-1" />
          <Skeleton className="h-96 lg:col-span-3" />
        </div>
      </div>
    )
  }

  // If onboarding is complete, show completion view (full width)
  if (onboarding.isComplete && activeStep === 'complete') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <CompletionStep onGoToDashboard={handleGoToDashboard} />
      </div>
    )
  }

  const renderStepContent = () => {
    switch (activeStep) {
      case 'profile':
        return <ProfileStep onComplete={handleStepComplete} />
      case 'kyc':
        return <KycStep onComplete={handleStepComplete} />
      case 'kyc-pending':
        return <KycPendingStep />
      case 'consents':
        return <ConsentsStep onComplete={handleStepComplete} />
      case 'contract':
        return <ContractStep onComplete={handleStepComplete} />
      case 'bank-details':
        return <BankDetailsStep onComplete={handleStepComplete} />
      case 'complete':
        return <CompletionStep onGoToDashboard={handleGoToDashboard} />
      default:
        return null
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Compact Header with Progress */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 border-b">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Vendor Onboarding</h1>
          </div>
        </div>

        {/* Inline Progress */}
        <div className="flex items-center gap-3 min-w-[200px]">
          <Progress value={onboarding.progress} className="h-2 flex-1" />
          <span className="text-sm font-medium text-primary whitespace-nowrap">{onboarding.progress}%</span>
        </div>
      </div>

      {/* KYC Rejection Alert */}
      {onboarding.isKycRejected && (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>KYC Verification Rejected</AlertTitle>
          <AlertDescription>
            Your verification documents were rejected. Please review the feedback and resubmit.
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setManualStep('kyc')}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Resubmit Documents
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Stepper Sidebar */}
        {showStepper && (
          <div className="lg:col-span-1 h-fit sticky top-4">
            <div className="rounded-xl border bg-card/50 backdrop-blur-sm p-4">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Progress</span>
              </div>
              <OnboardingStepper
                steps={onboarding.steps}
                currentStep={activeStep}
                orientation="vertical"
              />
            </div>

            {/* Quick Dashboard Access */}
            {onboarding.canAccessDashboard && !onboarding.isComplete && (
              <div className="mt-4 p-3 rounded-lg border bg-primary/5 border-primary/20">
                <p className="text-xs text-muted-foreground mb-2">Ready to explore?</p>
                <Button variant="outline" size="sm" className="w-full" onClick={handleGoToDashboard}>
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step Content */}
        <div className={showStepper ? 'lg:col-span-3' : 'col-span-1'}>
          {renderStepContent()}
        </div>
      </div>
    </div>
  )
}
