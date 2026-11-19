'use client'

import Link from 'next/link'
import { useEffect, useMemo } from 'react'
import {
  BarChart3,
  Eye,
  FileText,
  Image as ImageIcon,
  Megaphone,
  MousePointerClick,
  PenLine,
  Percent,
  Sparkles,
  Tag,
} from 'lucide-react'
import { RoleGuard } from '@/components/auth'
import { ROLES } from '@/config/roles'
import { useAuth } from '@/hooks/use-auth'
import { trackDashboard } from '@/lib/analytics/umami'
import { useBlogPosts, useMarketingCampaigns, useMarketingMedia, useMarketingPromotions } from '@/hooks/queries/use-marketing'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DashboardHero,
  HeroChip,
  KpiCard,
  KpiGrid,
  ListRow,
  ListStack,
  Panel,
  PanelEmpty,
  QuickActionTile,
  SegmentedBar,
  StatusBadge,
  WidgetBoard,
  type BoardWidget,
} from '@/components/dash'

const compact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 })

export default function MarketingDashboardPage() {
  const { user } = useAuth()

  useEffect(() => {
    trackDashboard.view('marketing')
  }, [])

  const { data: recent, isLoading: recentLoading } = useBlogPosts({ page: 1, limit: 6 })
  // Totals come from server-side counts, not from the 6 rows shown in "Recent content".
  const { data: published, isLoading: publishedLoading } = useBlogPosts({ status: 'PUBLISHED', page: 1, limit: 1 })
  const { data: drafts, isLoading: draftsLoading } = useBlogPosts({ status: 'DRAFT', page: 1, limit: 1 })
  const { data: campaigns, isLoading: campaignsLoading } = useMarketingCampaigns()
  const { data: media, isLoading: mediaLoading } = useMarketingMedia()
  const { data: promotions, isLoading: promotionsLoading } = useMarketingPromotions()

  const publishedCount = published?.meta?.total ?? published?.data?.length ?? 0
  const draftCount = drafts?.meta?.total ?? drafts?.data?.length ?? 0

  const perf = useMemo(() => {
    const list = campaigns ?? []
    const impressions = list.reduce((s, c) => s + (c.impressions ?? 0), 0)
    const clicks = list.reduce((s, c) => s + (c.clicks ?? 0), 0)
    const active = list.filter((c) => String(c.status).toUpperCase() === 'ACTIVE').length
    return { impressions, clicks, active, ctr: impressions > 0 ? (clicks / impressions) * 100 : 0 }
  }, [campaigns])

  const firstName = user?.name?.split(' ')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const widgets: BoardWidget[] = [
    {
      id: 'recent-content',
      title: 'Recent content',
      span: 8,
      content: (
        <Panel title="Recent content" icon={FileText} action={{ label: 'View all', href: '/marketing/content' }}>
          {recentLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : recent?.data?.length ? (
            <ListStack>
              {recent.data.map((post) => (
                <ListRow
                  key={post.id}
                  icon={FileText}
                  tone="primary"
                  href={`/marketing/content/${post.id}`}
                  title={post.title}
                  meta={`Updated ${formatDate(post.updatedAt)}`}
                  trailing={<StatusBadge status={post.status} />}
                />
              ))}
            </ListStack>
          ) : (
            <PanelEmpty icon={PenLine} action={{ label: 'Write your first post', href: '/marketing/content/new' }}>
              No content yet.
            </PanelEmpty>
          )}
        </Panel>
      ),
    },
    {
      id: 'quick-actions',
      title: 'Quick actions',
      span: 4,
      content: (
        <Panel title="Quick actions" icon={Sparkles}>
          <div className="space-y-2">
            <QuickActionTile icon={PenLine} tone="primary" label="Create new post" hint="Start a blog draft" href="/marketing/content/new" />
            <QuickActionTile icon={ImageIcon} tone="info" label="Media library" hint="Upload and organise assets" href="/marketing/media" />
            <QuickActionTile icon={Megaphone} tone="warning" label="Campaigns" hint="Create or review campaigns" href="/marketing/campaigns" />
            <QuickActionTile icon={BarChart3} tone="success" label="Analytics" hint="See what is performing" href="/marketing/analytics" />
          </div>
        </Panel>
      ),
    },
    {
      id: 'content-status',
      title: 'Content pipeline',
      span: 4,
      content: (
        <Panel title="Content pipeline" icon={FileText} description="Posts by status">
          {publishedLoading || draftsLoading ? (
            <Skeleton className="h-16" />
          ) : (
            <SegmentedBar
              emptyLabel="No posts yet."
              segments={[
                { label: 'Published', value: publishedCount, tone: 'success' },
                { label: 'Drafts', value: draftCount, tone: 'warning' },
              ]}
            />
          )}
        </Panel>
      ),
    },
    {
      id: 'campaigns',
      title: 'Campaigns snapshot',
      span: 4,
      content: (
        <Panel title="Campaigns snapshot" icon={Megaphone} action={{ label: 'View all', href: '/marketing/campaigns' }}>
          {campaignsLoading ? (
            <Skeleton className="h-16" />
          ) : campaigns?.length ? (
            <ListStack>
              {campaigns.slice(0, 5).map((c) => (
                <ListRow
                  key={c.id}
                  href={`/marketing/campaigns/${c.id}`}
                  title={c.name}
                  meta={`Ends ${c.endDate ? formatDate(c.endDate) : '—'}`}
                  trailing={<StatusBadge status={c.status || 'UNKNOWN'} />}
                />
              ))}
            </ListStack>
          ) : (
            <PanelEmpty icon={Megaphone} action={{ label: 'Create a campaign', href: '/marketing/campaigns/new' }}>
              No campaigns yet.
            </PanelEmpty>
          )}
        </Panel>
      ),
    },
    {
      id: 'promotions',
      title: 'Promotion pipeline',
      span: 4,
      content: (
        <Panel title="Promotion pipeline" icon={Tag} action={{ label: 'View all', href: '/marketing/promotions' }}>
          {promotionsLoading ? (
            <Skeleton className="h-16" />
          ) : promotions?.length ? (
            <ListStack>
              {promotions.slice(0, 5).map((p) => (
                <ListRow
                  key={p.id}
                  title={p.name}
                  meta={`Ends ${p.endsAt ? formatDate(p.endsAt) : '—'}`}
                  trailing={<StatusBadge status={p.status || 'UNKNOWN'} />}
                />
              ))}
            </ListStack>
          ) : (
            <PanelEmpty icon={Tag}>No promotions configured.</PanelEmpty>
          )}
        </Panel>
      ),
    },
  ]

  return (
    <RoleGuard
      allowedRoles={[ROLES.ADMIN_SYSTEM, ROLES.MARKETING_SERVICES_ADMIN, ROLES.MULTI_MEDIA_MANAGER]}
      redirectOnFail={true}
    >
      <div className="space-y-4">
        <DashboardHero
          eyebrow="Marketing"
          title={firstName ? `${greeting}, ${firstName}` : greeting}
          subtitle="Create content, run campaigns and keep an eye on what is working."
          actions={
            <>
              <Button asChild size="sm">
                <Link href="/marketing/content/new"><PenLine className="size-3.5" /> New post</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/marketing/campaigns/new"><Megaphone className="size-3.5" /> New campaign</Link>
              </Button>
            </>
          }
          aside={
            <>
              <HeroChip icon={Eye} tone="warning" label="Drafts waiting" value={draftsLoading ? '…' : draftCount} />
              <HeroChip icon={Megaphone} tone="success" label="Active campaigns" value={campaignsLoading ? '…' : perf.active} />
            </>
          }
        />

        <KpiGrid>
          <KpiCard label="Published articles" value={publishedCount} icon={FileText} tone="success" loading={publishedLoading} href="/marketing/content" />
          <KpiCard label="Drafts" value={draftCount} icon={PenLine} tone="warning" loading={draftsLoading} href="/marketing/content/drafts" />
          <KpiCard label="Media assets" value={media?.length ?? 0} icon={ImageIcon} tone="info" loading={mediaLoading} href="/marketing/media" />
          <KpiCard label="Campaigns" value={campaigns?.length ?? 0} icon={Megaphone} tone="primary" loading={campaignsLoading} hint={`${perf.active} active`} href="/marketing/campaigns" />
        </KpiGrid>

        {campaigns?.length ? (
          <KpiGrid cols={3}>
            <KpiCard label="Campaign impressions" value={compact.format(perf.impressions)} icon={Eye} tone="info" href="/marketing/analytics" />
            <KpiCard label="Campaign clicks" value={compact.format(perf.clicks)} icon={MousePointerClick} tone="primary" href="/marketing/analytics" />
            <KpiCard label="Click-through rate" value={`${perf.ctr.toFixed(2)}%`} icon={Percent} tone="success" href="/marketing/analytics" />
          </KpiGrid>
        ) : null}

        <WidgetBoard storageKey="marketing-dashboard" widgets={widgets} />
      </div>
    </RoleGuard>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)
}
