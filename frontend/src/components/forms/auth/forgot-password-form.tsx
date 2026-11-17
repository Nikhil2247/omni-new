'use client'

import { useState } from 'react'
import { useRequestPasswordReset } from '@/hooks/use-auth'
import { SketchButton } from '@/components/sketch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { trackAuth } from '@/lib/analytics/umami'

export function ForgotPasswordForm() {
  const resetMutation = useRequestPasswordReset()
  const [email, setEmail] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      await resetMutation.mutateAsync({ email })
      trackAuth.passwordReset()
      toast.success('If an account exists, a reset link has been sent.')
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          'Unable to send reset link. Please try again later.'
      )
    }
  }

  if (resetMutation.isSuccess) {
    return (
      <Alert className="border-leaf-deep bg-card">
        <CheckCircle2 className="h-5 w-5 text-leaf-deep" />
        <AlertDescription className="text-ink">
          <p className="font-medium mb-1">Check your email</p>
          <p className="text-sm">
            If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link.
          </p>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="sk-field">
        <Label htmlFor="email">Email address</Label>
        <div className="relative">
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Enter the email address associated with your account.
        </p>
      </div>

      <SketchButton
        type="submit"
        className="w-full justify-center"
        disabled={resetMutation.isPending}
      >
        {resetMutation.isPending ? (
          <>
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Sending...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Send reset link
          </>
        )}
      </SketchButton>
    </form>
  )
}
