'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useResetPassword } from '@/hooks/use-auth'
import { SketchButton } from '@/components/sketch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { trackAuth } from '@/lib/analytics/umami'

interface ResetPasswordFormProps {
  token: string
}

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: '' }
  
  let score = 0
  if (password.length >= 8) score += 25
  if (password.length >= 12) score += 15
  if (/[a-z]/.test(password)) score += 15
  if (/[A-Z]/.test(password)) score += 15
  if (/\d/.test(password)) score += 15
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 15
  
  if (score < 40) return { score, label: 'Weak', color: 'bg-destructive' }
  if (score < 70) return { score, label: 'Fair', color: 'bg-yellow-500' }
  if (score < 90) return { score, label: 'Good', color: 'bg-blue-500' }
  return { score: 100, label: 'Strong', color: 'bg-green-500' }
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter()
  const resetMutation = useResetPassword()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const passwordStrength = getPasswordStrength(password)
  const passwordsMatch = password === confirmPassword

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    if (!passwordsMatch) {
      toast.error('Passwords do not match.')
      return
    }
    
    try {
      await resetMutation.mutateAsync({ token, newPassword: password })
      trackAuth.passwordReset()
      toast.success('Password updated. Redirecting to login...')
      setTimeout(() => router.push('/login'), 2000)
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          'Unable to reset password. The link may have expired.'
      )
    }
  }

  if (resetMutation.isSuccess) {
    return (
      <Alert className="border-leaf-deep bg-card">
        <CheckCircle2 className="h-5 w-5 text-leaf-deep" />
        <AlertDescription className="text-ink">
          <p className="font-medium mb-1">Password updated successfully!</p>
          <p className="text-sm">Redirecting you to login...</p>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="sk-field">
        <Label htmlFor="password">New password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ paddingRight: 36 }}
            placeholder="••••••••"
            required
            autoComplete="new-password"
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
        
        {password && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Password strength:</span>
              <span className={`font-medium ${
                passwordStrength.score < 40 ? 'text-destructive' :
                passwordStrength.score < 70 ? 'text-yellow-600' :
                passwordStrength.score < 90 ? 'text-blue-600' :
                'text-green-600'
              }`}>
                {passwordStrength.label}
              </span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                style={{ width: `${passwordStrength.score}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="sk-field">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{ paddingRight: 36 }}
            placeholder="••••••••"
            required
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {confirmPassword && !passwordsMatch && (
          <p className="text-xs text-destructive">Passwords do not match</p>
        )}
      </div>

      <SketchButton
        type="submit"
        className="w-full justify-center"
        disabled={resetMutation.isPending || passwordStrength.score < 40 || !passwordsMatch}
      >
        {resetMutation.isPending ? (
          <>
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Updating...
          </>
        ) : (
          'Update password'
        )}
      </SketchButton>
    </form>
  )
}
