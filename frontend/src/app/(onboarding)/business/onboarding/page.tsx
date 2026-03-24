'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingProvider, OnboardingWizard } from '@/components/business/onboarding'
import { useFeature } from '@/hooks/use-feature'
import { Loader2 } from 'lucide-react'

export default function BusinessOnboardingPage() {
  const router = useRouter()
  const { isEnabled, isLoading } = useFeature('vendor.onboarding')

  useEffect(() => {
    if (!isLoading && !isEnabled) {
      router.replace('/business/dashboard')
    }
  }, [isEnabled, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

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
