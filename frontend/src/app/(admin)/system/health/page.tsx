'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSystemHealth } from '@/hooks/queries/use-admin'
import { useUmami } from '@/hooks/use-umami'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { PageHeader, StatusBadge as DashStatusBadge } from '@/components/dash'
import {
  Database,
  HardDrive,
  Search,
  Server,
  Zap,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Activity,
  Gauge,
  Wifi,
  WifiOff,
  MemoryStick,
  HardDriveIcon,
} from 'lucide-react'

const SERVICE_ICONS: Record<string, React.ElementType> = {
  database: Database,
  cache: Zap,
  search: Search,
  storage: HardDrive,
  jobs: Server,
  queue: Server,
}

const SERVICE_LABELS: Record<string, string> = {
  database: 'PostgreSQL',
  cache: 'Dragonfly Cache',
  search: 'Meilisearch',
  storage: 'MinIO Storage',
  jobs: 'BullMQ Jobs',
  queue: 'BullMQ Jobs',
}

// Circular Progress / Speedometer Component
function CircularProgress({
  value,
  size = 80,
  strokeWidth = 7,
  label,
  sublabel,
}: {
  value: number
  size?: number
  strokeWidth?: number
  label: string
  sublabel?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  const getColor = (val: number) => {
    if (val >= 50) return { text: 'text-foreground', stroke: 'var(--primary)' }
    return { text: 'text-destructive', stroke: 'var(--destructive)' }
  }

  const colors = getColor(value)

  return (
    <Card className="flex flex-col items-center p-3">
      <p className="mb-1 text-sm font-medium text-muted-foreground">{label}</p>
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            className="text-muted/30"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            stroke={colors.stroke}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-xl font-bold', colors.text)}>{value}%</span>
        </div>
      </div>
      {sublabel && <p className="mt-1 text-xs text-muted-foreground text-center">{sublabel}</p>}
    </Card>
  )
}

export default function SystemHealthPage() {
  const { data, isLoading, refetch, isFetching, dataUpdatedAt } = useSystemHealth()
  const { track } = useUmami()
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    track('system:health:page_view', { section: 'system_health_monitor' })
  }, [track])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => refetch(), 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, refetch])

  useEffect(() => {
    if (dataUpdatedAt) {
      setLastUpdate(new Date(dataUpdatedAt))
    }
  }, [dataUpdatedAt])

  const parsedData = useMemo(() => {
    if (!data) return null

    let services: Record<string, { status: string; latency?: number; latencyMs?: number; error?: string; details?: unknown }>

    if (data.services) {
      services = data.services
    } else if (data.checks) {
      services = {
        database: data.checks.database || { status: 'unknown' },
        cache: data.checks.cache || { status: 'unknown' },
        queue: data.checks.queue || { status: 'unknown' },
        search: data.checks.search || { status: 'unknown' },
        storage: data.checks.storage || { status: 'unknown' },
      }
    } else {
      services = {
        database: { status: 'unknown' },
        cache: { status: 'unknown' },
        queue: { status: 'unknown' },
        search: { status: 'unknown' },
        storage: { status: 'unknown' },
      }
    }

    const uptime = data.uptime || data.resources?.uptimeSeconds || 0
    const version = data.version || process.env.NEXT_PUBLIC_APP_VERSION || '2.0.0'
    const memory = data.resources?.memory || null
    const memoryUsedPercent = memory ? Math.round((memory.heapUsed / memory.heapTotal) * 100) : 0

    return { services, uptime, version, memory, memoryUsedPercent, timestamp: data.timestamp }
  }, [data])

  if (isLoading) return <HealthSkeleton />

  if (!data || !parsedData) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-6">
        <WifiOff className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium text-destructive">Unable to load health metrics</p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    )
  }

  const { services, uptime, version, memory, memoryUsedPercent } = parsedData
  const overallStatus = normalizeStatus(data.status)
  const healthyCount = Object.values(services).filter((s) => normalizeStatus(s.status) === 'healthy').length
  const totalServices = Object.keys(services).length
  const healthPercent = Math.round((healthyCount / totalServices) * 100)

  const latencies = Object.values(services).map((s: any) => s.latency || s.latencyMs || 0).filter((l) => l > 0)
  const avgLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0

  return (
    <div className="space-y-3">
      <PageHeader
        title="System Health"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={cn(autoRefresh && 'border-primary text-primary')}
            >
              <Activity className={cn('mr-2 h-4 w-4', autoRefresh && 'animate-pulse')} />
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn('mr-2 h-4 w-4', isFetching && 'animate-spin')} />
              Refresh
            </Button>
          </>
        }
      />

      {/* Overall Status Banner */}
      <Card>
        <CardContent className="flex flex-col items-center justify-between gap-3 py-3 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              {overallStatus === 'healthy' && <CheckCircle2 className="h-5 w-5" />}
              {overallStatus === 'degraded' && <AlertCircle className="h-5 w-5" />}
              {overallStatus === 'error' && <XCircle className="h-5 w-5" />}
              {overallStatus === 'unknown' && <AlertCircle className="h-5 w-5 text-muted-foreground" />}
            </div>
            <div className="space-y-1">
              <StatusBadge status={overallStatus} />
              <p className="text-sm text-muted-foreground">{healthyCount} of {totalServices} services operational</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className={cn('tabular text-2xl font-semibold', healthPercent < 50 && 'text-destructive')}>{healthPercent}%</p>
              <p className="text-xs text-muted-foreground">Health Score</p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="text-center">
              <p className="text-lg font-semibold">{formatUptime(uptime)}</p>
              <p className="text-xs text-muted-foreground">Uptime</p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="text-center">
              <p className="text-lg font-semibold">v{version}</p>
              <p className="text-xs text-muted-foreground">Version</p>
            </div>
            {avgLatency > 0 && (
              <>
                <div className="h-10 w-px bg-border" />
                <div className="text-center">
                  <p className={cn('tabular text-lg font-semibold', avgLatency >= 200 && 'text-destructive')}>{avgLatency}ms</p>
                  <p className="text-xs text-muted-foreground">Avg Latency</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Circular Progress Indicators */}
      <div className="grid gap-3 md:grid-cols-3">
        <CircularProgress
          value={healthPercent}
          label="Health Score"
          sublabel={`${healthyCount} / ${totalServices} services`}
        />
        <CircularProgress
          value={memoryUsedPercent || 0}
          label="Memory Usage"
          sublabel={memory ? `${formatBytes(memory.heapUsed)} / ${formatBytes(memory.heapTotal)}` : 'N/A'}
        />
        <CircularProgress
          value={Math.min(Math.round((uptime / 86400) * 100), 100)}
          label="Uptime Score"
          sublabel={formatUptime(uptime)}
        />
      </div>

      {/* Service Status Cards */}
      <div>
        <h3 className="mb-2 text-sm font-semibold">Infrastructure Services</h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(services).map(([key, service]) => {
            const Icon = SERVICE_ICONS[key] || Server
            const label = SERVICE_LABELS[key] || key
            const status = normalizeStatus(service.status)
            const latency = (service as any).latency || (service as any).latencyMs

            return (
              <Card key={key}>
                <CardContent className="pt-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{label}</h3>
                      </div>
                    </div>
                    <StatusBadge status={status} />
                  </div>

                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Latency</span>
                      <span className={cn(
                        'font-mono font-medium',
                        !latency && 'text-muted-foreground',
                        latency && latency >= 200 && 'text-destructive'
                      )}>
                        {latency ? `${latency}ms` : 'N/A'}
                      </span>
                    </div>
                    {(service as any)?.details?.connected !== undefined && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Connected</span>
                        <span className="flex items-center gap-1">
                          {(service as any).details.connected ? (
                            <><Wifi className="h-3 w-3" /><span>Yes</span></>
                          ) : (
                            <><WifiOff className="h-3 w-3 text-destructive" /><span className="text-destructive">No</span></>
                          )}
                        </span>
                      </div>
                    )}
                    {(service as any)?.error && (
                      <div className="mt-2 rounded bg-destructive/10 p-2 text-xs text-destructive">
                        {(service as any).error}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Latency & System Info */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Response Latency
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(services).map(([key, service]) => {
              const latency = (service as any).latency || (service as any).latencyMs || 0
              const label = SERVICE_LABELS[key] || key
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{label}</span>
                    <span className={cn(
                      'font-mono font-medium',
                      latency === 0 && 'text-muted-foreground',
                      latency >= 200 && 'text-destructive'
                    )}>
                      {latency > 0 ? `${latency}ms` : 'N/A'}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        'h-full transition-all duration-500',
                        latency === 0 && 'bg-muted-foreground/30',
                        latency > 0 && latency < 200 && 'bg-primary',
                        latency >= 200 && 'bg-destructive'
                      )}
                      style={{ width: latency > 0 ? `${Math.min((latency / 500) * 100, 100)}%` : '5%' }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Status" value={
<StatusBadge status={overallStatus} />
            } />
            <InfoRow label="Timestamp" value={parsedData.timestamp ? formatTimestamp(parsedData.timestamp) : 'N/A'} />
            <InfoRow label="Version" value={`v${version}`} />
            <InfoRow label="Uptime" value={formatUptime(uptime)} />
            {lastUpdate && <InfoRow label="Last Refresh" value={formatTimestamp(lastUpdate.toISOString())} />}
            {data.resources && (
              <>
                <div className="my-3 border-t" />
                <InfoRow label="Node Version" value={data.resources.nodeVersion || 'N/A'} />
                <InfoRow label="Platform" value={data.resources.platform || 'N/A'} />
                <InfoRow label="Environment" value={data.resources.environment || 'development'} />
                {data.resources.pid && <InfoRow label="Process ID" value={String(data.resources.pid)} />}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Memory Usage */}
      {memory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MemoryStick className="h-5 w-5" />
              Memory Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              <MemoryCard label="RSS" value={memory.rss} percent={65} description="Resident Set Size" icon={<Server className="h-4 w-4" />} />
              <MemoryCard label="Heap Used" value={memory.heapUsed} percent={memoryUsedPercent} description="Active heap memory" icon={<Activity className="h-4 w-4" />} />
              <MemoryCard label="Heap Total" value={memory.heapTotal} percent={80} description="Total heap allocated" icon={<Database className="h-4 w-4" />} />
              <MemoryCard label="External" value={memory.external} percent={30} description="C++ objects bound" icon={<HardDriveIcon className="h-4 w-4" />} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: 'healthy' | 'degraded' | 'error' | 'unknown' }) {
  return (
    <DashStatusBadge tone={status === 'healthy' ? 'success' : status === 'degraded' ? 'warning' : status === 'error' ? 'destructive' : 'muted'} className="capitalize">
      {status}
    </DashStatusBadge>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function MemoryCard({ label, value, percent, description, icon }: {
  label: string; value: number; percent: number; description: string; icon: React.ReactNode
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="mb-1 flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-lg font-bold">{formatBytes(value)}</p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn(
          'h-full',
          percent < 75 && 'bg-primary',
          percent >= 75 && 'bg-destructive'
        )} style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  )
}

function HealthSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-16 w-full" />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
    </div>
  )
}

function normalizeStatus(status: string | undefined): 'healthy' | 'degraded' | 'error' | 'unknown' {
  if (!status) return 'unknown'
  const s = status.toLowerCase()
  if (['healthy', 'ok', 'up', 'connected', 'available'].includes(s)) return 'healthy'
  if (['degraded', 'warning', 'slow'].includes(s)) return 'degraded'
  if (['error', 'down', 'failed', 'not_configured', 'unavailable'].includes(s)) return 'error'
  return 'unknown'
}

function formatUptime(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const parts = []
  if (d > 0) parts.push(`${d}d`)
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${m}m`)
  if (s > 0 && d === 0) parts.push(`${s}s`)
  return parts.join(' ') || '0s'
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

function formatTimestamp(timestamp: string): string {
  if (!timestamp) return 'N/A'
  try {
    return new Date(timestamp).toLocaleString()
  } catch {
    return timestamp
  }
}
