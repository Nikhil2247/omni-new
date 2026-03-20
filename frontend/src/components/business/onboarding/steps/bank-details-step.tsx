'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BankDetailsForm } from '../../contract/bank-details-form'
import { useOnboarding } from '../onboarding-context'
import { CheckCircle2 } from 'lucide-react'

interface BankDetailsStepProps {
  onComplete: () => void
}

export function BankDetailsStep({ onComplete }: BankDetailsStepProps) {
  const { contract, hasBankDetails } = useOnboarding()
  const vendorContract = contract?.contract

  if (hasBankDetails) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto text-green-600 mb-4" />
          <h3 className="font-semibold mb-2">Payment Details Added!</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Your payment information is set up. You can update it anytime from your dashboard.
          </p>
          <Button onClick={onComplete}>Complete Setup</Button>
        </CardContent>
      </Card>
    )
  }

  return <BankDetailsForm contract={vendorContract ?? null} onComplete={onComplete} />
}
