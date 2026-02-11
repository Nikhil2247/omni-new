'use client'

import { useState } from 'react'
import { useLogin } from '@/hooks/use-auth'
import { TwoFactorForm } from '@/components/forms/auth/two-factor-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

interface LoginFormProps {
  returnUrl?: string | null
}

export function LoginForm({ returnUrl }: LoginFormProps) {
  const loginMutation = useLogin(returnUrl)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [tempToken, setTempToken] = useState<string | null>(null)

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
