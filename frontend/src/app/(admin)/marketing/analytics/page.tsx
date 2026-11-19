'use client'

import { useEffect } from 'react'
import { RoleGuard } from '@/components/auth'
import { ROLES } from '@/config/roles'
import { useBlogPosts } from '@/hooks/queries/use-marketing'
import { useUmami } from '@/hooks/use-umami'
import { KpiCard, KpiGrid, PageHeader, Panel, SegmentedBar } from '@/components/dash'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, CheckCircle2, FilePen } from 'lucide-react'

export default function MarketingAnalyticsPage() {
  const { data, isLoading } = useBlogPosts({ page: 1, limit: 50 })
  const { track } = useUmami()

  const totalPosts = data?.data?.length ?? 0
  const published = data?.data?.filter((post) => post.status === 'PUBLISHED').length ?? 0
  const drafts = data?.data?.filter((post) => post.status === 'DRAFT').length ?? 0

  useEffect(() => {
    track('marketing:analytics:page_view', { totalPosts, published, drafts })
  }, [totalPosts, published, drafts, track])

  return (
    <RoleGuard allowedRoles={[ROLES.ADMIN_SYSTEM, ROLES.MARKETING_SERVICES_ADMIN, ROLES.MULTI_MEDIA_MANAGER]} redirectOnFail={true}>
      <div className="space-y-4">
        <PageHeader title="Marketing analytics" />

        <KpiGrid cols={3}>
          <KpiCard label="Total posts" value={totalPosts} icon={FileText} loading={isLoading} hint="Latest 50 posts" />
          <KpiCard label="Published" value={published} icon={CheckCircle2} loading={isLoading} />
          <KpiCard label="Drafts" value={drafts} icon={FilePen} loading={isLoading} />
        </KpiGrid>

        <Panel title="Content by status" icon={FileText} description="Based on the latest 50 posts">
          {isLoading ? (
            <Skeleton className="h-16" />
          ) : (
            <SegmentedBar
              emptyLabel="No posts yet."
              segments={[
                { label: 'Published', value: published, tone: 'primary' },
                { label: 'Drafts', value: drafts, tone: 'primary' },
              ]}
            />
          )}
        </Panel>
      </div>
    </RoleGuard>
  )
}
