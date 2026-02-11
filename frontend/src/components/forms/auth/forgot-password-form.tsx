'use client'

import { useState } from 'react'
import { useRequestPasswordReset } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, CheckCircle2, Send } from 'lucide-react'
import { toast } from 'sonner'

export function ForgotPasswordForm() {
  const resetMutation = useRequestPasswordReset()
  const [email, setEmail] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      await resetMutation.mutateAsync({ email })
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
      <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CheckCircle2 className="h-5 w-5 text-green-600" />
        <AlertDescription className="text-green-900 dark:text-green-100">
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
        <p className="text-xs text-muted-foreground">
          Enter the email address associated with your account.
        </p>
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
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
      </Button>
    </form>
  )
}
