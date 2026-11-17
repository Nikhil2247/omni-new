'use client'

import { useState } from 'react'
import { useRegister } from '@/hooks/use-auth'
import { SketchButton } from '@/components/sketch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { trackAuth } from '@/lib/analytics/umami'

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

interface RegisterFormProps {
  accountType?: 'USER' | 'VENDOR'
}

export function RegisterForm({ accountType = 'USER' }: RegisterFormProps) {
  const registerMutation = useRegister()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const passwordStrength = getPasswordStrength(password)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    try {
      await registerMutation.mutateAsync({
        email,
        password,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        accountType,
      })
      trackAuth.signUp('email', accountType)
      toast.success('Account created. Check your email to verify.')
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          'Registration failed. Please check your information and try again.'
      )
    }
  }

  if (registerMutation.isSuccess) {
    return (
      <Alert className="border-leaf-deep bg-card">
        <CheckCircle2 className="h-5 w-5 text-leaf-deep" />
        <AlertDescription className="text-ink">
          <p className="font-medium mb-1">Account created successfully!</p>
          <p className="text-sm">
            Please check your email <strong>{email}</strong> to verify your account.
          </p>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sk-field">
          <Label htmlFor="firstName">First name</Label>
          <div className="relative">
            <Input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="John"
              autoComplete="given-name"
            />
          </div>
        </div>

        <div className="sk-field">
          <Label htmlFor="lastName">Last name</Label>
          <div className="relative">
            <Input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              autoComplete="family-name"
            />
          </div>
        </div>
      </div>

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
      </div>

      <div className="sk-field">
        <Label htmlFor="password">Password</Label>
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
            <p className="text-xs text-muted-foreground">
              Use 8+ characters with uppercase, lowercase, numbers & symbols
            </p>
          </div>
        )}
      </div>

      <SketchButton
        type="submit"
        className="w-full justify-center"
        disabled={registerMutation.isPending || passwordStrength.score < 40}
      >
        {registerMutation.isPending ? (
          <>
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Creating account...
          </>
        ) : (
          'Create account'
        )}
      </SketchButton>

      <p className="text-xs text-center text-muted-foreground">
        By creating an account, you agree to our Terms of Service and Privacy Policy.
      </p>
    </form>
  )
}
