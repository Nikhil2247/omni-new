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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useOpsDashboardMetrics } from '@/hooks/queries/use-ops-dashboard'

interface StatusItem {
  label: string
  value: number
  color: string
  icon: React.ReactNode
}

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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-lg font-semibold">Failed to load reports</h3>
          <p className="text-muted-foreground">Please try again later</p>
          <Button onClick={() => refetch()} className="mt-4">Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Operations Reports</h1>
          <p className="text-muted-foreground">Comprehensive overview of operational performance and metrics</p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          {isRefetching ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : metrics ? (
        <>
          {/* Key Metrics Row */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Events</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.activeEvents.total}</div>
                <p className="text-xs text-muted-foreground">
                  Total events being managed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{taskCompletionRate}%</div>
                <Progress value={taskCompletionRate} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {metrics.tasks.completed} of {metrics.tasks.totalAssigned} tasks completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{metrics.tasks.overdue}</div>
                <p className="text-xs text-muted-foreground">
                  Tasks past due date
                </p>
                {metrics.tasks.overdue > 0 && (
                  <Button variant="link" className="p-0 h-auto mt-1" asChild>
                    <Link href="/ops/tasks?status=overdue">
                      View overdue tasks <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">KYC Approval Rate</CardTitle>
                <ShieldCheck className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kycApprovalRate}%</div>
                <Progress value={kycApprovalRate} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {metrics.kyc.approved} approved vendors
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Event Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Event Status Breakdown
              </CardTitle>
              <CardDescription>
                Distribution of events across different stages
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(metrics.activeEvents.byStatus).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No events to display</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(metrics.activeEvents.byStatus)
                    .sort((a, b) => b[1] - a[1])
                    .map(([status, count]) => {
                      const percentage = Math.round((count / metrics.activeEvents.total) * 100)
                      return (
                        <div key={status} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${getEventStatusColor(status)}`} />
                              <span>{formatStatusLabel(status)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{count}</span>
                              <span className="text-muted-foreground">({percentage}%)</span>
                            </div>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
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

          {/* KYC and Disputes Row */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* KYC Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  KYC Status
                </CardTitle>
                <CardDescription>
                  Vendor verification overview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <span>Pending</span>
                    </div>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      {metrics.kyc.pending}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span>Under Review</span>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {metrics.kyc.underReview}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Approved</span>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {metrics.kyc.approved}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span>Rejected</span>
                    </div>
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      {metrics.kyc.rejected}
                    </Badge>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/ops/kyc">
                      View KYC Records <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Disputes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  Dispute Resolution
                </CardTitle>
                <CardDescription>
                  Resolution rate: {disputeResolutionRate}%
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span>Open</span>
                    </div>
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      {metrics.disputes.open}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-orange-500" />
                      <span>Investigating</span>
                    </div>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      {metrics.disputes.investigating}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Resolved</span>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {metrics.disputes.resolved}
                    </Badge>
                  </div>
                </div>
                <div className="mt-4">
                  <Progress value={disputeResolutionRate} className="h-3" />
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/ops/disputes">
                      View All Disputes <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Task Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Task Performance
              </CardTitle>
              <CardDescription>
                Overview of operational task metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="text-center p-4 rounded-lg border">
                  <div className="text-3xl font-bold text-primary">{metrics.tasks.totalAssigned}</div>
                  <p className="text-sm text-muted-foreground mt-1">Total Tasks</p>
                </div>
                <div className="text-center p-4 rounded-lg border bg-green-50">
                  <div className="text-3xl font-bold text-green-600">{metrics.tasks.completed}</div>
                  <p className="text-sm text-green-700 mt-1">Completed</p>
                </div>
                <div className="text-center p-4 rounded-lg border bg-red-50">
                  <div className="text-3xl font-bold text-red-600">{metrics.tasks.overdue}</div>
                  <p className="text-sm text-red-700 mt-1">Overdue</p>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Completion Progress</span>
                  <span className="text-sm text-muted-foreground">{taskCompletionRate}%</span>
                </div>
                <Progress value={taskCompletionRate} className="h-3" />
                <p className="text-xs text-muted-foreground mt-2">
                  {metrics.tasks.totalAssigned - metrics.tasks.completed - metrics.tasks.overdue} tasks in progress
                </p>
              </div>

              <div className="mt-4 pt-4 border-t flex gap-2">
                <Button variant="outline" className="flex-1" asChild>
                  <Link href="/ops/tasks">
                    View All Tasks
                  </Link>
                </Button>
                <Button variant="default" className="flex-1" asChild>
                  <Link href="/ops/tasks?status=PENDING">
                    Pending Tasks
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Navigate to commonly used sections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                  <Link href="/ops/events">
                    <Calendar className="h-5 w-5" />
                    <span>Active Events</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                  <Link href="/ops/leads">
                    <TrendingUp className="h-5 w-5" />
                    <span>Leads</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                  <Link href="/ops/vendors">
                    <Users className="h-5 w-5" />
                    <span>Vendors</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                  <Link href="/ops/invoices">
                    <FileText className="h-5 w-5" />
                    <span>Invoices</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No report data available</p>
        </div>
      )}
    </div>
  )
}
