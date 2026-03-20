'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  RotateCcw,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { useRefundRequests, useBusinessRefundRequests } from '@/hooks/queries/use-refund';
import { RefundRequest, RefundStatus } from '@/lib/api/types/refund.types';
import { format } from 'date-fns';

// Format currency helper
function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Status configuration
const statusConfig: Record<RefundStatus, {
  label: string;
  className: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  PENDING: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: Clock,
  },
  APPROVED: {
    label: 'Approved',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    icon: CheckCircle,
  },
  REJECTED: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    icon: XCircle,
  },
  PROCESSED: {
    label: 'Processed',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    icon: RefreshCw,
  },
};

interface RefundHistoryProps {
  isBusinessView?: boolean;
  limit?: number;
}

export function RefundHistory({ isBusinessView = false, limit = 20 }: RefundHistoryProps) {
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);

  const userRefunds = useRefundRequests(limit);
  const businessRefunds = useBusinessRefundRequests(limit);

  const { data, isLoading, error, refetch } = isBusinessView ? businessRefunds : userRefunds;

  const refundRequests = data?.refundRequests || [];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Refund Requests
          </CardTitle>
          <CardDescription>
            Track the status of your refund requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground">
              <RotateCcw className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Failed to load refund requests</p>
              <p className="text-sm">Please try again later</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="mt-4"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          ) : refundRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <RotateCcw className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No refund requests</p>
              <p className="text-sm">
                You haven&apos;t submitted any refund requests yet
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refundRequests.map((refund) => {
                    const config = statusConfig[refund.status];
                    const StatusIcon = config.icon;

                    return (
                      <TableRow key={refund.id}>
                        <TableCell className="font-medium">
                          {format(new Date(refund.createdAt), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(refund.amount, refund.payment?.currency || 'INR')}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {refund.reason}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${config.className} inline-flex items-center gap-1`}>
                            <StatusIcon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedRefund(refund)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refund Details Dialog */}
      <RefundDetailsDialog
        refund={selectedRefund}
        isOpen={!!selectedRefund}
        onClose={() => setSelectedRefund(null)}
      />
    </>
  );
}

interface RefundDetailsDialogProps {
  refund: RefundRequest | null;
  isOpen: boolean;
  onClose: () => void;
}

function RefundDetailsDialog({ refund, isOpen, onClose }: RefundDetailsDialogProps) {
  if (!refund) return null;

  const config = statusConfig[refund.status];
  const StatusIcon = config.icon;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Refund Request Details
          </DialogTitle>
          <DialogDescription>
            View the details of your refund request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge className={`${config.className} inline-flex items-center gap-1`}>
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </Badge>
          </div>

          {/* Amount */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Refund Amount</span>
            <span className="font-semibold">
              {formatCurrency(refund.amount, refund.payment?.currency || 'INR')}
            </span>
          </div>

          {/* Original Payment */}
          {refund.payment && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Original Payment</span>
              <span className="font-medium">
                {formatCurrency(refund.payment.amount, refund.payment.currency)}
              </span>
            </div>
          )}

          {/* Request Date */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Request Date</span>
            <span>{format(new Date(refund.createdAt), 'MMM dd, yyyy hh:mm a')}</span>
          </div>

          {/* Processed Date */}
          {refund.processedAt && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Processed Date</span>
              <span>{format(new Date(refund.processedAt), 'MMM dd, yyyy hh:mm a')}</span>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Reason</span>
            <div className="rounded-lg border p-3 bg-muted/50">
              <p className="text-sm">{refund.reason}</p>
            </div>
          </div>

          {/* Admin Notes */}
          {refund.adminNotes && (
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Admin Response</span>
              <div className="rounded-lg border p-3 bg-muted/50">
                <p className="text-sm">{refund.adminNotes}</p>
              </div>
            </div>
          )}

          {/* Status-specific messages */}
          {refund.status === 'PENDING' && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20 p-4">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-400">Under Review</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-500">
                    Your refund request is being reviewed. This typically takes 5-7 business days.
                  </p>
                </div>
              </div>
            </div>
          )}

          {refund.status === 'APPROVED' && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-400">Approved</p>
                  <p className="text-sm text-blue-700 dark:text-blue-500">
                    Your refund has been approved and will be processed shortly.
                  </p>
                </div>
              </div>
            </div>
          )}

          {refund.status === 'PROCESSED' && (
            <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 p-4">
              <div className="flex items-start gap-3">
                <RefreshCw className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-400">Refund Processed</p>
                  <p className="text-sm text-green-700 dark:text-green-500">
                    The refund has been processed. It may take 5-10 business days to appear in your account.
                  </p>
                </div>
              </div>
            </div>
          )}

          {refund.status === 'REJECTED' && (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800 dark:text-red-400">Request Declined</p>
                  <p className="text-sm text-red-700 dark:text-red-500">
                    Your refund request was not approved. Please contact support if you have questions.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
