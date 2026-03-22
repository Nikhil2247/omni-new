'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail,
  Phone,
  FileText,
  Shield,
  CheckCircle,
  Clock,
  Loader2,
  ArrowRight,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import {
  useInitiateClaim,
  useVerifyClaim,
  useResendVerification,
  useInitiateGuestClaim,
  useVerifyGuestClaim,
  useResendGuestVerification,
} from '@/hooks/queries/use-vendor-claim'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import type { ClaimVerificationMethod, VendorClaimResponse } from '@/lib/api/types/vendor-claim.types'

// ============================================================================
// Types
// ============================================================================

interface ClaimVendorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendorProfileId: string
  vendorName: string
  contactEmail?: string | null
  contactPhone?: string | null
}

// Guest flow: enter-email → verify-guest-code → guest-success
// Authenticated flow: select-method → verify-code → result
type Step =
  | 'enter-email'
  | 'verify-guest-code'
  | 'guest-success'
  | 'select-method'
  | 'verify-code'
  | 'result'

// ============================================================================
// Helpers
// ============================================================================

function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@')
  if (!localPart || !domain) return '***@***.***'
  const maskedLocal =
    localPart.length > 2
      ? `${localPart[0]}***${localPart[localPart.length - 1]}`
      : `${localPart[0]}***`
  return `${maskedLocal}@${domain}`
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 4) return '****'
  return `****${digits.slice(-4)}`
}

const VERIFICATION_CODE_EXPIRY_SECONDS = 10 * 60 // 10 minutes

// ============================================================================
// Animation Variants
// ============================================================================

const stepVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
}

const successIconVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 20 },
  },
}

// ============================================================================
// Component
// ============================================================================

