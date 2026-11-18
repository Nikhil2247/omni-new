'use client'

import { useEffect } from 'react'
import { RoleGuard } from '@/components/auth'
import { ROLES } from '@/config/roles'
import { useBlogPosts } from '@/hooks/queries/use-marketing'
import { useUmami } from '@/hooks/use-umami'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader, StatCard, StatGrid } from '@/components/dash'
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
    <div className="space-y-3">
      <PageHeader title="Marketing analytics" />

      {isLoading ? (
        <Skeleton className="h-16" />
      ) : (
        <StatGrid className="lg:grid-cols-3">
          <StatCard label="Total posts" value={totalPosts} icon={FileText} />
          <StatCard label="Published" value={published} icon={CheckCircle2} accent="text-success" />
          <StatCard label="Drafts" value={drafts} icon={FilePen} accent="text-warning" />
        </StatGrid>
      )}
    </div>
    </RoleGuard>
  )
}
