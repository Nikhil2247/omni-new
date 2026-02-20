'use client'

import Link from 'next/link'
import {
  Activity,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  Database,
  HardDrive,
  LayoutDashboard,
  Server,
  Settings,
  Shield,
  Store,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import { useAdminAudit, useAdminDashboard } from '@/hooks/queries/use-admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MetricCard } from '@/components/charts'
import { cn } from '@/lib/utils'

export default function SystemDashboardPage() {
  const { data, isLoading } = useAdminDashboard()
  const { data: auditData, isLoading: auditLoading } = useAdminAudit({ page: 1, limit: 5 })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!data) {
    return <div className="text-sm text-destructive">Unable to load system dashboard.</div>
  }

  const healthPercent = normalizeHealthPercent(data.overview.platformHealth)

  // Simulated system health metrics (in a real app, these would come from an API)
  const systemServices = [
    { name: 'Database', status: 'healthy', latency: 12, icon: Database },
    { name: 'Cache', status: 'healthy', latency: 2, icon: HardDrive },
    { name: 'Queue', status: 'healthy', latency: 8, icon: Zap },
    { name: 'Search', status: 'healthy', latency: 45, icon: Activity },
    { name: 'Storage', status: 'healthy', latency: 23, icon: Server },
  ]

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8">
        <div className="absolute right-0 top-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -mb-32 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20">
              <LayoutDashboard className="h-7 w-7 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">System Dashboard</h1>
                <Badge
                  variant={healthPercent >= 90 ? 'default' : healthPercent >= 75 ? 'secondary' : 'destructive'}
                  className="gap-1"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  {healthPercent >= 90 ? 'All Systems Operational' : healthPercent >= 75 ? 'Minor Issues' : 'Degraded'}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Full platform visibility and operations management
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href="/system/config">
              <Settings className="mr-2 h-4 w-4" />
              System Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Platform Stats & Health */}
      <div className="grid gap-6 lg:grid-cols-3">
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
              <div className="mt-4 grid w-full grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-lg font-bold">{data.userMetrics.dau}</p>
                  <p className="text-xs text-muted-foreground">DAU</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-lg font-bold">{data.userMetrics.wau}</p>
                  <p className="text-xs text-muted-foreground">WAU</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
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
          <CardContent className="space-y-4">
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
          <CardContent className="space-y-4">
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
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg Vendor Score</span>
                <span className="text-lg font-bold">{data.vendorMetrics.avgPerformanceScore.toFixed(1)}</span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-muted">
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <QuickLink href="/system/users" icon={Users} label="Manage Users" description="View and manage all users" />
            <QuickLink href="/system/roles" icon={Shield} label="Roles & Permissions" description="Configure access control" />
            <QuickLink href="/system/audit" icon={Clock} label="Audit Activity" description="Review system logs" />
            <QuickLink href="/system/config" icon={Settings} label="Configuration" description="System settings" />
          </div>
        </CardContent>
      </Card>

      {/* Recent Audit Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Audit Activity</CardTitle>
            <p className="text-sm text-muted-foreground">Latest system events and user actions</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/system/audit">
              View All
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {auditLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : auditData?.data?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditData.data.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{log.entityType}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.userId || 'System'}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {formatDateTime(log.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Activity className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">No audit events found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ServiceHealthCard({
  service,
}: {
  service: { name: string; status: string; latency: number; icon: React.ElementType }
}) {
  const Icon = service.icon
  const isHealthy = service.status === 'healthy'

  return (
    <Card className={cn('transition-all', !isHealthy && 'border-destructive/50')}>
      <CardContent className="flex items-center gap-4 p-4">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl',
            isHealthy ? 'bg-green-500/10' : 'bg-destructive/10'
          )}
        >
          <Icon className={cn('h-5 w-5', isHealthy ? 'text-green-600' : 'text-destructive')} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{service.name}</p>
            <Badge
              variant={isHealthy ? 'default' : 'destructive'}
              className="h-5 px-1.5 text-xs"
            >
              {isHealthy ? 'OK' : 'Error'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{service.latency}ms latency</p>
        </div>
      </CardContent>
    </Card>
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
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg',
            `bg-${color}/10`
          )}
          style={{ backgroundColor: `hsl(var(--${color}) / 0.1)` }}
        >
          <Icon className="h-4 w-4" style={{ color: `hsl(var(--${color}))` }} />
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
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">{value.toFixed(1)}%</span>
          <Badge variant={isAboveTarget ? 'default' : 'secondary'} className="text-xs">
            Target: {target}%
          </Badge>
        </div>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-muted">
        <div
          className={cn(
            'h-2 rounded-full transition-all',
            isAboveTarget ? 'bg-green-500' : 'bg-amber-500'
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
  description,
}: {
  href: string
  icon: React.ElementType
  label: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border p-4 transition-all hover:border-primary/50 hover:bg-primary/5"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-all group-hover:bg-primary/20">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div className="flex-1">
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <ArrowUpRight className="h-5 w-5 text-muted-foreground opacity-0 transition-all group-hover:opacity-100" />
    </Link>
  )
}

function HealthRing({ value }: { value: number }) {
  const radius = 60
  const stroke = 10
  const normalizedRadius = radius - stroke / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (value / 100) * circumference

  const getColor = (val: number) => {
    if (val >= 90) return 'hsl(142 76% 36%)'
    if (val >= 75) return 'hsl(47 96% 53%)'
    return 'hsl(351 84% 48%)'
  }

  return (
    <div className="relative">
      <svg height={radius * 2} width={radius * 2}>
        <circle
          stroke="hsl(var(--muted))"
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
        <span className="text-2xl font-bold">{value}%</span>
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
