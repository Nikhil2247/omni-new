'use client'

import { useEffect } from 'react'
import { RoleGuard } from '@/components/auth'
import { ROLES } from '@/config/roles'
import { useBlogPosts } from '@/hooks/queries/use-marketing'
import { useUmami } from '@/hooks/use-umami'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

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
      <div>
        <h1 className="text-lg font-semibold">Marketing analytics</h1>
        <p className="text-muted-foreground">Performance summary for marketing content.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content metrics</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {isLoading ? (
            <Skeleton className="h-24" />
          ) : (
            <>
              <MetricItem label="Total posts" value={totalPosts} />
              <MetricItem label="Published" value={published} />
              <MetricItem label="Drafts" value={drafts} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
    </RoleGuard>
  )
}

function MetricItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  )
}
