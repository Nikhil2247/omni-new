'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useOnboardingStatus } from '@/hooks/queries/use-onboarding'
import { trackOnboarding } from '@/lib/analytics/umami'
import { Loader2 } from 'lucide-react'

export default function OnboardingPage() {
  const router = useRouter()
  const { data: status, isLoading } = useOnboardingStatus()

  useEffect(() => {
    trackOnboarding.start('user')
  }, [])

  useEffect(() => {
    if (isLoading) return

    if (status?.isOnboardingComplete) {
      router.replace('/dashboard')
    } else {
      router.replace('/onboarding/vibe-quiz')
    }
  }, [status, isLoading, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