export function ClaimVendorModal({
  open,
  onOpenChange,
  vendorProfileId,
  vendorName,
  contactEmail,
  contactPhone,
}: ClaimVendorModalProps) {
  const router = useRouter()
  const { isAuthenticated, hasHydrated, setCredentials } = useAuthStore()

  // State
  const [step, setStep] = useState<Step>('enter-email')
  const [email, setEmail] = useState('')
  const [selectedMethod, setSelectedMethod] = useState<ClaimVerificationMethod | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [claimData, setClaimData] = useState<VendorClaimResponse | null>(null)
  const [maskedEmailFromServer, setMaskedEmailFromServer] = useState('')
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [isSuccess, setIsSuccess] = useState(false)

  // Authenticated user hooks
  const initiateClaim = useInitiateClaim()
  const verifyClaim = useVerifyClaim()
  const resendVerification = useResendVerification()

  // Guest user hooks
  const initiateGuestClaim = useInitiateGuestClaim()
  const verifyGuestClaim = useVerifyGuestClaim()
  const resendGuestVerification = useResendGuestVerification()

  // Build available methods for authenticated users
  const availableMethods: { method: ClaimVerificationMethod; label: string; description: string; icon: typeof Mail }[] = []

  if (contactEmail) {
    availableMethods.push({
      method: 'EMAIL',
      label: 'Email Verification',
      description: `We'll send a code to ${maskEmail(contactEmail)}`,
      icon: Mail,
    })
  }

  if (contactPhone) {
    availableMethods.push({
      method: 'PHONE',
      label: 'Phone Verification',
      description: `We'll send a code to ${maskPhone(contactPhone)}`,
      icon: Phone,
    })
  }

  availableMethods.push({
    method: 'DOCUMENT',
    label: 'Document Upload',
    description: 'Upload business documents for manual verification',
    icon: FileText,
  })

  availableMethods.push({
    method: 'ADMIN_VERIFIED',
    label: 'Request Admin Review',
    description: 'Request verification by our admin team',
    icon: Shield,
  })

  // Determine initial step based on authentication
  useEffect(() => {
    if (open && hasHydrated) {
      if (isAuthenticated) {
        setStep('select-method')
      } else {
        setStep('enter-email')
      }
    }
  }, [open, hasHydrated, isAuthenticated])

  // Timer effect
  useEffect(() => {
    if ((step !== 'verify-code' && step !== 'verify-guest-code') || timeRemaining <= 0) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [step, timeRemaining])

  // Reset state when modal closes
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setTimeout(() => {
          setStep(isAuthenticated ? 'select-method' : 'enter-email')
          setEmail('')
          setSelectedMethod(null)
          setVerificationCode('')
          setClaimData(null)
          setMaskedEmailFromServer('')
          setTimeRemaining(0)
          setIsSuccess(false)
        }, 300)
      }
      onOpenChange(nextOpen)
    },
    [onOpenChange, isAuthenticated]
  )

  // ============================================================================
  // Guest Claim Handlers
  // ============================================================================

  const handleInitiateGuestClaim = async () => {
    if (!email.trim()) return

    try {
      const result = await initiateGuestClaim.mutateAsync({
        vendorProfileId,
        email: email.trim(),
      })
      setMaskedEmailFromServer(result.maskedEmail)
      setStep('verify-guest-code')
      setTimeRemaining(VERIFICATION_CODE_EXPIRY_SECONDS)
    } catch {
      // Error is handled by the hook's onError
    }
  }

  const handleVerifyGuestClaim = async () => {
    if (!verificationCode.trim()) return

    try {
      const result = await verifyGuestClaim.mutateAsync({
        vendorProfileId,
        email: email.trim(),
        verificationCode: verificationCode.trim(),
      })

      // Store tokens and user data in auth store
      if (result.accessToken && result.refreshToken && result.user) {
        setCredentials(result.accessToken, result.refreshToken, {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
          firstName: null,
          lastName: null,
        })
      }

      setStep('guest-success')
    } catch {
      // Error is handled by the hook's onError
    }
  }

  const handleResendGuestCode = async () => {
    if (!email.trim()) return

    try {
      const result = await resendGuestVerification.mutateAsync({
        vendorProfileId,
        email: email.trim(),
      })
      setMaskedEmailFromServer(result.maskedEmail)
      setTimeRemaining(VERIFICATION_CODE_EXPIRY_SECONDS)
      setVerificationCode('')
    } catch {
      // Error is handled by the hook's onError
    }
  }

  const handleGoToDashboard = () => {
    handleOpenChange(false)
    router.push('/business/onboarding')
  }

  // ============================================================================
  // Authenticated Claim Handlers
  // ============================================================================

  const handleInitiateClaim = async () => {
    if (!selectedMethod) return

    try {
      const result = await initiateClaim.mutateAsync({
        vendorProfileId,
        verificationMethod: selectedMethod,
      })
      setClaimData(result)

      if (selectedMethod === 'EMAIL' || selectedMethod === 'PHONE') {
        setStep('verify-code')
        setTimeRemaining(VERIFICATION_CODE_EXPIRY_SECONDS)
      } else {
        // For DOCUMENT and ADMIN_VERIFIED, go directly to pending result
        setIsSuccess(false)
        setStep('result')
      }
    } catch {
      // Error is handled by the hook's onError
    }
  }

  const handleVerifyCode = async () => {
    if (!claimData || !verificationCode.trim()) return

    try {
      await verifyClaim.mutateAsync({
        claimId: claimData.id,
        verificationCode: verificationCode.trim(),
        vendorProfileId,
      })
      setIsSuccess(true)
      setStep('result')
    } catch {
      // Error is handled by the hook's onError
    }
  }

  const handleResendCode = async () => {
    if (!claimData) return

    try {
      await resendVerification.mutateAsync(claimData.id)
      setTimeRemaining(VERIFICATION_CODE_EXPIRY_SECONDS)
      setVerificationCode('')
    } catch {
      // Error is handled by the hook's onError
    }
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const isPendingReview = selectedMethod === 'DOCUMENT' || selectedMethod === 'ADMIN_VERIFIED'

  const isValidEmail = (emailStr: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Claim Business
          </DialogTitle>
          <DialogDescription>
            Verify your ownership of{' '}
            <span className="font-medium text-foreground">{vendorName}</span>
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* ================================================================ */}
          {/* Guest Flow: Step 1 - Enter Email */}
          {/* ================================================================ */}
          {step === 'enter-email' && (
            <motion.div
              key="enter-email"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="space-y-4 pt-2"
            >
              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">
                    Enter your personal email address. We&apos;ll send you a verification code
                    and create your account automatically.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="claim-email">Email Address</Label>
                  <Input
                    id="claim-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && isValidEmail(email)) {
                        handleInitiateGuestClaim()
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be your login email for managing the business.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  disabled={!isValidEmail(email) || initiateGuestClaim.isPending}
                  onClick={handleInitiateGuestClaim}
                >
                  {initiateGuestClaim.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* ================================================================ */}
          {/* Guest Flow: Step 2 - Verify Code */}
          {/* ================================================================ */}
          {step === 'verify-guest-code' && (
            <motion.div
              key="verify-guest-code"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="space-y-4 pt-2"
            >
              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/30 p-4 text-center">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We sent a 6-digit verification code to
                  </p>
                  <p className="mt-1 font-medium">
                    {maskedEmailFromServer || maskEmail(email)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guest-verification-code">Verification Code</Label>
                  <Input
                    id="guest-verification-code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) =>
                      setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    className="text-center text-lg tracking-widest"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && verificationCode.length === 6) {
                        handleVerifyGuestClaim()
                      }
                    }}
                  />
                </div>

                {/* Timer and resend */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {timeRemaining > 0
                        ? `Code expires in ${formatTime(timeRemaining)}`
                        : 'Code expired'}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                    disabled={resendGuestVerification.isPending}
                    onClick={handleResendGuestCode}
                  >
                    {resendGuestVerification.isPending ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Resend code'
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setStep('enter-email')
                    setVerificationCode('')
                  }}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  disabled={verificationCode.length !== 6 || verifyGuestClaim.isPending}
                  onClick={handleVerifyGuestClaim}
                >
                  {verifyGuestClaim.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Create Account'
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* ================================================================ */}
          {/* Guest Flow: Step 3 - Success */}
          {/* ================================================================ */}
          {step === 'guest-success' && (
            <motion.div
              key="guest-success"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center py-8 text-center"
            >
              <motion.div
                variants={successIconVariants}
                initial="initial"
                animate="animate"
                className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
              >
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </motion.div>
              <h3 className="text-lg font-semibold">Business Claimed Successfully!</h3>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                Your account has been created and you&apos;re now logged in.
                Let&apos;s complete your business profile setup.
              </p>
              <Button className="mt-6" onClick={handleGoToDashboard}>
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {/* ================================================================ */}
          {/* Authenticated Flow: Step 1 - Select Verification Method */}
          {/* ================================================================ */}
          {step === 'select-method' && (
            <motion.div
              key="select-method"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="space-y-4 pt-2"
            >
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Select verification method
                </Label>
                <RadioGroup
                  value={selectedMethod || ''}
                  onValueChange={(value) =>
                    setSelectedMethod(value as ClaimVerificationMethod)
                  }
                  className="grid gap-3"
                >
                  {availableMethods.map(({ method, label, description, icon: Icon }) => (
                    <div
                      key={method}
                      className={cn(
                        'relative flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-all',
                        selectedMethod === method
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                      onClick={() => setSelectedMethod(method)}
                    >
                      <RadioGroupItem
                        value={method}
                        id={method}
                        className="mt-0.5"
                      />
                      <div className="flex flex-1 items-start gap-3">
                        <div
                          className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors',
                            selectedMethod === method
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <Label
                            htmlFor={method}
                            className="cursor-pointer font-medium"
                          >
                            {label}
                          </Label>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  disabled={!selectedMethod || initiateClaim.isPending}
                  onClick={handleInitiateClaim}
                >
                  {initiateClaim.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Initiating...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* ================================================================ */}
          {/* Authenticated Flow: Step 2 - Enter Verification Code */}
          {/* ================================================================ */}
          {step === 'verify-code' && (
            <motion.div
              key="verify-code"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="space-y-4 pt-2"
            >
              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/30 p-4 text-center">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    {selectedMethod === 'EMAIL' ? (
                      <Mail className="h-6 w-6 text-primary" />
                    ) : (
                      <Phone className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We sent a 6-digit verification code to
                  </p>
                  <p className="mt-1 font-medium">
                    {selectedMethod === 'EMAIL'
                      ? maskEmail(contactEmail || '')
                      : maskPhone(contactPhone || '')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verification-code">Verification Code</Label>
                  <Input
                    id="verification-code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) =>
                      setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    className="text-center text-lg tracking-widest"
                    autoFocus
                  />
                </div>

                {/* Timer and resend */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {timeRemaining > 0
                        ? `Code expires in ${formatTime(timeRemaining)}`
                        : 'Code expired'}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                    disabled={resendVerification.isPending}
                    onClick={handleResendCode}
                  >
                    {resendVerification.isPending ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Resend code'
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep('select-method')}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  disabled={
                    verificationCode.length !== 6 || verifyClaim.isPending
                  }
                  onClick={handleVerifyCode}
                >
                  {verifyClaim.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify'
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* ================================================================ */}
          {/* Authenticated Flow: Step 3 - Result */}
          {/* ================================================================ */}
          {step === 'result' && (
            <motion.div
              key="result"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center py-8 text-center"
            >
              {isSuccess ? (
                <>
                  <motion.div
                    variants={successIconVariants}
                    initial="initial"
                    animate="animate"
                    className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
                  >
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </motion.div>
                  <h3 className="text-lg font-semibold">Claim Approved!</h3>
                  <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                    You can now manage this business. Your vendor dashboard has
                    been updated.
                  </p>
                </>
              ) : (
                <>
                  <motion.div
                    variants={successIconVariants}
                    initial="initial"
                    animate="animate"
                    className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30"
                  >
                    <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                  </motion.div>
                  <h3 className="text-lg font-semibold">Claim Under Review</h3>
                  <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                    {isPendingReview
                      ? 'Your claim has been submitted. Our team will review it and get back to you within 2-3 business days.'
                      : 'Your claim is being processed. We will notify you once it has been reviewed.'}
                  </p>
                </>
              )}
              <Button className="mt-6" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
