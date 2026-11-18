'use client'

import { useOpsDashboardMetrics } from '@/hooks/queries/use-ops-dashboard'
import { StatCard, StatGrid } from '@/components/dash'

export function OpsReportsOverview() {
  const { data, isLoading, error } = useOpsDashboardMetrics()

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading reports...</div>
  }

  if (error) {
    return <div className="text-sm text-destructive">Failed to load reports.</div>
  }

  if (!data) {
    return <div className="text-sm text-muted-foreground">No report data available.</div>
  }

  return (
    <StatGrid>
      <StatCard label="Active Events" value={data.activeEvents.total} />
      <StatCard label="Pending KYC" value={data.kyc.pending} />
      <StatCard label="Open Disputes" value={data.disputes.open} />
      <StatCard label="Overdue Tasks" value={data.tasks.overdue} />
    </StatGrid>
  )
}
