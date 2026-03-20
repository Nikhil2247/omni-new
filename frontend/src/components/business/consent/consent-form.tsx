'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ConsentCheckbox } from './consent-checkbox'
import { Loader2, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useRequiredConsentTypes, useGiveConsentsBulk, useConsentStatus } from '@/hooks/queries/use-business'
import { toast } from 'sonner'
import type { ConsentType, GiveConsentRequest, ConsentTypeInfo } from '@/lib/api/types/business.types'

interface ConsentFormProps {
  onComplete?: () => void
  showOptional?: boolean
}

export function ConsentForm({
  onComplete,
  showOptional = true,
}: ConsentFormProps) {
  const { data: consentTypes, isLoading: isLoadingTypes } = useRequiredConsentTypes()
  const { data: consentStatus, isLoading: isLoadingStatus } = useConsentStatus()
  const { mutate: giveConsentsBulk, isPending: isSubmitting } = useGiveConsentsBulk()

  const [selectedConsents, setSelectedConsents] = useState<Set<ConsentType>>(new Set())

  // Get already accepted consent types
  const acceptedConsents = useMemo(() => {
    const accepted = new Set<ConsentType>()
    if (consentStatus?.status) {
      Object.entries(consentStatus.status).forEach(([type, info]) => {
        if (info.hasConsent) {
          accepted.add(type as ConsentType)
        }
      })
    }
    return accepted
  }, [consentStatus])

  // Pre-select already given consents
  useEffect(() => {
    if (acceptedConsents.size > 0) {
      setSelectedConsents((prev) => new Set([...prev, ...acceptedConsents]))
    }
  }, [acceptedConsents])

  const requiredTypes = consentTypes?.required || []
  const optionalTypes = consentTypes?.optional || []

  // Check if all required consents are either selected or already accepted
  const allRequiredSelected = requiredTypes.every((ct) =>
    selectedConsents.has(ct.type) || acceptedConsents.has(ct.type)
  )

  // Get consents that still need to be given (not already accepted)
  const pendingRequiredConsents = requiredTypes.filter(
    (ct) => !acceptedConsents.has(ct.type)
  )
  const pendingOptionalConsents = optionalTypes.filter(
    (ct) => !acceptedConsents.has(ct.type)
  )

  // Check if all pending required are selected
  const allPendingRequiredSelected = pendingRequiredConsents.every((ct) =>
    selectedConsents.has(ct.type)
  )

  // Check if there are any new consents to submit
  const hasNewConsentsToSubmit = Array.from(selectedConsents).some(
    (type) => !acceptedConsents.has(type)
  )

  const handleToggle = (type: ConsentType, checked: boolean) => {
    // Don't allow unchecking already accepted consents
    if (acceptedConsents.has(type) && !checked) {
      return
    }
    setSelectedConsents((prev) => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(type)
      } else {
        newSet.delete(type)
      }
      return newSet
    })
  }

  const handleSelectAllRequired = () => {
    setSelectedConsents((prev) => {
      const newSet = new Set(prev)
      requiredTypes.forEach((ct) => newSet.add(ct.type))
      return newSet
    })
  }

  // Get the version for a consent type from the definitions
  const getConsentVersion = (type: ConsentType): string => {
    const found = [...requiredTypes, ...optionalTypes].find((ct) => ct.type === type)
    return found?.version || '1.0'
  }

  const handleSubmit = () => {
    if (!allRequiredSelected) {
      toast.error('Please accept all required consents to continue')
      return
    }

    // Only submit consents that haven't been given yet
    const newConsents = Array.from(selectedConsents).filter(
      (type) => !acceptedConsents.has(type)
    )

    if (newConsents.length === 0) {
      toast.success('All consents already accepted')
      onComplete?.()
      return
    }

    const consentsToGive: GiveConsentRequest[] = newConsents.map((type) => ({
      consentType: type,
      version: getConsentVersion(type),
    }))

    giveConsentsBulk(
      { consents: consentsToGive },
      {
        onSuccess: () => {
          toast.success('Consents saved successfully')
          onComplete?.()
        },
        onError: (error: any) => {
          toast.error(error?.message || 'Failed to save consents')
        },
      }
    )
  }

  if (isLoadingTypes || isLoadingStatus) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  // Check if all consents are already accepted
  const allConsentsAccepted = requiredTypes.length > 0 &&
    requiredTypes.every((ct) => acceptedConsents.has(ct.type))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <CardTitle>Terms & Consents</CardTitle>
        </div>
        <CardDescription>
          {allConsentsAccepted
            ? 'You have accepted all required consents. You can review them below.'
            : 'Please review and accept the following terms to continue using the platform.'
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* All Consents Accepted Message */}
        {allConsentsAccepted && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-400">
              All required consents have been accepted. Thank you!
            </AlertDescription>
          </Alert>
        )}

        {/* Required Consents */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Required Consents</h3>
            {pendingRequiredConsents.length > 0 && !allPendingRequiredSelected && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAllRequired}
              >
                Accept All Required
              </Button>
            )}
          </div>

          {requiredTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No required consents at this time.
            </p>
          ) : (
            <div className="space-y-3">
              {requiredTypes.map((ct) => (
                <ConsentCheckbox
                  key={ct.type}
                  type={ct.type}
                  name={ct.name}
                  description={ct.description}
                  version={ct.version}
                  documentUrl={ct.documentUrl}
                  content={ct.content}
                  summary={ct.summary}
                  required
                  checked={selectedConsents.has(ct.type)}
                  onChange={(checked) => handleToggle(ct.type, checked)}
                  alreadyAccepted={acceptedConsents.has(ct.type)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Optional Consents */}
        {showOptional && optionalTypes.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Optional Consents</h3>
            <div className="space-y-3">
              {optionalTypes.map((ct) => (
                <ConsentCheckbox
                  key={ct.type}
                  type={ct.type}
                  name={ct.name}
                  description={ct.description}
                  version={ct.version}
                  documentUrl={ct.documentUrl}
                  content={ct.content}
                  summary={ct.summary}
                  checked={selectedConsents.has(ct.type)}
                  onChange={(checked) => handleToggle(ct.type, checked)}
                  alreadyAccepted={acceptedConsents.has(ct.type)}
                />
              ))}
            </div>
          </div>
        )}

        {!allRequiredSelected && pendingRequiredConsents.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You must accept all required consents to continue.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter>
        {!allConsentsAccepted ? (
          <Button
            onClick={handleSubmit}
            disabled={!allRequiredSelected || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Accept & Continue'
            )}
          </Button>
        ) : hasNewConsentsToSubmit ? (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Optional Consents'
            )}
          </Button>
        ) : (
          <Button
            onClick={() => onComplete?.()}
            className="w-full"
            variant="outline"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Continue
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
