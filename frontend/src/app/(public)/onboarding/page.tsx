'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useOnboardingStatus } from '@/hooks/queries/use-onboarding'
import { trackOnboarding } from '@/lib/analytics/umami'
import { Loader2 } from 'lucide-react'
import { Paper, SkContainer } from '@/components/sketch'

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
    <SkContainer className="flex min-h-[60vh] items-center justify-center py-12">
      <Paper alt className="flex flex-col items-center gap-4 px-10 py-8" role="status" aria-live="polite">
        <Loader2 className="text-blue h-8 w-8 animate-spin" />
        <p className="text-ink-soft text-sm">Loading...</p>
      </Paper>
    </SkContainer>
  )
}
