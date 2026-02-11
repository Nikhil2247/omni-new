'use client'

import { AuthGuard } from '@/components/auth'

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-purple-50">
        {children}
      </div>
    </AuthGuard>
  )
}
