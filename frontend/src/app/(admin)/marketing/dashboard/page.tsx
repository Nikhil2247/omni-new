'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { RoleGuard } from '@/components/auth'
import { useAuthStore } from '@/store/auth-store'
import { Role, ROLE_LABELS, ROLES } from '@/config/roles'
import { useBlogPosts, useMarketingCampaigns, useMarketingMedia, useMarketingPromotions } from '@/hooks/queries/use-marketing'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, Image, Eye, Megaphone, PenLine, BarChart3 } from 'lucide-react'

export default function MarketingDashboardPage() {
  const { user } = useAuthStore()
  const roleLabel = user?.role ? ROLE_LABELS[user.role as Role] : ''

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Marketing dashboard</h1>
        <p className="text-muted-foreground">
          Welcome, {user?.name || 'Team Member'} {roleLabel ? `(${roleLabel})` : ''}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Published articles" value={publishedCount} icon={FileText} />
        <StatCard title="Drafts" value={draftCount} icon={Eye} />
        <StatCard title="Media assets" value={media?.length ?? 0} icon={Image} loading={mediaLoading} />
        <StatCard title="Active campaigns" value={campaigns?.length ?? 0} icon={Megaphone} loading={campaignsLoading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent content</CardTitle>
            <Link href="/marketing/content" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {postsLoading ? (
              <Skeleton className="h-32" />
            ) : posts?.data?.length ? (
              posts.data.map((post) => (
                <ContentItem key={post.id} title={post.title} status={post.status} updatedAt={post.updatedAt} />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No content found.</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <QuickAction icon={PenLine} label="Create new post" href="/marketing/content/new" />
              <QuickAction icon={Image} label="Media library" href="/marketing/media" />
              <QuickAction icon={Megaphone} label="Campaigns" href="/marketing/campaigns" />
              <QuickAction icon={BarChart3} label="Analytics" href="/marketing/analytics" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatusItem label="Published" count={publishedCount} />
              <StatusItem label="Drafts" count={draftCount} />
              <StatusItem label="Promotions" count={promotions?.length ?? 0} loading={promotionsLoading} />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Campaigns snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {campaignsLoading ? (
              <Skeleton className="h-24" />
            ) : campaigns?.length ? (
              campaigns.map((campaign) => (
                <CampaignItem key={campaign.id} name={campaign.name} status={campaign.status} endsAt={campaign.endsAt} />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No campaigns available.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Promotion pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {promotionsLoading ? (
              <Skeleton className="h-24" />
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

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
}: {
  title: string
  value: number
  icon: React.ElementType
  loading?: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-6 w-16" /> : <p className="text-2xl font-semibold">{value}</p>}
      </CardContent>
    </Card>
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
    <div className="flex items-center justify-between rounded-md border p-4">
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-xs text-muted-foreground">Updated {formatDate(updatedAt)}</p>
      </div>
      <Badge variant={status === 'PUBLISHED' ? 'default' : status === 'DRAFT' ? 'secondary' : 'outline'}>
        {status}
      </Badge>
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
    <Link href={href} className="flex items-center gap-3 rounded-md border p-3 text-sm">
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
    <div className="flex items-center justify-between rounded-md border p-4">
      <div>
        <h3 className="font-medium">{name}</h3>
        <p className="text-xs text-muted-foreground">Ends {endsAt ? formatDate(endsAt) : '—'}</p>
      </div>
      <Badge variant={status === 'ACTIVE' ? 'default' : 'secondary'}>{status || 'UNKNOWN'}</Badge>
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
