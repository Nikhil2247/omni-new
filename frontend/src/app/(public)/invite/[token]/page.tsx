'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { trackOnboarding } from '@/lib/analytics/umami'
import { Heart, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react'
import { useAcceptPartnerInvite } from '@/hooks/queries/use-onboarding'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-white">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 via-white to-purple-50 p-4">
      <Card className="max-w-md w-full border-pink-100 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'success' ? (
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            ) : status === 'error' ? (
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
            ) : (
              <div className="h-16 w-16 rounded-full bg-pink-100 flex items-center justify-center">
                <Heart className="h-10 w-10 text-pink-500" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === 'success'
              ? 'Welcome to the Team!'
              : status === 'error'
              ? 'Unable to Accept'
              : 'Wedding Invitation'}
          </CardTitle>
          <CardDescription>
            {status === 'success'
              ? 'You now have access to the wedding planning board.'
              : status === 'error'
              ? errorMessage
              : 'You\'ve been invited to join a wedding planning board.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'idle' && (
            <>
              {!isAuthenticated ? (
                <div className="space-y-4">
                  <p className="text-sm text-center text-muted-foreground">
                    Please log in or create an account to accept this invitation.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                      asChild
                    >
                      <Link href={`/login?returnUrl=/invite/${token}`}>
                        Log In to Accept
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/register?returnUrl=/invite/${token}`}>
                        Create Account
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                    onClick={handleAccept}
                  >
                    Accept Invitation
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleSwitchAccount}>
                    Use a different account
                  </Button>
                </div>
              )}
            </>
          )}

          {status === 'loading' && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
            </div>
          )}

          {status === 'success' && (
            <Button
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              onClick={() => router.push('/dashboard')}
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          {status === 'error' && (
            <div className="flex flex-col gap-2">
              <Button variant="outline" className="w-full" onClick={() => setStatus('idle')}>
                Try Again
              </Button>
              <Button variant="ghost" className="w-full" asChild>
                <Link href="/">Go to Homepage</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
