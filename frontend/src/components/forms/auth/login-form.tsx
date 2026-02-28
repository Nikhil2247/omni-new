'use client'

import { useState } from 'react'
import { useEffect, useRef } from 'react'
import { useGoogleLogin, useLogin } from '@/hooks/use-auth'
import { TwoFactorForm } from '@/components/forms/auth/two-factor-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { trackAuth } from '@/lib/analytics/umami'

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential?: string }) => void
          }) => void
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>,
          ) => void
        }
      }
    }
  }
}

interface LoginFormProps {
  returnUrl?: string | null
}

export function LoginForm({ returnUrl }: LoginFormProps) {
  const loginMutation = useLogin(returnUrl)
  const googleLoginMutation = useGoogleLogin(returnUrl)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [tempToken, setTempToken] = useState<string | null>(null)
  const [googleReady, setGoogleReady] = useState(false)
  const googleButtonRef = useRef<HTMLDivElement | null>(null)
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  useEffect(() => {
    if (!googleClientId) {
      return
    }

    let cancelled = false

    const initGoogleButton = () => {
      if (
        cancelled ||
        !googleButtonRef.current ||
        !window.google?.accounts?.id
      ) {
        return
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          const credential = response.credential
          if (!credential) {
            toast.error('Google sign-in failed. Please try again.')
            return
          }

          try {
            const result = await googleLoginMutation.mutateAsync({
              idToken: credential,
            })

            if (result.requiresTwoFactor) {
              const token = result.tokens?.accessToken
              if (token) {
                setTempToken(token)
              }
              toast.info('Two-factor authentication required.')
              return
            }

            trackAuth.signIn('google')
            toast.success('Welcome back!')
          } catch (error: any) {
            toast.error(
              error?.response?.data?.message ||
                'Google login failed. Please try again.',
            )
          }
        },
      })

      googleButtonRef.current.innerHTML = ''
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
      })

      // Ensure the rendered Google button respects container width on small screens
      const btn = googleButtonRef.current.firstElementChild as HTMLElement | null
      if (btn) {
        btn.style.width = '100%'
        btn.style.maxWidth = '100%'
      }

      setGoogleReady(true)
    }

    if (window.google?.accounts?.id) {
      initGoogleButton()
      return () => {
        cancelled = true
      }
    }

    const scriptId = 'google-identity-services'
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null

    if (existingScript) {
      existingScript.addEventListener('load', initGoogleButton)
      return () => {
        cancelled = true
        existingScript.removeEventListener('load', initGoogleButton)
      }
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = initGoogleButton
    document.head.appendChild(script)

    return () => {
      cancelled = true
      script.onload = null
    }
  }, [googleClientId, googleLoginMutation])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const result = await loginMutation.mutateAsync({ email, password })
      if (result.requiresTwoFactor) {
        const token = result.tokens?.accessToken
        if (token) {
          setTempToken(token)
        }
        toast.info('Two-factor authentication required.')
        return
      }
      trackAuth.signIn('email')
      toast.success('Welcome back!')
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          'Login failed. Please check your credentials and try again.'
      )
    }
  }

  if (tempToken) {
    return (
      <div className="space-y-4">
        <TwoFactorForm tempToken={tempToken} returnUrl={returnUrl} />
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            setTempToken(null)
          }}
        >
          Back to login
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {googleClientId ? (
        <div className="space-y-3">
          <div
            ref={googleButtonRef}
            className="flex min-h-10 w-full items-center justify-center"
          />
          {!googleReady ? (
            <p className="text-center text-xs text-muted-foreground">
              Preparing Google sign-in...
            </p>
          ) : null}
          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              or
            </span>
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-10"
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? (
          <>
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Signing in...
          </>
        ) : (
          'Sign in'
        )}
      </Button>
    </form>
  )
}
