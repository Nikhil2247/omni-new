'use client'

import { AuthGuard } from '@/components/auth'

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen">{children}</div>
    </AuthGuard>
  )
}
