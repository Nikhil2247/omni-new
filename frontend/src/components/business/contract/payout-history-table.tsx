'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Calendar,
  ArrowUpRight,
} from 'lucide-react'
import { useVendorPayouts } from '@/hooks/queries/use-business'
import { format } from 'date-fns'
import type { PayoutRecord, PayoutRecordStatus } from '@/lib/api/types/business.types'

const StatusConfig: Record<
  PayoutRecordStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }
> = {
  PENDING: {
    label: 'Pending',
    variant: 'secondary',
    icon: <Clock className="h-3 w-3" />,
  },
  SCHEDULED: {
    label: 'Scheduled',
    variant: 'outline',
    icon: <Calendar className="h-3 w-3" />,
  },
  PROCESSING: {
    label: 'Processing',
    variant: 'default',
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  COMPLETED: {
    label: 'Completed',
    variant: 'default',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  FAILED: {
    label: 'Failed',
    variant: 'destructive',
    icon: <XCircle className="h-3 w-3" />,
  },
}

function PayoutRow({ payout }: { payout: PayoutRecord }) {
  const statusConfig = StatusConfig[payout.status]

  return (
    <TableRow>
      <TableCell>
        <div className="space-y-1">
          <p className="font-medium text-sm">
            {format(new Date(payout.periodStart), 'MMM d')} -{' '}
            {format(new Date(payout.periodEnd), 'MMM d, yyyy')}
          </p>
          <p className="text-xs text-muted-foreground">
            {payout.eventCount} event{payout.eventCount !== 1 ? 's' : ''}
          </p>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <p className="font-medium">₹{payout.grossEarnings.toLocaleString()}</p>
      </TableCell>
      <TableCell className="text-right text-muted-foreground">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <span className="cursor-help">
                -₹{payout.totalCommission.toLocaleString()}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Platform Commission</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell className="text-right">
        <p className="font-semibold text-green-600">
          ₹{payout.netPayout.toLocaleString()}
        </p>
      </TableCell>
      <TableCell>
        <Badge
          variant={statusConfig.variant}
          className={`gap-1 ${
            payout.status === 'COMPLETED' ? 'bg-green-600' : ''
          }`}
        >
          {statusConfig.icon}
          {statusConfig.label}
        </Badge>
      </TableCell>
      <TableCell className="text-right text-sm text-muted-foreground">
        {payout.processedAt ? (
          format(new Date(payout.processedAt), 'MMM d, yyyy')
        ) : payout.scheduledFor ? (
          <span className="flex items-center gap-1 justify-end">
            <Calendar className="h-3 w-3" />
            {format(new Date(payout.scheduledFor), 'MMM d')}
          </span>
        ) : (
          '-'
        )}
      </TableCell>
    </TableRow>
  )
}

export function PayoutHistoryTable() {
  const { data: payouts, isLoading } = useVendorPayouts()

  // Calculate totals
  const totalPaid = payouts?.filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.netPayout, 0) || 0
  const totalPending = payouts?.filter((p) => ['PENDING', 'SCHEDULED', 'PROCESSING'].includes(p.status))
    .reduce((sum, p) => sum + p.netPayout, 0) || 0

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <CardTitle>Payout History</CardTitle>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-right">
              <p className="text-muted-foreground">Total Paid</p>
              <p className="font-semibold text-green-600">₹{totalPaid.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground">Pending</p>
              <p className="font-semibold">₹{totalPending.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <CardDescription>
          View your earnings and payout history from completed events.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {!payouts || payouts.length === 0 ? (
          <div className="py-12 text-center">
            <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Payouts Yet</h3>
            <p className="text-sm text-muted-foreground">
              Your payout history will appear here once you complete events.
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-right">Net Payout</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((payout) => (
                  <PayoutRow key={payout.id} payout={payout} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Failed Payouts Warning */}
        {payouts?.some((p) => p.status === 'FAILED') && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
              <div>
                <p className="text-sm font-medium text-destructive">Some payouts failed</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Please check your payment details and contact support if the issue persists.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
