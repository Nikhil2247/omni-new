'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { trackDashboard } from '@/lib/analytics/umami'
import {
  Activity,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  Settings,
  Shield,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useAdminAudit, useAdminDashboard } from '@/hooks/queries/use-admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable, PageHeader, StatusBadge, type DataColumn } from '@/components/dash'
import { cn } from '@/lib/utils'

export default function SystemDashboardPage() {
  const { data, isLoading } = useAdminDashboard()
  const { data: auditData, isLoading: auditLoading } = useAdminAudit({ page: 1, limit: 5 })

  useEffect(() => {
    trackDashboard.view('system')
  }, [])

  const auditColumns: DataColumn<NonNullable<typeof auditData>['data'][number]>[] = [
    {
      id: 'action',
      header: 'Action',
      label: 'Action',
      cell: (log) => <span className="font-mono text-xs">{log.action}</span>,
      exportValue: (log) => log.action,
    },
    {
      id: 'entity',
      header: 'Entity',
      label: 'Entity',
      cell: (log) => <StatusBadge tone="neutral">{log.entityType}</StatusBadge>,
      exportValue: (log) => log.entityType,
    },
    {
      id: 'user',
      header: 'User',
      label: 'User',
      cell: (log) => <span className="text-muted-foreground">{log.userId || 'System'}</span>,
      exportValue: (log) => log.userId || 'System',
    },
    {
      id: 'time',
      header: 'Time',
      label: 'Time',
      align: 'right',
      cell: (log) => <span className="text-sm text-muted-foreground">{formatDateTime(log.createdAt)}</span>,
      exportValue: (log) => formatDateTime(log.createdAt),
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-3 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
        <Skeleton className="h-48" />
      </div>
    )
  }

  if (!data) {
    return <div className="text-sm text-destructive">Unable to load system dashboard.</div>
  }

  const healthPercent = normalizeHealthPercent(data.overview.platformHealth)

  return (
    <div className="space-y-3">
      <PageHeader
        title="System Dashboard"
        leading={
          <Badge
            variant={healthPercent >= 90 ? 'default' : healthPercent >= 75 ? 'secondary' : 'destructive'}
            className="order-last gap-1"
          >
            <CheckCircle2 className="h-3 w-3" />
            {healthPercent >= 90 ? 'All Systems Operational' : healthPercent >= 75 ? 'Minor Issues' : 'Degraded'}
          </Badge>
        }
        actions={
          <Button asChild size="sm">
            <Link href="/system/config">
              <Settings className="mr-2 h-4 w-4" />
              System Settings
            </Link>
          </Button>
        }
      />

      {/* Platform Stats & Health */}
      <div className="grid gap-3 lg:grid-cols-3">
        {/* Platform Health Ring */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Platform Health</CardTitle>
              <Badge variant={healthPercent >= 90 ? 'default' : healthPercent >= 75 ? 'secondary' : 'destructive'}>
                {healthPercent}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <HealthRing value={healthPercent} />
              <div className="mt-2 grid w-full grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-muted/50 p-1.5">
                  <p className="text-lg font-bold">{data.userMetrics.dau}</p>
                  <p className="text-xs text-muted-foreground">DAU</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-1.5">
                  <p className="text-lg font-bold">{data.userMetrics.wau}</p>
                  <p className="text-xs text-muted-foreground">WAU</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-1.5">
                  <p className="text-lg font-bold">{data.userMetrics.mau}</p>
                  <p className="text-xs text-muted-foreground">MAU</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <QuickStat
              label="Total Users"
              value={data.overview.totalUsers.toLocaleString()}
              icon={Users}
              color="primary"
            />
            <QuickStat
              label="Active Vendors"
              value={data.overview.totalVendors.toLocaleString()}
              icon={Store}
              color="chart-2"
            />
            <QuickStat
              label="Active Events"
              value={data.overview.totalEvents.toLocaleString()}
              icon={Calendar}
              color="chart-3"
            />
            <QuickStat
              label="Conversion Rate"
              value={`${Math.round(data.overview.avgConversionRate * 100)}%`}
              icon={TrendingUp}
              color="chart-4"
            />
          </CardContent>
        </Card>

        {/* Engagement Ratios */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <EngagementGauge
              label="DAU/WAU Ratio"
              value={data.userMetrics.dauWauRatio * 100}
              target={30}
            />
            <EngagementGauge
              label="DAU/MAU Ratio"
              value={data.userMetrics.dauMauRatio * 100}
              target={20}
            />
            <div className="rounded-lg border p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg Vendor Score</span>
                <span className="text-lg font-bold">{data.vendorMetrics.avgPerformanceScore.toFixed(1)}</span>
              </div>
              <div className="mt-1.5 h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(data.vendorMetrics.avgPerformanceScore * 10, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Operations */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            <QuickLink href="/system/users" icon={Users} label="Manage Users" />
            <QuickLink href="/system/roles" icon={Shield} label="Roles & Permissions" />
            <QuickLink href="/system/audit" icon={Clock} label="Audit Activity" />
            <QuickLink href="/system/config" icon={Settings} label="Configuration" />
          </div>
        </CardContent>
      </Card>

      {/* Recent Audit Activity */}
      <DataTable
        data={auditData?.data}
        columns={auditColumns}
        rowKey={(log) => log.id}
        isLoading={auditLoading}
        toolbarRight={
          <Button asChild variant="outline" size="sm">
            <Link href="/system/audit">
              View All
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
        emptyTitle="No audit events found"
        emptyIcon={Activity}
      />
    </div>
  )
}

function QuickStat({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: string
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-2.5">
      <div className="flex items-center gap-3">
        <div
          className={cn('flex h-8 w-8 items-center justify-center rounded-lg', `bg-${color}/10`)}
          style={{ backgroundColor: `color-mix(in srgb, var(--${color}) 10%, transparent)` }}
        >
          <Icon className="h-4 w-4" style={{ color: `var(--${color})` }} />
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="text-lg font-bold">{value}</span>
    </div>
  )
}

function EngagementGauge({
  label,
  value,
  target,
}: {
  label: string
  value: number
  target: number
}) {
  const isAboveTarget = value >= target

  return (
    <div className="rounded-lg border p-2.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">{value.toFixed(1)}%</span>
          <Badge variant={isAboveTarget ? 'default' : 'secondary'} className="text-xs">
            Target: {target}%
          </Badge>
        </div>
      </div>
      <div className="mt-1.5 h-2 w-full rounded-full bg-muted">
        <div
          className={cn(
            'h-2 rounded-full transition-all',
            isAboveTarget ? 'bg-success' : 'bg-warning'
          )}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  )
}

function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: React.ElementType
  label: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-lg border p-2.5 transition-all hover:border-primary/50 hover:bg-primary/5"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 transition-all group-hover:bg-primary/20">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="flex-1 text-sm font-medium">{label}</p>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:opacity-100" />
    </Link>
  )
}

function HealthRing({ value }: { value: number }) {
  const radius = 48
  const stroke = 10
  const normalizedRadius = radius - stroke / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (value / 100) * circumference

  const getColor = (val: number) => {
    if (val >= 90) return 'var(--success)'
    if (val >= 75) return 'var(--warning)'
    return 'var(--destructive)'
  }

  return (
    <div className="relative">
      <svg height={radius * 2} width={radius * 2}>
        <circle
          stroke="var(--muted)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={getColor(value)}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transition-all duration-500"
          transform={`rotate(-90 ${radius} ${radius})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold">{value}%</span>
        <span className="text-xs text-muted-foreground">Health</span>
      </div>
    </div>
  )
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function normalizeHealthPercent(value: number) {
  const normalized = value <= 1 ? value * 100 : value
  return Math.round(normalized)
}
