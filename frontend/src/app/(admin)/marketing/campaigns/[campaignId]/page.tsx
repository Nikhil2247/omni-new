'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Edit, Pause, Play, Trash2 } from 'lucide-react'
import {
  useCancelMarketingCampaign,
  useMarketingCampaign,
  useMarketingCampaignStats,
  usePauseMarketingCampaign,
  useResumeMarketingCampaign,
  useUpdateMarketingCampaign,
} from '@/hooks/queries/use-marketing'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmDialog, PageHeader, StatCard, StatGrid, StatusBadge } from '@/components/dash'

const editableStatuses = new Set(['DRAFT', 'SCHEDULED'])

export default function MarketingCampaignDetailPage() {
  const params = useParams()
  const campaignId = useMemo(() => {
    const value = params?.campaignId
    return Array.isArray(value) ? value[0] : value
  }, [params])

  const { data: campaign, isLoading } = useMarketingCampaign(campaignId ?? '')
  const { data: stats, isLoading: statsLoading } = useMarketingCampaignStats(campaignId ?? '')
  const pauseMutation = usePauseMarketingCampaign()
  const resumeMutation = useResumeMarketingCampaign()
  const cancelMutation = useCancelMarketingCampaign()
  const updateMutation = useUpdateMarketingCampaign(campaignId ?? '')

  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editDailyBudget, setEditDailyBudget] = useState('')
  const [editTotalBudget, setEditTotalBudget] = useState('')
  const [editEndDate, setEditEndDate] = useState('')

  const openEdit = () => {
    if (!campaign) {
      return
    }
    setEditName(campaign.name)
    setEditDescription(campaign.description || '')
    setEditDailyBudget(String(campaign.dailyBudget))
    setEditTotalBudget(String(campaign.totalBudget))
    setEditEndDate(campaign.endDate ? toDateInput(campaign.endDate) : '')
    setEditing(true)
  }

  const saveEdit = async () => {
    await updateMutation.mutateAsync({
      name: editName.trim(),
      description: editDescription.trim() || undefined,
      dailyBudget: Number(editDailyBudget),
      totalBudget: Number(editTotalBudget),
      endDate: editEndDate ? new Date(editEndDate).toISOString() : undefined,
    })
    setEditing(false)
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-40" />
      </div>
    )
  }

  if (!campaign) {
    return <div className="text-sm text-muted-foreground">Campaign not found.</div>
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title={campaign.name}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/marketing/campaigns">Back to campaigns</Link>
            </Button>
            {editableStatuses.has(campaign.status) && (
              <Button variant="outline" size="icon" className="size-8" aria-label="Edit campaign" onClick={openEdit}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {campaign.status === 'ACTIVE' && (
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                aria-label="Pause campaign"
                onClick={() => pauseMutation.mutate(campaign.id)}
                disabled={pauseMutation.isPending}
              >
                <Pause className="h-4 w-4" />
              </Button>
            )}
            {campaign.status === 'PAUSED' && (
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                aria-label="Resume campaign"
                onClick={() => resumeMutation.mutate(campaign.id)}
                disabled={resumeMutation.isPending}
              >
                <Play className="h-4 w-4" />
              </Button>
            )}
            {campaign.status !== 'COMPLETED' && campaign.status !== 'CANCELLED' && (
              <Button
                variant="destructive"
                size="icon"
                className="size-8"
                aria-label="Delete campaign"
                onClick={() => setConfirmDelete(true)}
                disabled={cancelMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </>
        }
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this campaign?"
        description="This will cancel it immediately."
        loading={cancelMutation.isPending}
        onConfirm={async () => {
          await cancelMutation.mutateAsync(campaign.id)
        }}
      />

      <StatGrid>
        <StatCard label="Impressions" value={String(stats?.impressions ?? campaign.impressions)} />
        <StatCard label="Clicks" value={String(stats?.clicks ?? campaign.clicks)} />
        <StatCard label="CTR" value={statsLoading ? '…' : `${(stats?.ctr ?? 0).toFixed(2)}%`} />
        <StatCard label="Conversions" value={String(stats?.conversions ?? campaign.conversions)} />
      </StatGrid>

      <div className="grid gap-3 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-sm">Performance and budget</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <InfoRow label="Type" value={campaign.type} />
              <InfoRow label="Status" value={campaign.status} badge={true} />
              <InfoRow label="Daily budget" value={`${campaign.dailyBudget} credits`} />
              <InfoRow label="Total budget" value={`${campaign.totalBudget} credits`} />
              <InfoRow label="Spent" value={`${stats?.creditsSpent ?? campaign.creditsSpent} credits`} />
              <InfoRow label="Remaining" value={`${stats?.remainingBudget ?? (campaign.totalBudget - campaign.creditsSpent)} credits`} />
              <InfoRow label="Start date" value={campaign.startDate ? formatDate(campaign.startDate) : '—'} />
              <InfoRow label="End date" value={campaign.endDate ? formatDate(campaign.endDate) : '—'} />
              <InfoRow label="Cost per click" value={`${(stats?.costPerClick ?? 0).toFixed(2)} credits`} loading={statsLoading} />
              <InfoRow label="Cost per conversion" value={`${(stats?.costPerConversion ?? 0).toFixed(2)} credits`} loading={statsLoading} />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Budget utilization</span>
                <span className="font-medium">{(stats?.budgetUtilization ?? campaign.creditsSpent / Math.max(campaign.totalBudget, 1) * 100).toFixed(1)}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${Math.min(stats?.budgetUtilization ?? (campaign.creditsSpent / Math.max(campaign.totalBudget, 1) * 100), 100)}%`,
                  }}
                />
              </div>
            </div>

            {campaign.description ? (
              <div className="rounded-lg border p-3 text-sm">
                <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Description</p>
                <p>{campaign.description}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-sm">Latest daily stats</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            {statsLoading ? (
              <Skeleton className="h-24" />
            ) : stats?.dailyStats?.length ? (
              <div className="space-y-2">
                {stats.dailyStats.slice(0, 7).map((row) => (
                  <div key={row.date} className="rounded-md border px-2 py-1.5 text-sm">
                    <p className="font-medium">{formatDate(row.date)}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.impressions} imp • {row.clicks} clicks • {row.conversions} conv • {row.creditsSpent} credits
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No daily stats yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="space-y-1">
              <p className="text-sm font-medium">Campaign name</p>
              <Input value={editName} onChange={(event) => setEditName(event.target.value)} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Description</p>
              <Textarea value={editDescription} onChange={(event) => setEditDescription(event.target.value)} rows={3} />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm font-medium">Daily budget</p>
                <Input type="number" min={1} value={editDailyBudget} onChange={(event) => setEditDailyBudget(event.target.value)} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Total budget</p>
                <Input type="number" min={1} value={editTotalBudget} onChange={(event) => setEditTotalBudget(event.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">End date</p>
              <Input type="date" value={editEndDate} onChange={(event) => setEditEndDate(event.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              <Button onClick={saveEdit} disabled={updateMutation.isPending || !editName.trim()}>
                {updateMutation.isPending ? 'Saving...' : 'Save changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InfoRow({
  label,
  value,
  badge,
  loading,
}: {
  label: string
  value: string
  badge?: boolean
  loading?: boolean
}) {
  return (
    <div className="flex items-center justify-between rounded-md border px-2 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {loading ? (
        <Skeleton className="h-4 w-16" />
      ) : badge ? (
        <StatusBadge status={value} />
      ) : (
        <span className="font-medium">{value}</span>
      )}
    </div>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)
}

function toDateInput(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return date.toISOString().slice(0, 10)
}
