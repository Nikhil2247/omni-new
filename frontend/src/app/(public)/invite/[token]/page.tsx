'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { trackOnboarding } from '@/lib/analytics/umami'
import { Loader2, ArrowRight } from 'lucide-react'
import { useAcceptPartnerInvite } from '@/hooks/queries/use-onboarding'
import { useAuthStore } from '@/store/auth-store'
import { Brush, Ico, ICONS, Paper, SketchButton, SkContainer, Stamp } from '@/components/sketch'

export default function AcceptInvitePage() {
  const params = useParams()
  const token = params.token as string
  const router = useRouter()
  const { isAuthenticated, hasHydrated } = useAuthStore()
  const logout = useAuthStore((state) => state.logout)
  const acceptInvite = useAcceptPartnerInvite()

  useEffect(() => {
    trackOnboarding.stepComplete(1, 'accept-invite')
  }, [])

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleAccept = async () => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      router.push(`/login?returnUrl=/invite/${token}`)
      return
    }

    setStatus('loading')
    try {
      await acceptInvite.mutateAsync(token)
      setStatus('success')
    } catch (error: unknown) {
      setStatus('error')
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to accept invitation. It may have expired.'
      )
    }
  }

  const handleSwitchAccount = () => {
    logout()
    router.push(`/login?returnUrl=/invite/${token}`)
  }

  if (!hasHydrated) {
    return (
      <SkContainer className="max-w-md py-16">
        <div className="flex justify-center" role="status" aria-label="Loading">
          <Loader2 className="text-blue h-8 w-8 animate-spin" />
        </div>
      </SkContainer>
    )
  }

  return (
    <SkContainer className="max-w-md py-10 sm:py-14">
      <Paper tape className="px-6 py-8 text-center">
        <Ico d={status === 'success' ? ICONS.shield : ICONS.heart} className="mx-auto mb-3 h-14 w-14" />
        {status === 'error' && <Stamp tone="late">Not accepted</Stamp>}
        {status === 'success' && <Stamp>Accepted</Stamp>}
        <h1 className="font-display mt-3 text-[clamp(1.8rem,6vw,2.4rem)] leading-[1.05] font-semibold tracking-tight text-balance">
          {status === 'success' ? (
            <>
              Welcome to the <Brush>Team</Brush>!
            </>
          ) : status === 'error' ? (
            <>
              Unable to <Brush>accept</Brush>
            </>
          ) : (
            <>
              Wedding <Brush>Invitation</Brush>
            </>
          )}
        </h1>
        <p className="text-ink-soft mt-3">
          {status === 'success'
            ? 'You now have access to the wedding planning board.'
            : status === 'error'
              ? errorMessage
              : "You've been invited to join a wedding planning board."}
        </p>

        <div className="mt-6 space-y-3">
          {status === 'idle' && (
            <>
              {!isAuthenticated ? (
                <>
                  <p className="text-ink-soft text-sm">
                    Please log in or create an account to accept this invitation.
                  </p>
                  <div className="flex flex-col gap-3">
                    <SketchButton asChild className="w-full">
                      <Link href={`/login?returnUrl=/invite/${token}`}>Log In to Accept</Link>
                    </SketchButton>
                    <SketchButton asChild variant="line" className="w-full">
                      <Link href={`/register?returnUrl=/invite/${token}`}>Create Account</Link>
                    </SketchButton>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-3">
                  <SketchButton className="w-full" onClick={handleAccept}>
                    Accept Invitation
                    <ArrowRight className="h-4 w-4" />
                  </SketchButton>
                  <SketchButton variant="line" className="w-full" onClick={handleSwitchAccount}>
                    Use a different account
                  </SketchButton>
                </div>
              )}
            </>
          )}

          {status === 'loading' && (
            <div className="flex items-center justify-center py-4" role="status" aria-label="Accepting invitation">
              <Loader2 className="text-blue h-8 w-8 animate-spin" />
            </div>
          )}

          {status === 'success' && (
            <SketchButton className="w-full" onClick={() => router.push('/dashboard')}>
              Go to Dashboard
              <ArrowRight className="h-4 w-4" />
            </SketchButton>
          )}

          {status === 'error' && (
            <div className="flex flex-col gap-3">
              <SketchButton variant="line" className="w-full" onClick={() => setStatus('idle')}>
                Try Again
              </SketchButton>
              <SketchButton asChild variant="ghost" className="w-full">
                <Link href="/">Go to Homepage</Link>
              </SketchButton>
            </div>
          )}
        </div>
      </Paper>
    </SkContainer>
  )
}
