'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useVerifyEmail } from '@/hooks/use-auth'
import { SketchButton } from '@/components/sketch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, AlertCircle, Loader2, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { trackAuth } from '@/lib/analytics/umami'

interface VerifyEmailFormProps {
  token: string
}

export function VerifyEmailForm({ token }: VerifyEmailFormProps) {
  const router = useRouter()
  const verifyMutation = useVerifyEmail()

  useEffect(() => {
    // Automatically verify on mount
    handleVerify()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleVerify = async () => {
    try {
      await verifyMutation.mutateAsync({ token })
      trackAuth.emailVerified()
      toast.success('Email verified. Redirecting to login...')
      setTimeout(() => router.push('/login'), 3000)
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          'Verification failed. The link may have expired or is invalid.'
      )
    }
  }

  if (verifyMutation.isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue" />
        <div className="text-center space-y-2">
          <p className="font-medium">Verifying your email...</p>
          <p className="text-sm text-muted-foreground">
            Please wait while we confirm your email address.
          </p>
        </div>
      </div>
    )
  }

  if (verifyMutation.isSuccess) {
    return (
      <div className="space-y-4">
        <Alert className="border-leaf-deep bg-card">
          <CheckCircle2 className="h-5 w-5 text-leaf-deep" />
          <AlertDescription className="text-ink">
            <p className="font-medium mb-1">Email verified successfully!</p>
            <p className="text-sm">
              Your account is now active. Redirecting you to login...
            </p>
          </AlertDescription>
        </Alert>
        <SketchButton
          onClick={() => router.push('/login')}
          className="w-full justify-center"
        >
          Go to login
        </SketchButton>
      </div>
    )
  }

  if (verifyMutation.isError) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {(verifyMutation.error as any)?.response?.data?.message || 
             'Verification failed. The link may have expired or is invalid.'}
          </AlertDescription>
        </Alert>
        <SketchButton
          onClick={handleVerify}
          variant="line"
          className="w-full justify-center"
        >
          Try again
        </SketchButton>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <div className="rounded-full bg-blue-wash p-4">
        <Mail className="h-8 w-8 text-blue" />
      </div>
      <div className="text-center space-y-2">
        <p className="font-medium">Ready to verify</p>
        <p className="text-sm text-muted-foreground">
          Click below to verify your email address.
        </p>
      </div>
      <SketchButton
        onClick={handleVerify}
        className="w-full justify-center"
      >
        Verify email
      </SketchButton>
    </div>
  )
}
