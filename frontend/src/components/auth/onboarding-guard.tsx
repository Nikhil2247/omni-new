'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { Loader2 } from 'lucide-react'

interface OnboardingGuardProps {
  children: React.ReactNode
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, hasHydrated } = useAuthStore()

  const isAllowedPath = pathname?.startsWith('/settings/wedding-identity')
  const shouldBlock = !!user && !user.hasCompletedOnboarding && !isAllowedPath

  useEffect(() => {
    if (!hasHydrated) return

    // If user exists and hasn't completed onboarding, redirect to quiz
    if (shouldBlock) {
      router.replace('/onboarding/vibe-quiz')
    }
  }, [shouldBlock, hasHydrated, router])

  // Show loading state while hydrating store
  if (!hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // If onboarding not complete, show loading (redirect will happen)
  if (shouldBlock) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Let's personalize your experience...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
