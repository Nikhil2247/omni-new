'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Edit, Eye, Megaphone, Pause, Play, Trash2, Wallet } from 'lucide-react'
import {
  useCancelMarketingCampaign,
  useMarketingCampaignList,
  usePauseMarketingCampaign,
  useResumeMarketingCampaign,
  useUpdateMarketingCampaign,
} from '@/hooks/queries/use-marketing'
import { useUmami } from '@/hooks/use-umami'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DataTable, FilterSelect, PageHeader, StatCard, StatGrid, StatusBadge, TwoLineCell, type DataColumn } from '@/components/dash'
import type { MarketingCampaign, MarketingCampaignStatus, MarketingCampaignType } from '@/lib/api/types/marketing.types'

const campaignTypeLabels: Record<MarketingCampaignType, string> = {
  PROFILE_BOOST: 'Profile boost',
  ALBUM_PROMOTION: 'Album promotion',
  BANNER_AD: 'Banner ad',
  FEATURED_LISTING: 'Featured listing',
}

const editableStatuses: MarketingCampaignStatus[] = ['DRAFT', 'SCHEDULED']

export default function MarketingCampaignsPage() {
  const { track } = useUmami()
  const [keyword, setKeyword] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<MarketingCampaignStatus | 'ALL'>('ALL')
  const [type, setType] = useState<MarketingCampaignType | 'ALL'>('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [editingCampaign, setEditingCampaign] = useState<MarketingCampaign | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editDailyBudget, setEditDailyBudget] = useState('')
  const [editTotalBudget, setEditTotalBudget] = useState('')
  const [editEndDate, setEditEndDate] = useState('')

  const params = useMemo(
    () => ({
      status: status === 'ALL' ? undefined : status,
      type: type === 'ALL' ? undefined : type,
      search: search.trim() || undefined,
      page: currentPage,
      limit: 20,
    }),
    [status, type, search, currentPage],
  )

  const { data, isLoading } = useMarketingCampaignList(params)
  const pauseMutation = usePauseMarketingCampaign()
  const resumeMutation = useResumeMarketingCampaign()
  const cancelMutation = useCancelMarketingCampaign()
  const updateMutation = useUpdateMarketingCampaign(editingCampaign?.id ?? '')

  useEffect(() => {
    const timer = setTimeout(() => setSearch(keyword), 300)
    return () => clearTimeout(timer)
  }, [keyword])

  useEffect(() => {
    setCurrentPage(1)
  }, [status, type, search])

  useEffect(() => {
    track('marketing:campaigns:page_view', {
      totalCampaigns: data?.meta?.total || data?.data?.length || 0,
      filterStatus: status,
      filterType: type,
    })
  }, [data, status, type, track])

  const handleOpenEdit = (campaign: MarketingCampaign) => {
    setEditingCampaign(campaign)
    setEditName(campaign.name)
    setEditDescription(campaign.description || '')
    setEditDailyBudget(String(campaign.dailyBudget))
    setEditTotalBudget(String(campaign.totalBudget))
    setEditEndDate(campaign.endDate ? toDateInput(campaign.endDate) : '')
  }

  const handleSaveEdit = async () => {
    if (!editingCampaign) {
      return
    }

    await updateMutation.mutateAsync({
      name: editName.trim(),
      description: editDescription.trim() || undefined,
      dailyBudget: Number(editDailyBudget),
      totalBudget: Number(editTotalBudget),
      endDate: editEndDate ? new Date(editEndDate).toISOString() : undefined,
    })

    setEditingCampaign(null)
  }

  const campaignRows = data?.data ?? []
  const summary = useMemo(() => {
    return campaignRows.reduce(
      (acc, campaign) => {
        acc.total += 1
        if (campaign.status === 'ACTIVE') {
          acc.active += 1
        }
        if (campaign.status === 'PAUSED') {
          acc.paused += 1
        }
        acc.totalSpend += campaign.creditsSpent
        acc.totalBudget += campaign.totalBudget
        return acc
      },
      { total: 0, active: 0, paused: 0, totalSpend: 0, totalBudget: 0 },
    )
  }, [campaignRows])

  const columns: DataColumn<MarketingCampaign>[] = [
    {
      id: 'name',
      header: 'Name',
      cell: (c) => <TwoLineCell title={c.name} subtitle={c.id} />,
      sortValue: (c) => c.name,
      exportValue: (c) => c.name,
    },
    { id: 'type', header: 'Type', cell: (c) => campaignTypeLabels[c.type], sortValue: (c) => c.type, exportValue: (c) => campaignTypeLabels[c.type] },
    { id: 'status', header: 'Status', cell: (c) => <StatusBadge status={c.status} />, sortValue: (c) => c.status, exportValue: (c) => c.status },
    {
      id: 'budget',
      header: 'Budget',
      cell: (c) => <span className="text-muted-foreground">{c.creditsSpent} / {c.totalBudget}</span>,
      sortValue: (c) => c.totalBudget,
      exportValue: (c) => `${c.creditsSpent} / ${c.totalBudget}`,
    },
    {
      id: 'performance',
      header: 'Performance',
      cell: (c) => <span className="text-muted-foreground">{c.impressions} impressions • {c.clicks} clicks</span>,
      sortValue: (c) => c.impressions,
      exportValue: (c) => `${c.impressions} impressions, ${c.clicks} clicks`,
      hideBelow: 'md',
    },
    {
      id: 'endDate',
      header: 'End date',
      cell: (c) => (c.endDate ? formatDate(c.endDate) : '—'),
      sortValue: (c) => (c.endDate ? new Date(c.endDate) : null),
      exportValue: (c) => (c.endDate ? formatDate(c.endDate) : ''),
    },
  ]

  return (
    <div className="space-y-2">
      <PageHeader
        title="Campaigns"
        actions={
          <Button asChild size="sm">
            <Link href="/marketing/campaigns/new">Create campaign</Link>
          </Button>
        }
      />

      <StatGrid>
        <StatCard label="Visible campaigns" value={summary.total} icon={Megaphone} />
        <StatCard label="Active now" value={summary.active} icon={Play} accent="text-success" />
        <StatCard label="Paused" value={summary.paused} icon={Pause} accent="text-warning" />
        <StatCard label="Spend / budget" value={`${summary.totalSpend} / ${summary.totalBudget}`} icon={Wallet} />
      </StatGrid>

      <DataTable
        data={campaignRows}
        columns={columns}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        search={{ value: keyword, onChange: setKeyword, placeholder: 'Search campaigns' }}
        filters={
          <>
            <FilterSelect
              label="Status"
              value={status}
              onChange={(value) => setStatus(value as MarketingCampaignStatus | 'ALL')}
              allValue="ALL"
              options={[
                { value: 'DRAFT', label: 'Draft' },
                { value: 'PENDING_APPROVAL', label: 'Pending approval' },
                { value: 'APPROVED', label: 'Approved' },
                { value: 'REJECTED', label: 'Rejected' },
                { value: 'SCHEDULED', label: 'Scheduled' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'PAUSED', label: 'Paused' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]}
            />
            <FilterSelect
              label="Type"
              value={type}
              onChange={(value) => setType(value as MarketingCampaignType | 'ALL')}
              allValue="ALL"
              options={[
                { value: 'PROFILE_BOOST', label: 'Profile boost' },
                { value: 'ALBUM_PROMOTION', label: 'Album promotion' },
                { value: 'BANNER_AD', label: 'Banner ad' },
                { value: 'FEATURED_LISTING', label: 'Featured listing' },
              ]}
            />
          </>
        }
        rowActions={(campaign) => [
          { label: 'View', icon: Eye, href: `/marketing/campaigns/${campaign.id}` },
          {
            label: 'Edit',
            icon: Edit,
            visible: editableStatuses.includes(campaign.status),
            onClick: () => handleOpenEdit(campaign),
          },
          {
            label: 'Pause',
            icon: Pause,
            visible: campaign.status === 'ACTIVE',
            disabled: pauseMutation.isPending,
            onClick: () => pauseMutation.mutate(campaign.id),
          },
          {
            label: 'Resume',
            icon: Play,
            visible: campaign.status === 'PAUSED',
            disabled: resumeMutation.isPending,
            onClick: () => resumeMutation.mutate(campaign.id),
          },
          {
            label: 'Delete',
            icon: Trash2,
            danger: true,
            visible: campaign.status !== 'COMPLETED' && campaign.status !== 'CANCELLED',
            disabled: cancelMutation.isPending,
            confirm: {
              title: 'Delete this campaign?',
              description: 'This will cancel it immediately.',
            },
            onClick: async () => {
              await cancelMutation.mutateAsync(campaign.id)
            },
          },
        ]}
        exportFilename="campaigns"
        emptyTitle="No campaigns available"
        serverPagination={{
          page: currentPage,
          pageSize: 20,
          total: data?.meta?.total ?? campaignRows.length,
          onPageChange: setCurrentPage,
        }}
      />

      <Dialog open={Boolean(editingCampaign)} onOpenChange={(open) => !open && setEditingCampaign(null)}>
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
              <Textarea
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                rows={3}
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm font-medium">Daily budget</p>
                <Input
                  type="number"
                  min={1}
                  value={editDailyBudget}
                  onChange={(event) => setEditDailyBudget(event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Total budget</p>
                <Input
                  type="number"
                  min={1}
                  value={editTotalBudget}
                  onChange={(event) => setEditTotalBudget(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">End date</p>
              <Input
                type="date"
                value={editEndDate}
                onChange={(event) => setEditEndDate(event.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setEditingCampaign(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={updateMutation.isPending || !editName.trim()}>
                {updateMutation.isPending ? 'Saving...' : 'Save changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
