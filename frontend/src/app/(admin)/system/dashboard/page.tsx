'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { trackDashboard } from '@/lib/analytics/umami'
import { Activity, Calendar, Clock, Gauge, Settings, Shield, Store, TrendingUp, Users } from 'lucide-react'
import { useAdminAudit, useAdminDashboard } from '@/hooks/queries/use-admin'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DashboardHero,
  KpiCard,
  KpiGrid,
  ListRow,
  ListStack,
  Panel,
  PanelEmpty,
  QuickActionTile,
  StatusBadge,
  WidgetBoard,
  type BoardWidget,
} from '@/components/dash'

export default function SystemDashboardPage() {
  const { data, isLoading } = useAdminDashboard()
  const { data: auditData, isLoading: auditLoading } = useAdminAudit({ page: 1, limit: 5 })

  useEffect(() => {
    trackDashboard.view('system')
  }, [])

  const healthPercent = data ? normalizeHealthPercent(data.overview.platformHealth) : 0
  const healthTone = healthPercent >= 90 ? 'success' : healthPercent >= 75 ? 'warning' : 'destructive'
  const healthLabel = healthPercent >= 90 ? 'All systems operational' : healthPercent >= 75 ? 'Minor issues' : 'Degraded'

  const widgets: BoardWidget[] = useMemo(() => {
    if (!data) return []
    return [
      {
        id: 'platform-health',
        title: 'Platform health',
        span: 4,
        content: (
          <Panel title="Platform health" icon={Gauge} headerRight={<StatusBadge tone={healthTone}>{healthPercent}%</StatusBadge>}>
            <div className="flex flex-col items-center gap-3">
              <HealthRing value={healthPercent} />
              <div className="grid w-full grid-cols-3 gap-2 text-center">
                {[
                  ['DAU', data.userMetrics.dau],
                  ['WAU', data.userMetrics.wau],
                  ['MAU', data.userMetrics.mau],
                ].map(([label, value]) => (
                  <div key={label} className="bg-muted/40 rounded-lg p-2">
                    <p className="tabular text-base font-semibold">{Number(value).toLocaleString()}</p>
                    <p className="text-muted-foreground text-xs">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        ),
      },
      {
        id: 'engagement',
        title: 'Engagement metrics',
        span: 4,
        content: (
          <Panel title="Engagement metrics" icon={Activity}>
            <div className="space-y-4">
              <MeterRow label="DAU/WAU ratio" value={data.userMetrics.dauWauRatio * 100} suffix="%" target={30} />
              <MeterRow label="DAU/MAU ratio" value={data.userMetrics.dauMauRatio * 100} suffix="%" target={20} />
              <MeterRow label="Avg vendor score" value={data.vendorMetrics.avgPerformanceScore} max={10} />
            </div>
          </Panel>
        ),
      },
      {
        id: 'quick-operations',
        title: 'Quick operations',
        span: 4,
        content: (
          <Panel title="Quick operations" icon={Settings}>
            <div className="space-y-2">
              <QuickActionTile href="/system/users" icon={Users} label="Manage users" hint="Accounts and access" />
              <QuickActionTile href="/system/roles" icon={Shield} label="Roles & permissions" hint="Who can do what" />
              <QuickActionTile href="/system/audit" icon={Clock} label="Audit activity" hint="Review recent changes" />
              <QuickActionTile href="/system/config" icon={Settings} label="Configuration" hint="Platform settings" />
            </div>
          </Panel>
        ),
      },
      {
        id: 'recent-audit',
        title: 'Recent audit activity',
        span: 12,
        content: (
          <Panel title="Recent audit activity" icon={Clock} action={{ label: 'View all', href: '/system/audit' }}>
            {auditLoading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : auditData?.data?.length ? (
              <ListStack>
                {auditData.data.map((log) => (
                  <ListRow
                    key={log.id}
                    icon={Activity}
                    title={<span className="font-mono text-xs">{log.action}</span>}
                    meta={`${log.userId || 'System'} · ${formatDateTime(log.createdAt)}`}
                    trailing={<StatusBadge tone="neutral">{log.entityType}</StatusBadge>}
                  />
                ))}
              </ListStack>
            ) : (
              <PanelEmpty icon={Activity}>No audit events found.</PanelEmpty>
            )}
          </Panel>
        ),
      },
    ]
  }, [data, healthPercent, healthTone, auditData, auditLoading])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!data) {
    return <div className="text-destructive text-sm">Unable to load system dashboard.</div>
  }

  return (
    <div className="space-y-4">
      <DashboardHero
        eyebrow="System"
        title="System dashboard"
        subtitle="Platform health, usage and recent administrative activity."
        actions={
          <Button asChild size="sm">
            <Link href="/system/config">
              <Settings className="size-3.5" /> System settings
            </Link>
          </Button>
        }
        aside={
          <div className="bg-muted/40 flex items-center gap-2 rounded-lg border px-3 py-2">
            <StatusBadge tone={healthTone}>{healthLabel}</StatusBadge>
            <span className="tabular text-sm font-semibold">{healthPercent}%</span>
          </div>
        }
      />

      <KpiGrid>
        <KpiCard label="Total users" value={data.overview.totalUsers.toLocaleString()} icon={Users} href="/system/users" />
        <KpiCard label="Active vendors" value={data.overview.totalVendors.toLocaleString()} icon={Store} href="/system/vendors" />
        <KpiCard label="Active events" value={data.overview.totalEvents.toLocaleString()} icon={Calendar} />
        <KpiCard label="Conversion rate" value={`${Math.round(data.overview.avgConversionRate * 100)}%`} icon={TrendingUp} />
      </KpiGrid>

      <WidgetBoard storageKey="system-dashboard" widgets={widgets} />
    </div>
  )
}

function MeterRow({
  label,
  value,
  target,
  suffix = '',
  max = 100,
}: {
  label: string
  value: number
  target?: number
  suffix?: string
  max?: number
}) {
  const pct = Math.max(0, Math.min((value / max) * 100, 100))
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-muted-foreground text-sm">{label}</span>
        <span className="tabular text-sm font-semibold">
          {value.toFixed(1)}
          {suffix}
          {target !== undefined ? <span className="text-muted-foreground ml-2 text-xs font-normal">target {target}%</span> : null}
        </span>
      </div>
      <div className="bg-muted relative h-2 w-full rounded-full">
        <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
        {target !== undefined ? (
          <span className="bg-foreground/50 absolute -top-0.5 h-3 w-px" style={{ left: `${Math.min(target, 100)}%` }} aria-hidden />
        ) : null}
      </div>
    </div>
  )
}

function HealthRing({ value }: { value: number }) {
  const radius = 56
  const stroke = 10
  const normalizedRadius = radius - stroke / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (Math.min(value, 100) / 100) * circumference

  return (
    <div className="relative" role="img" aria-label={`Platform health ${value}%`}>
      <svg height={radius * 2} width={radius * 2}>
        <circle stroke="var(--muted)" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
        <circle
          stroke="var(--primary)"
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
        <span className="tabular text-2xl font-semibold">{value}%</span>
        <span className="text-muted-foreground text-xs">Health</span>
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
