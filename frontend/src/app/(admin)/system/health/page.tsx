'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSystemHealth } from '@/hooks/queries/use-admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
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

const SERVICE_DESCRIPTIONS: Record<string, string> = {
  database: 'Primary database connection',
  cache: 'Redis-compatible cache layer',
  search: 'Full-text search engine',
  storage: 'Object storage service',
  jobs: 'Background job processing',
  queue: 'Background job processing',
}

// Circular Progress / Speedometer Component
function CircularProgress({
  value,
  size = 100,
  strokeWidth = 8,
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
    if (val >= 80) return { text: 'text-green-500', stroke: '#22c55e' }
    if (val >= 50) return { text: 'text-yellow-500', stroke: '#eab308' }
    return { text: 'text-red-500', stroke: '#ef4444' }
  }

  const colors = getColor(value)

  return (
    <Card className="flex flex-col items-center p-4">
      <p className="mb-2 text-sm font-medium text-muted-foreground">{label}</p>
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
          <span className={cn('text-2xl font-bold', colors.text)}>{value}%</span>
        </div>
      </div>
      {sublabel && <p className="mt-2 text-xs text-muted-foreground text-center">{sublabel}</p>}
    </Card>
  )
}

export default function SystemHealthPage() {
  const { data, isLoading, refetch, isFetching, dataUpdatedAt } = useSystemHealth()
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

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
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <WifiOff className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium text-destructive">Unable to load health metrics</p>
        <p className="text-sm text-muted-foreground">Make sure the backend server is running and accessible</p>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">System Health</h1>
          <p className="text-muted-foreground">Real-time infrastructure monitoring and service status</p>
        </div>
        <div className="flex items-center gap-3">
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
        </div>
      </div>

      {/* Overall Status Banner */}
      <Card className={cn(
        'border-2',
        overallStatus === 'healthy' && 'border-green-500/50 bg-green-500/5',
        overallStatus === 'degraded' && 'border-yellow-500/50 bg-yellow-500/5',
        overallStatus === 'error' && 'border-red-500/50 bg-red-500/5',
        overallStatus === 'unknown' && 'border-gray-400/50 bg-gray-400/5'
      )}>
        <CardContent className="flex flex-col items-center justify-between gap-6 py-6 md:flex-row">
          <div className="flex items-center gap-4">
            <div className={cn(
              'flex h-14 w-14 items-center justify-center rounded-full',
              overallStatus === 'healthy' && 'bg-green-500/20',
              overallStatus === 'degraded' && 'bg-yellow-500/20',
              overallStatus === 'error' && 'bg-red-500/20',
              overallStatus === 'unknown' && 'bg-gray-400/20'
            )}>
              {overallStatus === 'healthy' && <CheckCircle2 className="h-7 w-7 text-green-500" />}
              {overallStatus === 'degraded' && <AlertCircle className="h-7 w-7 text-yellow-500" />}
              {overallStatus === 'error' && <XCircle className="h-7 w-7 text-red-500" />}
              {overallStatus === 'unknown' && <AlertCircle className="h-7 w-7 text-gray-400" />}
            </div>
            <div>
              <h2 className="text-xl font-bold capitalize">{overallStatus === 'unknown' ? 'Checking...' : overallStatus}</h2>
              <p className="text-muted-foreground">{healthyCount} of {totalServices} services operational</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className={cn(
                'text-2xl font-bold',
                healthPercent >= 80 && 'text-green-500',
                healthPercent >= 50 && healthPercent < 80 && 'text-yellow-500',
                healthPercent < 50 && 'text-red-500'
              )}>{healthPercent}%</p>
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
                  <p className={cn(
                    'text-lg font-semibold',
                    avgLatency < 50 && 'text-green-500',
                    avgLatency >= 50 && avgLatency < 200 && 'text-yellow-500',
                    avgLatency >= 200 && 'text-red-500'
                  )}>{avgLatency}ms</p>
                  <p className="text-xs text-muted-foreground">Avg Latency</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Circular Progress Indicators */}
      <div className="grid gap-4 md:grid-cols-3">
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
        <h3 className="mb-4 text-lg font-semibold">Infrastructure Services</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(services).map(([key, service]) => {
            const Icon = SERVICE_ICONS[key] || Server
            const label = SERVICE_LABELS[key] || key
            const description = SERVICE_DESCRIPTIONS[key] || ''
            const status = normalizeStatus(service.status)
            const latency = (service as any).latency || (service as any).latencyMs

            return (
              <Card key={key} className={cn(
                'transition-all hover:shadow-md',
                status === 'healthy' && 'border-l-4 border-l-green-500',
                status === 'degraded' && 'border-l-4 border-l-yellow-500',
                status === 'error' && 'border-l-4 border-l-red-500',
                status === 'unknown' && 'border-l-4 border-l-gray-400'
              )}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg',
                        status === 'healthy' && 'bg-green-500/10 text-green-600',
                        status === 'degraded' && 'bg-yellow-500/10 text-yellow-600',
                        status === 'error' && 'bg-red-500/10 text-red-600',
                        status === 'unknown' && 'bg-gray-500/10 text-gray-600'
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{label}</h3>
                        <p className="text-xs text-muted-foreground">{description}</p>
                      </div>
                    </div>
                    <StatusBadge status={status} />
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Latency</span>
                      <span className={cn(
                        'font-mono font-medium',
                        !latency && 'text-muted-foreground',
                        latency && latency < 50 && 'text-green-600',
                        latency && latency >= 50 && latency < 200 && 'text-yellow-600',
                        latency && latency >= 200 && 'text-red-600'
                      )}>
                        {latency ? `${latency}ms` : 'N/A'}
                      </span>
                    </div>
                    {(service as any)?.details?.connected !== undefined && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Connected</span>
                        <span className="flex items-center gap-1">
                          {(service as any).details.connected ? (
                            <><Wifi className="h-3 w-3 text-green-500" /><span className="text-green-600">Yes</span></>
                          ) : (
                            <><WifiOff className="h-3 w-3 text-red-500" /><span className="text-red-600">No</span></>
                          )}
                        </span>
                      </div>
                    )}
                    {(service as any)?.error && (
                      <div className="mt-2 rounded bg-red-500/10 p-2 text-xs text-red-600">
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
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Response Latency
            </CardTitle>
            <CardDescription>Service response times in milliseconds</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(services).map(([key, service]) => {
              const latency = (service as any).latency || (service as any).latencyMs || 0
              const label = SERVICE_LABELS[key] || key
              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{label}</span>
                    <span className={cn(
                      'font-mono font-medium',
                      latency === 0 && 'text-muted-foreground',
                      latency > 0 && latency < 50 && 'text-green-600',
                      latency >= 50 && latency < 200 && 'text-yellow-600',
                      latency >= 200 && 'text-red-600'
                    )}>
                      {latency > 0 ? `${latency}ms` : 'N/A'}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        'h-full transition-all duration-500',
                        latency === 0 && 'bg-muted-foreground/30',
                        latency > 0 && latency < 50 && 'bg-green-500',
                        latency >= 50 && latency < 200 && 'bg-yellow-500',
                        latency >= 200 && 'bg-red-500'
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
            <CardDescription>Runtime environment details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Status" value={
              <Badge variant={overallStatus === 'healthy' ? 'default' : overallStatus === 'degraded' ? 'secondary' : 'destructive'}>
                {overallStatus}
              </Badge>
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
            <CardDescription>Node.js process memory breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
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
    <Badge variant="outline" className={cn(
      'capitalize',
      status === 'healthy' && 'border-green-500 bg-green-500/10 text-green-600',
      status === 'degraded' && 'border-yellow-500 bg-yellow-500/10 text-yellow-600',
      status === 'error' && 'border-red-500 bg-red-500/10 text-red-600',
      status === 'unknown' && 'border-gray-400 bg-gray-400/10 text-gray-600'
    )}>
      <span className={cn(
        'mr-1.5 inline-block h-2 w-2 rounded-full',
        status === 'healthy' && 'animate-pulse bg-green-500',
        status === 'degraded' && 'animate-pulse bg-yellow-500',
        status === 'error' && 'bg-red-500',
        status === 'unknown' && 'bg-gray-400'
      )} />
      {status}
    </Badge>
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
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-xl font-bold">{formatBytes(value)}</p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn(
          'h-full',
          percent < 50 && 'bg-green-500',
          percent >= 50 && percent < 75 && 'bg-yellow-500',
          percent >= 75 && 'bg-red-500'
        )} style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  )
}

function HealthSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <Skeleton className="h-28 w-full" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-36" />)}
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
