'use client'

import { ConsentForm } from '../../consent/consent-form'
import { useOnboarding } from '../onboarding-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'

interface ConsentsStepProps {
  onComplete: () => void
}

export function ConsentsStep({ onComplete }: ConsentsStepProps) {
  const { hasRequiredConsents } = useOnboarding()

  if (hasRequiredConsents) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto text-green-600 mb-4" />
          <h3 className="font-semibold mb-2">Terms Accepted!</h3>
          <p className="text-sm text-muted-foreground mb-4">
            You&apos;ve accepted all required terms. You can manage your consents anytime from settings.
          </p>
          <Button onClick={onComplete}>Continue to Next Step</Button>
        </CardContent>
      </Card>
    )
  }

  return <ConsentForm onComplete={onComplete} />
}
