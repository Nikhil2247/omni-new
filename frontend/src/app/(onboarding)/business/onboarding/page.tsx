'use client'

import { OnboardingProvider, OnboardingWizard } from '@/components/business/onboarding'

export default function BusinessOnboardingPage() {
  return (
    <OnboardingProvider>
      <div className="min-h-screen flex items-center justify-center py-8 px-4">
        <div className="w-full max-w-6xl">
          <OnboardingWizard />
        </div>
      </div>
    </OnboardingProvider>
  )
}
