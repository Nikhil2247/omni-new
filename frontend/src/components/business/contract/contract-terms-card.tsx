'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  FileText,
  Percent,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  XCircle,
  PauseCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import type { VendorContract, ContractStatus, PayoutFrequency } from '@/lib/api/types/business.types'

interface ContractTermsCardProps {
  contract: VendorContract | null
  isLoading?: boolean
}

const StatusConfig: Record<
  ContractStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }
> = {
  DRAFT: {
    label: 'Draft',
    variant: 'outline',
    icon: <FileText className="h-3 w-3" />,
  },
  PENDING_SIGNATURE: {
    label: 'Pending Signature',
    variant: 'secondary',
    icon: <Clock className="h-3 w-3" />,
  },
  ACTIVE: {
    label: 'Active',
    variant: 'default',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  SUSPENDED: {
    label: 'Suspended',
    variant: 'destructive',
    icon: <PauseCircle className="h-3 w-3" />,
  },
  TERMINATED: {
    label: 'Terminated',
    variant: 'destructive',
    icon: <XCircle className="h-3 w-3" />,
  },
  EXPIRED: {
    label: 'Expired',
    variant: 'outline',
    icon: <AlertCircle className="h-3 w-3" />,
  },
}

const PayoutFrequencyLabels: Record<PayoutFrequency, string> = {
  AFTER_EVENT: 'After Event Completion',
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Bi-weekly',
  MONTHLY: 'Monthly',
  ON_COMPLETION: 'On Event Completion',
}

function TermItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string | React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-muted">{icon}</div>
      <div className="space-y-0.5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

export function ContractTermsCard({ contract, isLoading }: ContractTermsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!contract) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No Contract Found</h3>
          <p className="text-sm text-muted-foreground">
            Your vendor contract will appear here once it&apos;s created by the platform.
          </p>
        </CardContent>
      </Card>
    )
  }

  const statusConfig = StatusConfig[contract.status]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>Contract Terms</CardTitle>
          </div>
          <Badge
            variant={statusConfig.variant}
            className="gap-1"
          >
            {statusConfig.icon}
            {statusConfig.label}
          </Badge>
        </div>
        <CardDescription>
          Your agreement with the platform regarding commissions and payouts.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main Terms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TermItem
            icon={<Percent className="h-4 w-4 text-primary" />}
            label="Commission Rate"
            value={`${contract.commissionRate}%`}
          />
          <TermItem
            icon={<Clock className="h-4 w-4 text-primary" />}
            label="Payout Frequency"
            value={PayoutFrequencyLabels[contract.payoutFrequency]}
          />
          <TermItem
            icon={<Calendar className="h-4 w-4 text-primary" />}
            label="Hold Period"
            value={`${contract.payoutHoldDays} days after event`}
          />
          <TermItem
            icon={<DollarSign className="h-4 w-4 text-primary" />}
            label="Minimum Payout"
            value={`₹${contract.minPayoutAmount.toLocaleString()}`}
          />
        </div>

        <Separator />

        {/* Contract Dates */}
        {(contract.effectiveDate || contract.expiryDate) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contract.effectiveDate && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Effective From</p>
                <p className="text-sm font-medium">
                  {format(new Date(contract.effectiveDate), 'PPP')}
                </p>
              </div>
            )}
            {contract.expiryDate && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Expires On</p>
                <p className="text-sm font-medium">
                  {format(new Date(contract.expiryDate), 'PPP')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Signature Status */}
        <Separator />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Vendor Signature</p>
            <p className="text-xs text-muted-foreground">
              {contract.signedByVendor
                ? `Signed${contract.signedAt ? ` on ${format(new Date(contract.signedAt), 'PPP')}` : ''}`
                : 'Not signed yet'}
            </p>
          </div>
          {contract.signedByVendor ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-yellow-600" />
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Platform Signature</p>
            <p className="text-xs text-muted-foreground">
              {contract.signedByPlatform
                ? 'Pre-approved by platform'
                : 'Pending platform approval'}
            </p>
          </div>
          {contract.signedByPlatform ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <Clock className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        {/* Suspension/Termination Info */}
        {contract.suspendedReason && (
          <>
            <Separator />
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm font-medium text-destructive">Suspension Reason</p>
              <p className="text-sm mt-1">{contract.suspendedReason}</p>
            </div>
          </>
        )}

        {contract.terminatedReason && (
          <>
            <Separator />
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm font-medium text-destructive">Termination Reason</p>
              <p className="text-sm mt-1">{contract.terminatedReason}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
