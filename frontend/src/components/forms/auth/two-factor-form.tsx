'use client'

import { useState } from 'react'
import { useVerifyTwoFactor } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield } from 'lucide-react'
import { toast } from 'sonner'

interface TwoFactorFormProps {
  tempToken: string
  returnUrl?: string | null
}

export function TwoFactorForm({ tempToken, returnUrl }: TwoFactorFormProps) {
  const verifyMutation = useVerifyTwoFactor(returnUrl)
  const [code, setCode] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      await verifyMutation.mutateAsync({ tempToken, code })
      toast.success('Two-factor verification successful.')
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          'Invalid code. Please check your authenticator app and try again.'
      )
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex flex-col items-center justify-center py-4 space-y-3">
        <div className="rounded-full bg-primary/10 p-3">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div className="text-center space-y-1">
          <p className="font-medium">Two-Factor Authentication</p>
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="code" className="sr-only">Verification code</Label>
        <Input
          id="code"
          type="text"
          value={code}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '')
            if (value.length <= 6) {
              setCode(value)
            }
          }}
          className="text-center text-2xl font-mono tracking-widest"
          placeholder="000000"
          maxLength={6}
          required
          autoComplete="one-time-code"
          autoFocus
        />
        <p className="text-xs text-center text-muted-foreground">
          Enter the code from your authenticator app or use a backup code
        </p>
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={verifyMutation.isPending || code.length !== 6}
      >
        {verifyMutation.isPending ? (
          <>
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Verifying...
          </>
        ) : (
          'Verify and continue'
        )}
      </Button>
    </form>
  )
}
