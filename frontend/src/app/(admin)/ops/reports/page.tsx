'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import {
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Users,
  FileText,
  Scale,
  ShieldCheck,
  XCircle,
  TrendingUp,
  ClipboardList,
  Activity,
  RefreshCw,
  Loader2,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader, StatCard, StatGrid, StatusBadge, type StatusTone } from '@/components/dashboard'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useOpsDashboardMetrics } from '@/hooks/queries/use-ops-dashboard'

function getEventStatusColor(status: string): string {
  switch (status) {
    case 'NEW':
      return 'bg-blue-500'
    case 'ASSIGNED':
      return 'bg-purple-500'
    case 'REQUIREMENTS_SET':
      return 'bg-indigo-500'
    case 'VENDOR_SOURCING':
      return 'bg-orange-500'
    case 'CONTRACTS_LOCKED':
      return 'bg-teal-500'
    case 'EXECUTION':
      return 'bg-yellow-500'
    case 'COMPLETED':
      return 'bg-green-500'
    case 'CANCELLED':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

function formatStatusLabel(status: string): string {
  return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

export default function OpsReportsPage() {
  const { data: metrics, isLoading, error, refetch, isRefetching } = useOpsDashboardMetrics()

  // Calculate percentages for progress bars
  const taskCompletionRate = useMemo(() => {
    if (!metrics?.tasks.totalAssigned) return 0
    return Math.round((metrics.tasks.completed / metrics.tasks.totalAssigned) * 100)
  }, [metrics])

  const kycApprovalRate = useMemo(() => {
    if (!metrics) return 0
    const total = metrics.kyc.pending + metrics.kyc.underReview + metrics.kyc.approved + metrics.kyc.rejected
    if (total === 0) return 0
    return Math.round((metrics.kyc.approved / total) * 100)
  }, [metrics])

  const disputeResolutionRate = useMemo(() => {
    if (!metrics) return 0
    const total = metrics.disputes.open + metrics.disputes.investigating + metrics.disputes.resolved
    if (total === 0) return 0
    return Math.round((metrics.disputes.resolved / total) * 100)
  }, [metrics])

  if (error) {
    return (
      <div className="space-y-3">
        <PageHeader title="Operations Reports" />
        <div className="flex items-center justify-between rounded-lg border bg-card p-3">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Failed to load reports. Please try again later.
          </div>
          <Button size="sm" onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    )
  }

  const statusRow = (icon: React.ReactNode, label: string, value: number, tone: StatusTone) => (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </div>
      <StatusBadge tone={tone}>{value}</StatusBadge>
    </div>
  )

  return (
    <div className="space-y-3">
      <PageHeader
        title="Operations Reports"
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
            {isRefetching ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-1 h-4 w-4" />
            )}
            Refresh
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : metrics ? (
        <>
          <StatGrid>
            <StatCard label="Active Events" value={metrics.activeEvents.total} icon={Calendar} />
            <StatCard
              label="Task Completion"
              value={`${taskCompletionRate}%`}
              icon={CheckCircle}
              accent="text-green-600"
              hint={`${metrics.tasks.completed} of ${metrics.tasks.totalAssigned} tasks`}
            />
            <StatCard
              label="Overdue Tasks"
              value={metrics.tasks.overdue}
              icon={AlertTriangle}
              accent="text-red-600"
              hint={
                metrics.tasks.overdue > 0 ? (
                  <Link href="/ops/tasks?status=overdue" className="text-primary hover:underline">
                    View overdue tasks
                  </Link>
                ) : undefined
              }
            />
            <StatCard
              label="KYC Approval Rate"
              value={`${kycApprovalRate}%`}
              icon={ShieldCheck}
              accent="text-blue-600"
              hint={`${metrics.kyc.approved} approved vendors`}
            />
          </StatGrid>

          {/* Event Status Breakdown */}
          <Card>
            <CardHeader className="p-3 pb-0">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4" />
                Event Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              {Object.keys(metrics.activeEvents.byStatus).length === 0 ? (
                <p className="text-muted-foreground text-center py-3 text-sm">No events to display</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(metrics.activeEvents.byStatus)
                    .sort((a, b) => b[1] - a[1])
                    .map(([status, count]) => {
                      const percentage = Math.round((count / metrics.activeEvents.total) * 100)
                      return (
                        <div key={status} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full ${getEventStatusColor(status)}`} />
                              <span>{formatStatusLabel(status)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{count}</span>
                              <span className="text-muted-foreground">({percentage}%)</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getEventStatusColor(status)} transition-all`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-3 md:grid-cols-2">
            {/* KYC Status */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between p-3 pb-0">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  KYC Status
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
                  <Link href="/ops/kyc">
                    View records <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-2 p-3">
                {statusRow(<Clock className="h-4 w-4 text-yellow-500" />, 'Pending', metrics.kyc.pending, 'warning')}
                {statusRow(<FileText className="h-4 w-4 text-blue-500" />, 'Under Review', metrics.kyc.underReview, 'info')}
                {statusRow(<CheckCircle className="h-4 w-4 text-green-500" />, 'Approved', metrics.kyc.approved, 'success')}
                {statusRow(<XCircle className="h-4 w-4 text-red-500" />, 'Rejected', metrics.kyc.rejected, 'danger')}
              </CardContent>
            </Card>

            {/* Disputes */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between p-3 pb-0">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Scale className="h-4 w-4" />
                  Dispute Resolution ({disputeResolutionRate}%)
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
                  <Link href="/ops/disputes">
                    View all <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-2 p-3">
                {statusRow(<AlertTriangle className="h-4 w-4 text-red-500" />, 'Open', metrics.disputes.open, 'danger')}
                {statusRow(<FileText className="h-4 w-4 text-orange-500" />, 'Investigating', metrics.disputes.investigating, 'warning')}
                {statusRow(<CheckCircle className="h-4 w-4 text-green-500" />, 'Resolved', metrics.disputes.resolved, 'success')}
                <Progress value={disputeResolutionRate} className="h-2" />
              </CardContent>
            </Card>
          </div>

          {/* Task Performance */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-3 pb-0">
              <CardTitle className="flex items-center gap-2 text-sm">
                <ClipboardList className="h-4 w-4" />
                Task Performance
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-7 px-2 text-xs" asChild>
                  <Link href="/ops/tasks">View All Tasks</Link>
                </Button>
                <Button size="sm" className="h-7 px-2 text-xs" asChild>
                  <Link href="/ops/tasks?status=PENDING">Pending Tasks</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-3">
              <StatGrid className="grid-cols-3 lg:grid-cols-3">
                <StatCard label="Total Tasks" value={metrics.tasks.totalAssigned} accent="text-primary" />
                <StatCard label="Completed" value={metrics.tasks.completed} accent="text-green-600" />
                <StatCard label="Overdue" value={metrics.tasks.overdue} accent="text-red-600" />
              </StatGrid>
              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium">Completion Progress</span>
                  <span className="text-muted-foreground">
                    {taskCompletionRate}% -{' '}
                    {metrics.tasks.totalAssigned - metrics.tasks.completed - metrics.tasks.overdue} in progress
                  </span>
                </div>
                <Progress value={taskCompletionRate} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/ops/events">
                <Calendar className="mr-1 h-4 w-4" />
                Active Events
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/ops/leads">
                <TrendingUp className="mr-1 h-4 w-4" />
                Leads
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/ops/vendors">
                <Users className="mr-1 h-4 w-4" />
                Vendors
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/ops/invoices">
                <FileText className="mr-1 h-4 w-4" />
                Invoices
              </Link>
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-6">
          <p className="text-muted-foreground">No report data available</p>
        </div>
      )}
    </div>
  )
}
