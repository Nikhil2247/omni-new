'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, ShieldCheck, ShieldOff, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { useVendorConsents, useWithdrawConsent, useRequiredConsentTypes } from '@/hooks/queries/use-business'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import type { VendorConsent, ConsentType } from '@/lib/api/types/business.types'

const REQUIRED_CONSENT_TYPES: ConsentType[] = [
  'TERMS_OF_SERVICE',
  'PRIVACY_POLICY',
  'PLATFORM_COMMISSION',
  'DATA_PROCESSING',
]

function ConsentCard({
  consent,
  onWithdraw,
  isWithdrawing,
}: {
  consent: VendorConsent
  onWithdraw: () => void
  isWithdrawing: boolean
}) {
  const isRequired = REQUIRED_CONSENT_TYPES.includes(consent.consentType)
  const isActive = !consent.withdrawnAt
  const isExpired = consent.expiresAt && new Date(consent.expiresAt) < new Date()

  const getStatusBadge = () => {
    if (!isActive) {
      return (
        <Badge variant="secondary" className="gap-1">
          <XCircle className="h-3 w-3" />
          Withdrawn
        </Badge>
      )
    }
    if (isExpired) {
      return (
        <Badge variant="destructive" className="gap-1">
          <Clock className="h-3 w-3" />
          Expired
        </Badge>
      )
    }
    return (
      <Badge variant="default" className="gap-1 bg-green-600">
        <CheckCircle2 className="h-3 w-3" />
        Active
      </Badge>
    )
  }

  const formatConsentType = (type: ConsentType): string => {
    return type
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ')
  }

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">
            {formatConsentType(consent.consentType)}
          </span>
          {isRequired && (
            <Badge variant="outline" className="text-xs">
              Required
            </Badge>
          )}
          {getStatusBadge()}
        </div>
        <p className="text-xs text-muted-foreground">
          Version {consent.version} • Given{' '}
          {formatDistanceToNow(new Date(consent.givenAt), { addSuffix: true })}
        </p>
      </div>

      {isActive && !isRequired && (
        <Button
          variant="outline"
          size="sm"
          onClick={onWithdraw}
          disabled={isWithdrawing}
          className="text-destructive hover:text-destructive"
        >
          {isWithdrawing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Withdraw'
          )}
        </Button>
      )}
    </div>
  )
}

export function ConsentManager() {
  const { data: consents, isLoading } = useVendorConsents()
  const { mutate: withdrawConsent, isPending: isWithdrawing } = useWithdrawConsent()

  const [consentToWithdraw, setConsentToWithdraw] = useState<VendorConsent | null>(null)
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null)

  const activeConsents = consents?.filter((c) => !c.withdrawnAt) || []
  const withdrawnConsents = consents?.filter((c) => c.withdrawnAt) || []

  const handleWithdraw = () => {
    if (!consentToWithdraw) return

    setWithdrawingId(consentToWithdraw.id)
    withdrawConsent(
      {
        consentType: consentToWithdraw.consentType,
        version: consentToWithdraw.version,
      },
      {
        onSuccess: () => {
          toast.success('Consent withdrawn successfully')
          setConsentToWithdraw(null)
          setWithdrawingId(null)
        },
        onError: (error: any) => {
          toast.error(error?.message || 'Failed to withdraw consent')
          setWithdrawingId(null)
        },
      }
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <CardTitle>Consent Management</CardTitle>
          </div>
          <CardDescription>
            View and manage your privacy and marketing consents.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Active Consents */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Active Consents ({activeConsents.length})
            </h3>

            {activeConsents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No active consents found.
              </p>
            ) : (
              <div className="space-y-2">
                {activeConsents.map((consent) => (
                  <ConsentCard
                    key={consent.id}
                    consent={consent}
                    onWithdraw={() => setConsentToWithdraw(consent)}
                    isWithdrawing={withdrawingId === consent.id}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Withdrawn Consents */}
          {withdrawnConsents.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                <ShieldOff className="h-4 w-4" />
                Withdrawn Consents ({withdrawnConsents.length})
              </h3>
              <div className="space-y-2 opacity-60">
                {withdrawnConsents.map((consent) => (
                  <ConsentCard
                    key={consent.id}
                    consent={consent}
                    onWithdraw={() => {}}
                    isWithdrawing={false}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Withdraw Confirmation Dialog */}
      <AlertDialog
        open={!!consentToWithdraw}
        onOpenChange={(open) => !open && setConsentToWithdraw(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw Consent?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to withdraw your consent for{' '}
              <strong>
                {consentToWithdraw?.consentType
                  .split('_')
                  .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
                  .join(' ')}
              </strong>
              ? This action may affect the services you receive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleWithdraw}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Withdraw Consent
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
