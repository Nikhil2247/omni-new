'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useVerifyEmail } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, AlertCircle, Loader2, Mail } from 'lucide-react'
import { toast } from 'sonner'

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
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
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
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <AlertDescription className="text-green-900 dark:text-green-100">
            <p className="font-medium mb-1">Email verified successfully!</p>
            <p className="text-sm">
              Your account is now active. Redirecting you to login...
            </p>
          </AlertDescription>
        </Alert>
        <Button
          onClick={() => router.push('/login')}
          className="w-full"
          size="lg"
        >
          Go to login
        </Button>
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
        <Button
          onClick={handleVerify}
          variant="outline"
          className="w-full"
          size="lg"
        >
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <div className="rounded-full bg-primary/10 p-4">
        <Mail className="h-8 w-8 text-primary" />
      </div>
      <div className="text-center space-y-2">
        <p className="font-medium">Ready to verify</p>
        <p className="text-sm text-muted-foreground">
          Click below to verify your email address.
        </p>
      </div>
      <Button
        onClick={handleVerify}
        className="w-full"
        size="lg"
      >
        Verify email
      </Button>
    </div>
  )
}
