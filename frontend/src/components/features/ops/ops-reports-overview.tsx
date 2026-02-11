'use client'

import { useOpsDashboardMetrics } from '@/hooks/queries/use-ops-dashboard'

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
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <ReportCard label="Active Events" value={data.activeEvents.total} />
      <ReportCard label="Pending KYC" value={data.kyc.pending} />
      <ReportCard label="Open Disputes" value={data.disputes.open} />
      <ReportCard label="Overdue Tasks" value={data.tasks.overdue} />
    </div>
  )
}

function ReportCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  )
}
