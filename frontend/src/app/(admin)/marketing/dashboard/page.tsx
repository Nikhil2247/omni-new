'use client'

import Link from 'next/link'
import { useEffect, useMemo } from 'react'
import { RoleGuard } from '@/components/auth'
import { ROLES } from '@/config/roles'
import { trackDashboard } from '@/lib/analytics/umami'
import { useBlogPosts, useMarketingCampaigns, useMarketingMedia, useMarketingPromotions } from '@/hooks/queries/use-marketing'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, Image, Eye, Megaphone, PenLine, BarChart3 } from 'lucide-react'
import { PageHeader, StatCard, StatGrid, StatusBadge } from '@/components/dash'

export default function MarketingDashboardPage() {

  useEffect(() => {
    trackDashboard.view('marketing')
  }, [])

  const { data: posts, isLoading: postsLoading } = useBlogPosts({ page: 1, limit: 5 })
  const { data: campaigns, isLoading: campaignsLoading } = useMarketingCampaigns()
  const { data: media, isLoading: mediaLoading } = useMarketingMedia()
  const { data: promotions, isLoading: promotionsLoading } = useMarketingPromotions()

  const publishedCount = useMemo(
    () => posts?.data?.filter((post) => post.status === 'PUBLISHED').length ?? 0,
    [posts]
  )
  const draftCount = useMemo(
    () => posts?.data?.filter((post) => post.status === 'DRAFT').length ?? 0,
    [posts]
  )

  return (
    <RoleGuard
      allowedRoles={[ROLES.ADMIN_SYSTEM, ROLES.MARKETING_SERVICES_ADMIN, ROLES.MULTI_MEDIA_MANAGER]}
      redirectOnFail={true}
    >
    <div className="space-y-3">
      <PageHeader title="Marketing dashboard" />

      <StatGrid>
        <StatCard label="Published articles" value={publishedCount} icon={FileText} />
        <StatCard label="Drafts" value={draftCount} icon={Eye} />
        <StatCard label="Media assets" value={mediaLoading ? '…' : (media?.length ?? 0)} icon={Image} />
        <StatCard label="Active campaigns" value={campaignsLoading ? '…' : (campaigns?.length ?? 0)} icon={Megaphone} />
      </StatGrid>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between p-3 pb-0">
            <CardTitle className="text-sm">Recent content</CardTitle>
            <Link href="/marketing/content" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-2 p-3">
            {postsLoading ? (
              <Skeleton className="h-20" />
            ) : posts?.data?.length ? (
              posts.data.map((post) => (
                <ContentItem key={post.id} title={post.title} status={post.status} updatedAt={post.updatedAt} />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No content found.</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Card>
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-sm">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 p-3">
              <QuickAction icon={PenLine} label="Create new post" href="/marketing/content/new" />
              <QuickAction icon={Image} label="Media library" href="/marketing/media" />
              <QuickAction icon={Megaphone} label="Campaigns" href="/marketing/campaigns" />
              <QuickAction icon={BarChart3} label="Analytics" href="/marketing/analytics" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-sm">Content status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-3">
              <StatusItem label="Published" count={publishedCount} />
              <StatusItem label="Drafts" count={draftCount} />
              <StatusItem label="Promotions" count={promotions?.length ?? 0} loading={promotionsLoading} />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-sm">Campaigns snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-3">
            {campaignsLoading ? (
              <Skeleton className="h-16" />
            ) : campaigns?.length ? (
              campaigns.map((campaign) => (
                <CampaignItem key={campaign.id} name={campaign.name} status={campaign.status} endsAt={campaign.endDate} />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No campaigns available.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-sm">Promotion pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-3">
            {promotionsLoading ? (
              <Skeleton className="h-16" />
            ) : promotions?.length ? (
              promotions.map((promotion) => (
                <CampaignItem key={promotion.id} name={promotion.name} status={promotion.status} endsAt={promotion.endsAt} />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No promotions configured.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </RoleGuard>
  )
}

function ContentItem({
  title,
  status,
  updatedAt,
}: {
  title: string
  status: string
  updatedAt: string
}) {
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2">
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-xs text-muted-foreground">Updated {formatDate(updatedAt)}</p>
      </div>
      <StatusBadge status={status} />
    </div>
  )
}

function QuickAction({
  icon: Icon,
  label,
  href,
}: {
  icon: React.ElementType
  label: string
  href: string
}) {
  return (
    <Link href={href} className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span>{label}</span>
    </Link>
  )
}

function StatusItem({
  label,
  count,
  loading,
}: {
  label: string
  count: number
  loading?: boolean
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span>{label}</span>
      {loading ? <Skeleton className="h-4 w-10" /> : <span className="font-medium">{count}</span>}
    </div>
  )
}

function CampaignItem({
  name,
  status,
  endsAt,
}: {
  name: string
  status?: string
  endsAt?: string | null
}) {
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2">
      <div>
        <h3 className="font-medium">{name}</h3>
        <p className="text-xs text-muted-foreground">Ends {endsAt ? formatDate(endsAt) : '—'}</p>
      </div>
      <StatusBadge status={status || "UNKNOWN"} />
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
