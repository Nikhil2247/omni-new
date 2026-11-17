'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Edit, Pause, Play, Search, Trash2 } from 'lucide-react'
import {
  useCancelMarketingCampaign,
  useMarketingCampaignList,
  usePauseMarketingCampaign,
  useResumeMarketingCampaign,
  useUpdateMarketingCampaign,
} from '@/hooks/queries/use-marketing'
import { useUmami } from '@/hooks/use-umami'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Campaigns</h1>
          <p className="text-muted-foreground">Edit, pause/resume, and retire campaigns from one place.</p>
        </div>
        <Button asChild>
          <Link href="/marketing/campaigns/new">Create campaign</Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle>Campaign list</CardTitle>
          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={keyword}
                placeholder="Search campaigns"
                className="pl-8"
                onChange={(event) => setKeyword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    setSearch(keyword)
                  }
                }}
              />
            </div>
            <Button variant="outline" onClick={() => setSearch(keyword)}>
              Apply
            </Button>
            <Select value={status} onValueChange={(value) => setStatus(value as MarketingCampaignStatus | 'ALL')}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PENDING_APPROVAL">Pending approval</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PAUSED">Paused</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={(value) => setType(value as MarketingCampaignType | 'ALL')}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All types</SelectItem>
                <SelectItem value="PROFILE_BOOST">Profile boost</SelectItem>
                <SelectItem value="ALBUM_PROMOTION">Album promotion</SelectItem>
                <SelectItem value="BANNER_AD">Banner ad</SelectItem>
                <SelectItem value="FEATURED_LISTING">Featured listing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40" />
          ) : campaignRows.length ? (
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>End date</TableHead>
                  <TableHead className="sticky right-0 z-20 min-w-44 bg-background text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaignRows.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <p className="font-medium">{campaign.name}</p>
                      <p className="text-xs text-muted-foreground">{campaign.id}</p>
                    </TableCell>
                    <TableCell>{campaignTypeLabels[campaign.type]}</TableCell>
                    <TableCell>
                      <Badge variant={campaign.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {campaign.creditsSpent} / {campaign.totalBudget}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {campaign.impressions} impressions • {campaign.clicks} clicks
                    </TableCell>
                    <TableCell>{campaign.endDate ? formatDate(campaign.endDate) : '—'}</TableCell>
                    <TableCell className="sticky right-0 z-10 bg-background text-right">
                      <div className="flex items-center justify-end gap-2">
                        {editableStatuses.includes(campaign.status) && (
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label="Edit campaign"
                            title="Edit"
                            onClick={() => handleOpenEdit(campaign)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {campaign.status === 'ACTIVE' && (
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label="Pause campaign"
                            title="Pause"
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
                            aria-label="Resume campaign"
                            title="Resume"
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
                            aria-label="Delete campaign"
                            title="Delete"
                            onClick={async () => {
                              if (!window.confirm('Delete this campaign? This will cancel it immediately.')) {
                                return
                              }
                              await cancelMutation.mutateAsync(campaign.id)
                            }}
                            disabled={cancelMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/marketing/campaigns/${campaign.id}`}>View</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No campaigns available.</p>
          )}

          {data?.meta?.totalPages && data.meta.totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between gap-3 border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Page {data.meta.page} of {data.meta.totalPages} • {data.meta.total} campaigns
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.meta.hasPreviousPage || isLoading}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.meta.hasNextPage || isLoading}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Visible campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{summary.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Active now</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{summary.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Paused</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{summary.paused}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Spend / budget</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{summary.totalSpend} / {summary.totalBudget}</p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(editingCampaign)} onOpenChange={(open) => !open && setEditingCampaign(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">Campaign name</p>
              <Input value={editName} onChange={(event) => setEditName(event.target.value)} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Description</p>
              <Textarea
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                rows={4}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
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
            <div className="flex justify-end gap-2 pt-2">
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
